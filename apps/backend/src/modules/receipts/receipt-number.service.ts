import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Receipt, ReceiptStatus } from './entities/receipt.entity';
import { ReceiptSequence } from './entities/receipt-sequence.entity';

@Injectable()
export class ReceiptNumberService {
  /**
   * Assigns receipt numbers to the given receipts when their status is set to ISSUED.
   * This method uses a pessimistic write lock on the sequence table to prevent race conditions.
   *
   * @param manager The EntityManager to use for database operations (must be part of a transaction)
   * @param receiptIds The IDs of the receipts to assign numbers to
   */
  async assignOnIssue(
    manager: EntityManager,
    receiptIds: number[],
  ): Promise<void> {
    if (!receiptIds || receiptIds.length === 0) return;

    // 1. Load receipts with deep relations to get fiscal year from Exam
    // Sorting by RC_ID ensures deterministic processing order in bulk
    const receipts = await manager.getRepository(Receipt).find({
      where: { RC_ID: In(receiptIds) },
      relations: [
        'TRANSACTION',
        'TRANSACTION.ENROLLMENT',
        'TRANSACTION.ENROLLMENT.SESSION',
        'TRANSACTION.ENROLLMENT.SESSION.EXAM',
      ],
      order: { RC_ID: 'ASC' },
    });

    for (const receipt of receipts) {
      // Idempotent: Only assign if not already assigned
      if (receipt.RC_NO) {
        // Ensure status and issued date are correct even if already assigned
        if (receipt.RC_STATUS !== ReceiptStatus.ISSUED) {
          receipt.RC_STATUS = ReceiptStatus.ISSUED;
          receipt.RC_ISSUED_AT = receipt.RC_ISSUED_AT || new Date();
          await manager.getRepository(Receipt).save(receipt);
        }
        continue;
      }

      // 2. Resolve fiscal year BE
      const exam = receipt.TRANSACTION?.ENROLLMENT?.SESSION?.EXAM;
      const tranxPaidAt = receipt.TRANSACTION?.TRANX_PAID_AT;

      let fiscalYearBe: string;
      if (exam?.EXAM_FISCAL_YEAR && /^\d{4}$/.test(exam.EXAM_FISCAL_YEAR)) {
        // EXAM_FISCAL_YEAR is stored as AD (e.g. "2026") -> convert to BE (+543)
        fiscalYearBe = (parseInt(exam.EXAM_FISCAL_YEAR, 10) + 543).toString();
      } else {
        // Fallback to paid date or issued date or current year
        const date =
          tranxPaidAt ||
          receipt.RC_ISSUED_AT ||
          receipt.CREATED_AT ||
          new Date();
        fiscalYearBe = (new Date(date).getFullYear() + 543).toString();
      }

      // 3. Lock sequence row for this year
      let seq = await manager.getRepository(ReceiptSequence).findOne({
        where: { RSEQ_FISCAL_YEAR_BE: fiscalYearBe },
        lock: { mode: 'pessimistic_write' },
      });

      if (!seq) {
        // Create new sequence for the year if it doesn't exist
        seq = manager.getRepository(ReceiptSequence).create({
          RSEQ_FISCAL_YEAR_BE: fiscalYearBe,
          RSEQ_LAST_NO: 0,
        });
      }

      // 4. Increment and check overflow
      const nextNo = seq.RSEQ_LAST_NO + 1;
      if (nextNo > 99999) {
        throw new BadRequestException(
          `Receipt sequence overflow for year ${fiscalYearBe} (max 99999)`,
        );
      }

      seq.RSEQ_LAST_NO = nextNo;
      await manager.getRepository(ReceiptSequence).save(seq);

      // 5. Update receipt
      // Format: {YearBE}{Running5Digits} e.g. 256900001
      receipt.RC_NO = `${fiscalYearBe}${nextNo.toString().padStart(5, '0')}`;
      receipt.RC_STATUS = ReceiptStatus.ISSUED;
      receipt.RC_ISSUED_AT = receipt.RC_ISSUED_AT || new Date();

      await manager.getRepository(Receipt).save(receipt);
    }
  }
}
