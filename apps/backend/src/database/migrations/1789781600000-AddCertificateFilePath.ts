import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCertificateFilePath1789781600000 implements MigrationInterface {
  name = 'AddCertificateFilePath1789781600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'EXAM_T_CERTIFICATES',
      new TableColumn({
        name: 'CERT_FILE_PATH',
        type: 'varchar',
        length: '500',
        isNullable: true,
        comment: 'path ไฟล์ใบประกาศ PDF ที่ลงนามแล้วใน MinIO',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('EXAM_T_CERTIFICATES', 'CERT_FILE_PATH');
  }
}
