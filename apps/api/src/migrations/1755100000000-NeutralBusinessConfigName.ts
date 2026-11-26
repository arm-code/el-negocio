import { MigrationInterface, QueryRunner } from 'typeorm';

/** El nombre por defecto era el de un cliente; una instancia nueva no debe heredarlo. */
export class NeutralBusinessConfigName1755100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE elnegocio.business_configs ALTER COLUMN name SET DEFAULT ''`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE elnegocio.business_configs ALTER COLUMN name DROP DEFAULT`,
    );
  }
}
