import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPendingPaymentReceiptFields1789780343169 implements MigrationInterface {
  name = 'AddPendingPaymentReceiptFields1789780343169';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\`
        ADD \`TRANX_QR_CODE\` varchar(255) NULL COMMENT 'Generated QR payment reference' AFTER \`PC_ID\`,
        CHANGE \`TRANX_AMOUNT\` \`TRANX_AMOUNT\` decimal(18,2) NOT NULL COMMENT 'จำนวนเงิน',
        CHANGE \`TRANX_PAYMENT_METHOD\` \`TRANX_PAYMENT_METHOD\` int NOT NULL DEFAULT 0 COMMENT 'วิธีการชำระเงิน',
        CHANGE \`TRANX_PAYMENT_STATUS\` \`TRANX_PAYMENT_STATUS\` int NOT NULL DEFAULT 3 COMMENT 'สถานะการชำระเงิน',
        CHANGE \`TRANX_CHANNEL\` \`TRANX_CHANNEL\` int NOT NULL COMMENT 'ช่องทางการชำระเงิน',
        CHANGE \`TRANX_TAX_ID\` \`TRANX_TAX_ID\` varchar(20) NULL,
        CHANGE \`TRANX_RECEIPT_NAME\` \`TRANX_RECEIPT_NAME\` varchar(255) NULL,
        CHANGE \`TRANX_RECEIPT_ADDRESS\` \`TRANX_RECEIPT_ADDRESS\` varchar(200) NULL,
        CHANGE \`TRANX_PHONE\` \`TRANX_PHONE\` varchar(15) NULL,
        CHANGE \`TRANX_COMP_CODE\` \`TRANX_COMP_CODE\` varchar(10) NULL,
        CHANGE \`TRANX_PROD_CODE\` \`TRANX_PROD_CODE\` varchar(10) NULL,
        CHANGE \`TRANX_REF1\` \`TRANX_REF1\` varchar(20) NULL,
        CHANGE \`TRANX_PARTNER_TRANX_ID\` \`TRANX_PARTNER_TRANX_ID\` varchar(20) NULL,
        CHANGE \`TRANX_APPROVAL_RESP_CODE\` \`TRANX_APPROVAL_RESP_CODE\` varchar(4) NULL,
        CHANGE \`TRANX_APPROVAL_RESP_MSG\` \`TRANX_APPROVAL_RESP_MSG\` varchar(100) NULL,
        CHANGE \`TRANX_PAYMENT_RESP_CODE\` \`TRANX_PAYMENT_RESP_CODE\` varchar(4) NULL,
        CHANGE \`TRANX_PAYMENT_RESP_MSG\` \`TRANX_PAYMENT_RESP_MSG\` varchar(100) NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\`
        ADD \`RC_NAME\` varchar(255) NULL AFTER \`TRANX_ID\`,
        ADD \`RC_ADDRESS\` text NULL AFTER \`RC_NAME\`,
        ADD \`RC_TAX_ID\` int NULL AFTER \`RC_ADDRESS\`,
        ADD \`RC_PHONE\` varchar(15) NULL AFTER \`RC_TAX_ID\``,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_RECEIPTS\`
        DROP COLUMN \`RC_PHONE\`,
        DROP COLUMN \`RC_TAX_ID\`,
        DROP COLUMN \`RC_ADDRESS\`,
        DROP COLUMN \`RC_NAME\``,
    );
    await queryRunner.query(
      `ALTER TABLE \`FIN_T_TRANSACTIONS\`
        DROP COLUMN \`TRANX_QR_CODE\`,
        CHANGE \`TRANX_AMOUNT\` \`TRANX_AMOUNT\` decimal(10,2) NOT NULL,
        CHANGE \`TRANX_PAYMENT_METHOD\` \`TRANX_PAYMENT_METHOD\` int NOT NULL DEFAULT 0,
        CHANGE \`TRANX_PAYMENT_STATUS\` \`TRANX_PAYMENT_STATUS\` varchar(20) NOT NULL,
        CHANGE \`TRANX_CHANNEL\` \`TRANX_CHANNEL\` varchar(20) NOT NULL`,
    );
  }
}
