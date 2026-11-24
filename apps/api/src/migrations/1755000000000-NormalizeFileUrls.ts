import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Las URLs de archivos pasan a ser relativas ("/files/<negocio>/<carpeta>/<archivo>").
 * El front reenvía /files al API, así la base de datos no depende del dominio
 * (sirve igual en local, en staging o tras cambiar de dominio).
 */
export class NormalizeFileUrls1755000000000 implements MigrationInterface {
  name = 'NormalizeFileUrls1755000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const targets: Array<[string, string]> = [
      ['business_configs', 'logo_url'],
      ['business_gallery_items', 'url'],
      ['businesses', 'logo_url'],
    ];
    for (const [table, column] of targets) {
      await queryRunner.query(`
        UPDATE armsolutions.${table}
           SET ${column} = regexp_replace(${column}, '^https?://[^/]+(/files/)', '\\1')
         WHERE ${column} ~ '^https?://[^/]+/files/'
      `);
    }
  }

  public async down(): Promise<void> {
    // Sin reversa: no se conoce el dominio original.
  }
}
