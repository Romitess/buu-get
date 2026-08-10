import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

type ReceiptBackfillRow = {
  RC_ID: number;
  EXAM_FISCAL_YEAR: string | null;
  TRANX_PAID_AT: Date | string | null;
  RC_ISSUED_AT: Date | string | null;
  CREATED_AT: Date | string | null;
};

export class AddReceiptNoAndSequences1789780343820 implements MigrationInterface {
  name = 'AddReceiptNoAndSequences1789780343820';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add RC_NO to FIN_T_RECEIPTS
    await queryRunner.addColumn(
      'FIN_T_RECEIPTS',
      new TableColumn({
        name: 'RC_NO',
        type: 'varchar',
        length: '20',
        isNullable: true,
        isUnique: true,
        comment: 'เลขที่ใบเสร็จรับเงิน (Full Receipt Number)',
      }),
    );

    // 2. Create FIN_T_RECEIPT_SEQUENCES
    await queryRunner.createTable(
      new Table({
        name: 'FIN_T_RECEIPT_SEQUENCES',
        columns: [
          {
            name: 'RSEQ_ID',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'RSEQ_FISCAL_YEAR_BE',
            type: 'varchar',
            length: '4',
            isUnique: true,
            comment: 'ปีงบประมาณ พ.ศ. (4 หลัก)',
          },
          {
            name: 'RSEQ_LAST_NO',
            type: 'int',
            default: 0,
            comment: 'เลขลำดับล่าสุดที่ออกในปีนั้น',
          },
          {
            name: 'CREATED_AT',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'UPDATED_AT',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // 3. Backfill existing ISSUED (1) and VOIDED (2) receipts
    const receipts = (await queryRunner.query(`
      SELECT 
        r.RC_ID, 
        e.EXAM_FISCAL_YEAR,
        t.TRANX_PAID_AT,
        r.RC_ISSUED_AT,
        r.CREATED_AT
      FROM FIN_T_RECEIPTS r
      LEFT JOIN FIN_T_TRANSACTIONS t ON t.TRANX_ID = r.TRANX_ID
      LEFT JOIN EXAM_T_ENROLLMENTS en ON en.ERM_ID = t.ERM_ID
      LEFT JOIN EXAM_T_SESSIONS s ON s.SS_ID = en.SESSION_ID
      LEFT JOIN EXAM_T_EXAM e ON e.EXAM_ID = s.EXAM_ID
      WHERE r.RC_STATUS IN (1, 2) AND r.RC_NO IS NULL
      ORDER BY r.RC_ID ASC
    `)) as ReceiptBackfillRow[];

    const sequences: Record<string, number> = {};

    for (const row of receipts) {
      let fiscalYearBe: string;

      // logic: EXAM_FISCAL_YEAR (AD) -> BE (+543)
      if (row.EXAM_FISCAL_YEAR && /^\d{4}$/.test(row.EXAM_FISCAL_YEAR)) {
        fiscalYearBe = (parseInt(row.EXAM_FISCAL_YEAR, 10) + 543).toString();
      } else {
        // Fallback to paid date or issued date or created date
        const date =
          row.TRANX_PAID_AT || row.RC_ISSUED_AT || row.CREATED_AT || new Date();
        fiscalYearBe = (new Date(date).getFullYear() + 543).toString();
      }

      const currentSeq = (sequences[fiscalYearBe] || 0) + 1;
      sequences[fiscalYearBe] = currentSeq;

      const rcNo = `${fiscalYearBe}${currentSeq.toString().padStart(5, '0')}`;

      await queryRunner.query(
        `UPDATE FIN_T_RECEIPTS SET RC_NO = ? WHERE RC_ID = ?`,
        [rcNo, row.RC_ID],
      );
    }

    // 4. Update FIN_T_RECEIPT_SEQUENCES with final counts
    for (const [yearBe, lastNo] of Object.entries(sequences)) {
      await queryRunner.query(
        `INSERT INTO FIN_T_RECEIPT_SEQUENCES (RSEQ_FISCAL_YEAR_BE, RSEQ_LAST_NO) VALUES (?, ?)`,
        [yearBe, lastNo],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('FIN_T_RECEIPT_SEQUENCES');
    await queryRunner.dropColumn('FIN_T_RECEIPTS', 'RC_NO');
  }
}
