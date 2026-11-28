import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Avisos en el celular: las llaves de la instancia, qué dispositivos quieren avisos y
 * qué recordatorios ya se mandaron.
 */
export class CreateNotifications1755600000000 implements MigrationInterface {
  name = 'CreateNotifications1755600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Una sola fila: se genera la primera vez que hace falta
    await queryRunner.query(`
      CREATE TABLE "elnegocio"."push_keys" (
        "id" smallint NOT NULL DEFAULT 1,
        "public_key" varchar(200) NOT NULL,
        "private_key" varchar(100) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_keys" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_push_keys_single" CHECK ("id" = 1)
      );
    `);
    await queryRunner.query(`
      CREATE TABLE "elnegocio"."push_subscriptions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "endpoint" text NOT NULL,
        "p256dh" varchar(120) NOT NULL,
        "auth" varchar(60) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_push_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_push_subscriptions_user" FOREIGN KEY ("user_id")
          REFERENCES "elnegocio"."users" ("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_push_subscriptions_endpoint"
        ON "elnegocio"."push_subscriptions" ("endpoint");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_push_subscriptions_user"
        ON "elnegocio"."push_subscriptions" ("user_id");
    `);
    await queryRunner.query(`
      CREATE TABLE "elnegocio"."sent_reminders" (
        "key" varchar(120) NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sent_reminders" PRIMARY KEY ("key")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "elnegocio"."sent_reminders";`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "elnegocio"."push_subscriptions";`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "elnegocio"."push_keys";`);
  }
}
