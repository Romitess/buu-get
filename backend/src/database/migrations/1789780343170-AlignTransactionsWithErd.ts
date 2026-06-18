import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignTransactionsWithErd1789780343170 implements MigrationInterface {
  name = 'AlignTransactionsWithErd1789780343170';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE \`FIN_T_TRANSACTIONS\` SET \`PC_ID\` = 1 WHERE \`PC_ID\` IS NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` DROP FOREIGN KEY \`FK_4a3ed356e599726101dfb291af6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\`
        DROP COLUMN \`TRANX_TAX_ID\`,
        DROP COLUMN \`TRANX_RECEIPT_NAME\`,
        DROP COLUMN \`TRANX_RECEIPT_ADDRESS\`,
        DROP COLUMN \`TRANX_PHONE\`,
        DROP COLUMN \`TRANX_COMP_CODE\`,
        DROP COLUMN \`TRANX_PROD_CODE\`,
        DROP COLUMN \`TRANX_REF1\`,
        DROP COLUMN \`TRANX_REF2\`,
        DROP COLUMN \`TRANX_REF3\`,
        DROP COLUMN \`TRANX_REF4\`,
        DROP COLUMN \`TRANX_BANK_REF\`,
        DROP COLUMN \`TRANX_PARTNER_TRANX_ID\`,
        DROP COLUMN \`TRANX_APPROVAL_RESP_CODE\`,
        DROP COLUMN \`TRANX_APPROVAL_RESP_MSG\`,
        DROP COLUMN \`TRANX_PAYMENT_RESP_CODE\`,
        DROP COLUMN \`TRANX_PAYMENT_RESP_MSG\`,
        MODIFY \`PC_ID\` int NOT NULL AFTER \`ERM_ID\`,
        MODIFY \`TRANX_QR_CODE\` varchar(255) NULL AFTER \`PC_ID\`,
        MODIFY \`TRANX_AMOUNT\` decimal(18,2) NOT NULL AFTER \`TRANX_QR_CODE\`,
        MODIFY \`TRANX_CREATED_AT\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        MODIFY \`TRANX_UPDATED_AT\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        MODIFY \`TRANX_DELETED_AT\` timestamp NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\`
        ADD CONSTRAINT \`FK_4a3ed356e599726101dfb291af6\`
        FOREIGN KEY (\`PC_ID\`) REFERENCES \`FIN_T_PAYMENT_CONFIG\`(\`PC_ID\`)
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\`
        MODIFY \`CREATED_AT\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        MODIFY \`UPDATED_AT\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        MODIFY \`DELETED_AT\` timestamp NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\` DROP FOREIGN KEY \`FK_4a3ed356e599726101dfb291af6\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\`
        ADD \`TRANX_TAX_ID\` varchar(20) NULL,
        ADD \`TRANX_RECEIPT_NAME\` varchar(255) NULL,
        ADD \`TRANX_RECEIPT_ADDRESS\` varchar(200) NULL,
        ADD \`TRANX_PHONE\` varchar(15) NULL,
        ADD \`TRANX_COMP_CODE\` varchar(10) NULL,
        ADD \`TRANX_PROD_CODE\` varchar(10) NULL,
        ADD \`TRANX_REF1\` varchar(20) NULL,
        ADD \`TRANX_REF2\` varchar(20) NULL,
        ADD \`TRANX_REF3\` varchar(20) NULL,
        ADD \`TRANX_REF4\` varchar(20) NULL,
        ADD \`TRANX_BANK_REF\` varchar(20) NULL,
        ADD \`TRANX_PARTNER_TRANX_ID\` varchar(20) NULL,
        ADD \`TRANX_APPROVAL_RESP_CODE\` varchar(4) NULL,
        ADD \`TRANX_APPROVAL_RESP_MSG\` varchar(100) NULL,
        ADD \`TRANX_PAYMENT_RESP_CODE\` varchar(4) NULL,
        ADD \`TRANX_PAYMENT_RESP_MSG\` varchar(100) NULL,
        MODIFY \`PC_ID\` int NULL,
        MODIFY \`TRANX_CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        MODIFY \`TRANX_UPDATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        MODIFY \`TRANX_DELETED_AT\` datetime(6) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\`
        ADD CONSTRAINT \`FK_4a3ed356e599726101dfb291af6\`
        FOREIGN KEY (\`PC_ID\`) REFERENCES \`FIN_T_PAYMENT_CONFIG\`(\`PC_ID\`)
        ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\`
        MODIFY \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        MODIFY \`UPDATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        MODIFY \`DELETED_AT\` datetime(6) NULL`,
    );
  }
}
