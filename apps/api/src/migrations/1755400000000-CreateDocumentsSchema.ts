import { MigrationInterface, QueryRunner } from 'typeorm';

/** Contratos y pagarés hechos por cada negocio, con folio consecutivo propio. */
export class CreateDocumentsSchema1755400000000 implements MigrationInterface {
  name = 'CreateDocumentsSchema1755400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "elnegocio"."business_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "business_id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        "folio_number" integer NOT NULL,
        "kind" varchar(30) NOT NULL,
        "values" jsonb NOT NULL DEFAULT '{}',
        "items" jsonb NOT NULL DEFAULT '[]',
        "event_id" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_business_documents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_business_documents_business" FOREIGN KEY ("business_id")
          REFERENCES "elnegocio"."businesses" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_business_documents_owner" FOREIGN KEY ("owner_id")
          REFERENCES "elnegocio"."users" ("id"),
        CONSTRAINT "FK_business_documents_event" FOREIGN KEY ("event_id")
          REFERENCES "elnegocio"."business_events" ("id") ON DELETE SET NULL
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_business_documents_folio"
        ON "elnegocio"."business_documents" ("business_id", "folio_number");
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_business_documents_event"
        ON "elnegocio"."business_documents" ("event_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "elnegocio"."business_documents";`,
    );
  }
}
