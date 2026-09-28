import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReceiptFileAndCollectorFields1789780345800 implements MigrationInterface {
  name = 'AddReceiptFileAndCollectorFields1789780345800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'FIN_T_RECEIPTS',
      new TableColumn({
        name: 'RC_FILE_PATH',
        type: 'varchar',
        length: '500',
        isNullable: true,
        comment: 'path ไฟล์ใบเสร็จ PDF ใน MinIO',
      }),
    );

    await queryRunner.addColumn(
      'FIN_T_RECEIPTS',
      new TableColumn({
        name: 'RC_ISSUED_BY_PSN_ID',
        type: 'varchar',
        length: '20',
        isNullable: true,
        comment: 'รหัสบุคลากรผู้รับเงิน (ผู้ออกใบเสร็จ)',
      }),
    );

    await queryRunner.addColumn(
      'FIN_T_RECEIPTS',
      new TableColumn({
        name: 'RC_COLLECTOR_NAME',
        type: 'varchar',
        length: '255',
        isNullable: true,
        comment: 'ชื่อผู้รับเงิน ณ วันออกใบเสร็จ',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('FIN_T_RECEIPTS', 'RC_COLLECTOR_NAME');
    await queryRunner.dropColumn('FIN_T_RECEIPTS', 'RC_ISSUED_BY_PSN_ID');
    await queryRunner.dropColumn('FIN_T_RECEIPTS', 'RC_FILE_PATH');
  }
}
