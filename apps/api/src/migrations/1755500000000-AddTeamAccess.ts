import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Equipo del negocio: nombre de cada persona, cuándo cambió su contraseña (para cerrar
 * las sesiones anteriores) y enlaces de un solo uso para crear contraseña.
 */
export class AddTeamAccess1755500000000 implements MigrationInterface {
  name = 'AddTeamAccess1755500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "elnegocio"."users"
        ADD COLUMN "name" varchar(150),
        ADD COLUMN "password_changed_at" timestamptz;
    `);
    await queryRunner.query(`
      CREATE TABLE "elnegocio"."user_access_links" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "token_hash" char(64) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz,
        "created_by" uuid NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_access_links" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_access_links_user" FOREIGN KEY ("user_id")
          REFERENCES "elnegocio"."users" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_user_access_links_token"
        ON "elnegocio"."user_access_links" ("token_hash");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_user_access_links_user"
        ON "elnegocio"."user_access_links" ("user_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "elnegocio"."user_access_links";`,
    );
    await queryRunner.query(`
      ALTER TABLE "elnegocio"."users"
        DROP COLUMN IF EXISTS "name",
        DROP COLUMN IF EXISTS "password_changed_at";
    `);
  }
}
