import { MigrationInterface, QueryRunner } from 'typeorm';

/** Tablas cuyo `owner_id` todavía apuntaba a `auth.users` (herencia de Supabase). */
const OWNED_TABLES = ['business_events', 'sales_notes', 'transactions'];

/**
 * Las llaves `owner_id` pasan de `auth.users` a `elnegocio.users`. Sin esto, un
 * usuario creado con `user-admin` no puede registrar notas, eventos ni movimientos.
 *
 *  - Antes de crear las llaves, da de alta en `elnegocio.users` a los dueños que
 *    falten, con el id y correo de `auth.users`. Si ahí no hay correo, o ese
 *    correo ya es de otro usuario, quedan inactivos con un correo `.invalid`.
 *    No se modifica ni se borra ningún registro de negocio.
 *  - `ON DELETE RESTRICT` (antes `CASCADE`): borrar un usuario no debe llevarse
 *    las notas, eventos y movimientos del negocio. Para quitar el acceso a quien
 *    tiene registros se desactiva (`is_active = false`) o se quita de
 *    `business_users`.
 */
export class RepointOwnerKeysToUsers1755200000000 implements MigrationInterface {
  name = 'RepointOwnerKeysToUsers1755200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const missingOwners = `
      SELECT o.owner_id AS id
        FROM (${OWNED_TABLES.map((t) => `SELECT owner_id FROM elnegocio.${t}`).join(' UNION ')}) o
       WHERE NOT EXISTS (SELECT 1 FROM elnegocio.users u WHERE u.id = o.owner_id)
    `;

    if (await this.hasAuthUsers(queryRunner)) {
      await queryRunner.query(`
        INSERT INTO elnegocio.users (id, email)
          SELECT a.id, lower(a.email) FROM auth.users a
           WHERE a.email IS NOT NULL AND a.id IN (${missingOwners})
          ON CONFLICT DO NOTHING
      `);
    }

    const placeholders = (await queryRunner.query(`
      INSERT INTO elnegocio.users (id, email, is_active)
        SELECT m.id, 'sin-correo-' || m.id || '@usuario.invalid', false
          FROM (${missingOwners}) m
      RETURNING id
    `)) as Array<{ id: string }>;
    if (placeholders.length > 0) {
      console.warn(
        `Dueños sin correo disponible, creados como usuarios inactivos: ${placeholders.map((u) => u.id).join(', ')}`,
      );
    }

    for (const table of OWNED_TABLES) {
      await queryRunner.query(`
        ALTER TABLE elnegocio.${table}
          DROP CONSTRAINT IF EXISTS "FK_${table}_owner",
          ADD CONSTRAINT "FK_${table}_owner" FOREIGN KEY (owner_id)
            REFERENCES elnegocio.users (id) ON DELETE RESTRICT
      `);
    }
  }

  /**
   * Vuelve a las llaves anteriores. `NOT VALID` evita que falle por los registros
   * de usuarios que no existen en `auth.users`. Los usuarios agregados se conservan.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasAuthUsers = await this.hasAuthUsers(queryRunner);
    for (const table of OWNED_TABLES) {
      await queryRunner.query(
        `ALTER TABLE elnegocio.${table} DROP CONSTRAINT IF EXISTS "FK_${table}_owner"`,
      );
      if (hasAuthUsers) {
        await queryRunner.query(`
          ALTER TABLE elnegocio.${table}
            ADD CONSTRAINT "FK_${table}_owner" FOREIGN KEY (owner_id)
              REFERENCES auth.users (id) ON DELETE CASCADE NOT VALID
        `);
      }
    }
  }

  private async hasAuthUsers(queryRunner: QueryRunner): Promise<boolean> {
    const [row] = (await queryRunner.query(
      `SELECT to_regclass('auth.users') IS NOT NULL AS found`,
    )) as Array<{ found: boolean }>;
    return row.found;
  }
}
