import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * La Agenda reemplaza a "Eventos": se puede anotar la hora, y la devolución deja de
 * suponerse para todo.
 *
 * Lo que ya estaba guardado se creó cuando todo era renta de mobiliario (se entrega y
 * se recoge), así que se marca con devolución y conserva su flujo.
 */
export class AddAgendaFieldsToBusinessEvents1755300000000
  implements MigrationInterface
{
  name = 'AddAgendaFieldsToBusinessEvents1755300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "elnegocio"."business_events"
        ADD COLUMN "event_time" varchar(5),
        ADD COLUMN "needs_return" boolean NOT NULL DEFAULT false;
    `);
    // Solo las filas que ya existían; las nuevas empiezan sin devolución
    await queryRunner.query(
      `UPDATE "elnegocio"."business_events" SET "needs_return" = true;`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "elnegocio"."business_events"
        DROP COLUMN "needs_return",
        DROP COLUMN "event_time";
    `);
  }
}
