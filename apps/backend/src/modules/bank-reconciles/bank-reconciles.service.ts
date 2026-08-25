import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { parse as parseCsv } from 'csv-parse/sync';
import { createHash } from 'crypto';
import {
  Brackets,
  DataSource,
  In,
  IsNull,
  QueryRunner,
  Repository,
} from 'typeorm';
import * as XLSX from 'xlsx';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_MAX_LIMIT,
  PaginationQueryDto,
} from 'src/common/dto/pagination-query.dto';
import {
  Transaction,
  TransactionMatchStatus,
  TransactionPaymentStatus,
} from '../transactions/entities/transaction.entity';
import { TransactionRef } from '../transaction-refs/entities/transaction-ref.entity';
import { TransactionApiType } from '../transaction-status-history/entities/transaction-status-history.entity';
import { ExamEnrollmentStatus } from '../exam-enrollments/entities/exam-enrollment.entity';
import { Receipt } from '../receipts/entities/receipt.entity';
import { ReceiptNumberService } from '../receipts/receipt-number.service';
import { BankReconcile } from './entities/bank-reconcile.entity';
import {
  BankReconcileChangedField,
  BankReconcileChangeReason,
  BankReconcileEditLog,
  BankReconcileEditSnapshot,
} from './entities/bank-reconcile-edit-log.entity';
import {
  CreateBankReconcileDto,
  UpdateBankReconcileRefsDto,
  UpdateBankReconcileDto,
} from './dto/bank-reconcile.dto';

interface ImportPaymentRow {
  applicantId: string;
  referenceNo: string | null;
  payerName: string;
  amount: number;
  paymentDate: string | null;
  paymentTime: string | null;
}

interface RawPaymentRow {
  applicantId?: unknown;
  referenceNo?: unknown;
  payerName?: unknown;
  amount?: unknown;
  paymentDate?: unknown;
  paymentTime?: unknown;
}

interface ExistingBankReconcileHashRow {
  BR_IMPORT_KEY_HASH: string | null;
}

interface BankReconcileImportHashSource {
  BR_REF1: string;
  BR_REF2?: string | null;
  BR_REF3?: string | null;
  BR_REF4?: string | null;
  BR_AMOUNT: number | string;
  BR_PAID_BY: string;
}

export interface BankReconcileImportResult {
  total: number;
  imported: number;
  skipped: number;
  invalidSkipped: number;
  duplicateSkipped: number;
  data: BankReconcile[];
}

export interface BankReconcileMatchResult {
  TSR_ID: number;
  TRANX_ID: number;
  BR_ID: number | null;
  TSC_REF1: string;
  TSC_REF2: string | null;
  TSC_REF3: string | null;
  TSC_REF4: string | null;
  TSC_BANK_REF: string;
  TSC_PARTNER_REF: string;
  APPLICANT_NAME: string | null;
  TRANX_AMOUNT: number | string | null;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export interface TestExportExamOption {
  EXAM_ID: number;
  EXAM_NAME: string;
  EXAM_ROUND: string | null;
  EXAM_FISCAL_YEAR: string | null;
  EXAM_DATE: string | null;
  EXAM_FEE: number;
  exportableCount: number;
}

export interface TestExportRow {
  applicantId: string;
  referenceNo: string | null;
  payerName: string;
  amount: string;
  paymentDate: string;
  paymentTime: string;
}

interface TestExportExamRawRow {
  EXAM_ID: number | string;
  EXAM_NAME: string;
  EXAM_ROUND: string | null;
  EXAM_FISCAL_YEAR: string | null;
  EXAM_DATE: string | null;
  EXAM_FEE: number | string;
  exportableCount: number | string;
}

interface TestExportRawRow {
  TSC_REF1: string;
  TSC_REF2: string | null;
  PAYER_NAME: string | null;
  TRANX_AMOUNT: number | string;
  TRANX_PAID_AT: Date | null;
  TRANX_CREATED_AT: Date;
}

interface TransactionStatusSnapshot {
  TRANX_ID: number | string;
  TRANX_PAYMENT_STATUS: number | string;
  ERM_ID: number | string | null;
}

interface BankReconcileVerifyRow {
  BR_ID: number | string;
  BR_AMOUNT: number | string;
  TSR_ID: number | string | null;
  TRANX_ID: number | string | null;
  TRANX_AMOUNT: number | string | null;
}

interface BankReconcileVerifyMatch {
  brId: number;
  tsrId: number;
  tranxId: number;
  matchStatus: TransactionMatchStatus;
}

@Injectable()
export class BankReconcilesService {
  constructor(
    @InjectRepository(BankReconcile)
    private readonly bankReconcilesRepository: Repository<BankReconcile>,
    private readonly receiptNumberService: ReceiptNumberService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createBankReconcileDto: CreateBankReconcileDto,
  ): Promise<BankReconcile> {
    const bankReconcile = this.bankReconcilesRepository.create({
      ...createBankReconcileDto,
      BR_IMPORT_KEY_HASH: this.getBankReconcileImportHash(
        createBankReconcileDto,
      ),
    });
    return this.bankReconcilesRepository.save(bankReconcile);
  }

  async importFile(
    file: Express.Multer.File,
    userId: number,
  ): Promise<BankReconcileImportResult> {
    if (!file) {
      throw new BadRequestException('Payment import file is required');
    }

    const rows = this.parsePaymentFile(file);
    const validRows: ImportPaymentRow[] = [];
    const seenImportKeys = new Set<string>();
    let invalidSkipped = 0;
    let duplicateSkipped = 0;

    for (const row of rows) {
      const normalized = this.normalizeImportRow(row);
      if (!normalized) {
        invalidSkipped += 1;
        continue;
      }

      const importKeyHash = this.getImportRowHash(normalized);
      if (seenImportKeys.has(importKeyHash)) {
        duplicateSkipped += 1;
        continue;
      }

      seenImportKeys.add(importKeyHash);
      validRows.push(normalized);
    }

    const existingImportKeyHashes =
      await this.getExistingImportKeyHashes(validRows);
    const uniqueRows = validRows.filter((row) => {
      const importKeyHash = this.getImportRowHash(row);
      if (existingImportKeyHashes.has(importKeyHash)) {
        duplicateSkipped += 1;
        return false;
      }
      return true;
    });

    if (duplicateSkipped > 0) {
      return {
        total: rows.length,
        imported: 0,
        skipped: rows.length,
        invalidSkipped,
        duplicateSkipped,
        data: [],
      };
    }

    const reconciles = this.bankReconcilesRepository.create(
      uniqueRows.map((row) => ({
        CREATED_BY: userId,
        BR_REF1: row.applicantId,
        BR_REF2: row.referenceNo,
        BR_REF3: row.paymentDate,
        BR_REF4: row.paymentTime,
        BR_AMOUNT: row.amount,
        BR_PAID_BY: row.payerName,
        BR_IMPORT_KEY_HASH: this.getImportRowHash(row),
      })),
    );

    const saved =
      reconciles.length > 0
        ? await this.bankReconcilesRepository.save(reconciles)
        : [];

    const data =
      saved.length > 0
        ? await this.bankReconcilesRepository.find({
            where: { BR_ID: In(saved.map((s) => s.BR_ID)) },
            relations: ['USER', 'USER.PROFILE', 'TRANSACTION'],
          })
        : [];

    return {
      total: rows.length,
      imported: saved.length,
      skipped: invalidSkipped + duplicateSkipped,
      invalidSkipped,
      duplicateSkipped,
      data,
    };
  }

  async findAll(
    query: PaginationQueryDto = {},
  ): Promise<PaginatedResponse<BankReconcile>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const [data, total] = await this.bankReconcilesRepository.findAndCount({
      relations: ['USER', 'USER.PROFILE', 'TRANSACTION'],
      where: { DELETED_AT: IsNull() },
      skip: (page - 1) * limit,
      take: limit,
      order: { BR_ID: 'ASC' },
    });
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: number): Promise<BankReconcile> {
    const bankReconcile = await this.bankReconcilesRepository.findOne({
      where: { BR_ID: id },
      relations: ['USER', 'USER.PROFILE', 'TRANSACTION'],
    });
    if (!bankReconcile) {
      throw new NotFoundException(`BankReconcile with ID ${id} not found`);
    }
    return bankReconcile;
  }

  async verifyData(brIds?: number[]): Promise<BankReconcile[]> {
    const requestedBrIds = this.normalizePositiveIds(brIds ?? []);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const allMatchedBrIds: number[] = [];
      const VERIFY_KEYSET_BATCH = 500;

      // มี brIds จาก client → กระทบเฉพาะชุดนั้น (chunk อยู่แล้ว)
      // ไม่มี brIds → keyset ตาม BR_ID ของ unmatched เพื่อไม่ preload ID ทั้งตาราง
      if (requestedBrIds.length > 0) {
        for (const brIdChunk of this.chunkArray(requestedBrIds)) {
          if (brIdChunk.length === 0) {
            continue;
          }
          const chunkMatched = await this.verifyBrIdChunk(
            queryRunner,
            brIdChunk,
          );
          allMatchedBrIds.push(...chunkMatched);
        }
      } else {
        let cursor = 0;
        for (;;) {
          const unmatchedRows = await queryRunner.manager
            .createQueryBuilder()
            .select('br.BR_ID', 'BR_ID')
            .from('FIN_T_BANK_RECONCILES', 'br')
            .where('br.DELETED_AT IS NULL')
            .andWhere('br.TRANX_ID IS NULL')
            .andWhere('br.BR_ID > :cursor', { cursor })
            .orderBy('br.BR_ID', 'ASC')
            .limit(VERIFY_KEYSET_BATCH)
            .getRawMany<{ BR_ID: number }>();

          const brIdChunk = unmatchedRows
            .map((row) => Number(row.BR_ID))
            .filter((id) => id > 0);

          if (brIdChunk.length === 0) {
            break;
          }

          const chunkMatched = await this.verifyBrIdChunk(
            queryRunner,
            brIdChunk,
          );
          allMatchedBrIds.push(...chunkMatched);
          cursor = brIdChunk[brIdChunk.length - 1] ?? cursor;
        }
      }

      await queryRunner.commitTransaction();
      if (requestedBrIds.length > 0) {
        return this.findByIds(requestedBrIds);
      }
      // ไม่ส่ง brIds → คืนเฉพาะที่เพิ่ง process ในขอบเขต memory ที่ปลอดภัย
      const uniqueMatched = [...new Set(allMatchedBrIds)];
      if (uniqueMatched.length === 0) {
        return [];
      }
      return this.findByIds(uniqueMatched.slice(0, PAGINATION_MAX_LIMIT));
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async verifyBrIdChunk(
    queryRunner: QueryRunner,
    brIdChunk: number[],
  ): Promise<number[]> {
    const rawRows = await queryRunner.manager
      .createQueryBuilder()
      .select([
        'br.BR_ID AS BR_ID',
        'br.BR_AMOUNT AS BR_AMOUNT',
        'tr.TSR_ID AS TSR_ID',
        'tr.TRANX_ID AS TRANX_ID',
        't.TRANX_AMOUNT AS TRANX_AMOUNT',
      ])
      .from('FIN_T_BANK_RECONCILES', 'br')
      .leftJoin(
        'FIN_T_TRANSACTIONS_REFS',
        'tr',
        `
          tr.DELETED_AT IS NULL
          AND tr.TSC_REF1 = br.BR_REF1
          AND (
            (br.BR_REF2 IS NULL AND tr.TSC_REF2 IS NULL)
            OR tr.TSC_REF2 = br.BR_REF2
          )
        `,
      )
      .leftJoin(
        'FIN_T_TRANSACTIONS',
        't',
        't.TRANX_ID = tr.TRANX_ID AND t.DELETED_AT IS NULL',
      )
      .where('br.DELETED_AT IS NULL')
      .andWhere('br.BR_ID IN (:...brIds)', { brIds: brIdChunk })
      .orderBy('br.BR_ID', 'ASC')
      .addOrderBy('tr.TSR_ID', 'ASC')
      .getRawMany<BankReconcileVerifyRow>();

    const chunkBrIds = [
      ...new Set(
        rawRows.map((row) => Number(row.BR_ID)).filter((id) => id > 0),
      ),
    ];
    const matches = this.buildVerifyMatches(rawRows);

    await this.updateVerifiedBankReconciles(queryRunner, chunkBrIds, matches);
    await this.updateVerifiedTransactionRefs(queryRunner, chunkBrIds, matches);
    await this.updateVerifiedTransactionStatuses(queryRunner, matches);

    return chunkBrIds;
  }

  private async findByIds(brIds: number[]): Promise<BankReconcile[]> {
    if (brIds.length === 0) {
      return [];
    }

    return this.bankReconcilesRepository.find({
      relations: ['USER', 'USER.PROFILE', 'TRANSACTION'],
      where: { BR_ID: In(brIds), DELETED_AT: IsNull() },
      order: { BR_ID: 'ASC' },
    });
  }

  private buildVerifyMatches(
    rawRows: BankReconcileVerifyRow[],
  ): BankReconcileVerifyMatch[] {
    const matchedBrIds = new Set<number>();
    const matches: BankReconcileVerifyMatch[] = [];

    for (const row of rawRows) {
      const brId = Number(row.BR_ID);
      const tsrId = Number(row.TSR_ID);
      const tranxId = Number(row.TRANX_ID);

      if (
        matchedBrIds.has(brId) ||
        !Number.isInteger(brId) ||
        !Number.isInteger(tsrId) ||
        !Number.isInteger(tranxId) ||
        brId <= 0 ||
        tsrId <= 0 ||
        tranxId <= 0 ||
        row.TRANX_AMOUNT === null
      ) {
        continue;
      }

      const matchesAmount =
        this.toCents(row.TRANX_AMOUNT) === this.toCents(row.BR_AMOUNT);

      matches.push({
        brId,
        tsrId,
        tranxId,
        matchStatus: matchesAmount
          ? TransactionMatchStatus.MATCH
          : TransactionMatchStatus.MISSING,
      });
      matchedBrIds.add(brId);
    }

    return matches;
  }

  private async updateVerifiedBankReconciles(
    queryRunner: QueryRunner,
    brIds: number[],
    matches: BankReconcileVerifyMatch[],
  ): Promise<void> {
    const tranxIdByBrId = new Map(
      matches.map((match) => [match.brId, match.tranxId]),
    );

    for (const brIdChunk of this.chunkArray(brIds)) {
      const caseSql = this.buildNumericCaseSql(
        'BR_ID',
        brIdChunk.map((brId) => ({
          id: brId,
          value: tranxIdByBrId.get(brId) ?? null,
        })),
      );

      await queryRunner.manager
        .createQueryBuilder()
        .update('FIN_T_BANK_RECONCILES')
        .set({ TRANX_ID: () => caseSql })
        .where('BR_ID IN (:...brIds)', { brIds: brIdChunk })
        .execute();
    }
  }

  private async updateVerifiedTransactionRefs(
    queryRunner: QueryRunner,
    brIds: number[],
    matches: BankReconcileVerifyMatch[],
  ): Promise<void> {
    for (const brIdChunk of this.chunkArray(brIds)) {
      await queryRunner.manager
        .createQueryBuilder()
        .update('FIN_T_TRANSACTIONS_REFS')
        .set({ BR_ID: null })
        .where('BR_ID IN (:...brIds)', { brIds: brIdChunk })
        .execute();
    }

    for (const matchChunk of this.chunkArray(matches)) {
      const tsrIds = matchChunk.map((match) => match.tsrId);
      const caseSql = this.buildNumericCaseSql(
        'TSR_ID',
        matchChunk.map((match) => ({
          id: match.tsrId,
          value: match.brId,
        })),
        'BR_ID',
      );

      await queryRunner.manager
        .createQueryBuilder()
        .update('FIN_T_TRANSACTIONS_REFS')
        .set({ BR_ID: () => caseSql })
        .where('TSR_ID IN (:...tsrIds)', { tsrIds })
        .execute();
    }
  }

  private async updateVerifiedTransactionStatuses(
    queryRunner: QueryRunner,
    matches: BankReconcileVerifyMatch[],
  ): Promise<void> {
    const matchIds = [
      ...new Set(
        matches
          .filter((match) => match.matchStatus === TransactionMatchStatus.MATCH)
          .map((match) => match.tranxId),
      ),
    ];
    const missingIds = [
      ...new Set(
        matches
          .filter(
            (match) => match.matchStatus === TransactionMatchStatus.MISSING,
          )
          .map((match) => match.tranxId),
      ),
    ];

    await this.updateTransactionMatchStatus(
      queryRunner,
      matchIds,
      TransactionMatchStatus.MATCH,
    );
    await this.updateTransactionMatchStatus(
      queryRunner,
      missingIds,
      TransactionMatchStatus.MISSING,
    );
  }

  private async updateTransactionMatchStatus(
    queryRunner: QueryRunner,
    tranxIds: number[],
    matchStatus: TransactionMatchStatus,
  ): Promise<void> {
    for (const tranxIdChunk of this.chunkArray(tranxIds)) {
      await queryRunner.manager
        .createQueryBuilder()
        .update('FIN_T_TRANSACTIONS')
        .set({ TRANX_MATCH_STATUS: matchStatus })
        .where('TRANX_ID IN (:...tranxIds)', { tranxIds: tranxIdChunk })
        .execute();
    }
  }

  private buildNumericCaseSql(
    column: string,
    cases: Array<{ id: number; value: number | null }>,
    defaultSql = 'NULL',
  ): string {
    const whenClauses = cases
      .map(({ id, value }) => `WHEN ${id} THEN ${value ?? 'NULL'}`)
      .join(' ');

    return `CASE ${column} ${whenClauses} ELSE ${defaultSql} END`;
  }

  private chunkArray<T>(items: T[], size = 500): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private normalizePositiveIds(ids: number[]): number[] {
    return [
      ...new Set(
        ids
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];
  }

  async clearAll(): Promise<void> {
    await this.bankReconcilesRepository
      .createQueryBuilder()
      .softDelete()
      .where('1 = 1')
      .execute();
  }

  async update(
    id: number,
    updateBankReconcileDto: UpdateBankReconcileDto,
  ): Promise<BankReconcile> {
    const bankReconcile = await this.findOne(id);
    Object.assign(bankReconcile, updateBankReconcileDto);
    return this.bankReconcilesRepository.save(bankReconcile);
  }

  async updateRefs(
    id: number,
    updateBankReconcileRefsDto: UpdateBankReconcileRefsDto,
    userId: number,
  ): Promise<BankReconcile> {
    return this.dataSource.transaction(async (manager) => {
      const bankReconcileRepository = manager.getRepository(BankReconcile);
      const editLogRepository = manager.getRepository(BankReconcileEditLog);
      const transactionRefRepository = manager.getRepository(TransactionRef);
      const transactionRepository = manager.getRepository(Transaction);

      const bankReconcile = await bankReconcileRepository.findOne({
        where: { BR_ID: id, DELETED_AT: IsNull() },
        relations: ['TRANSACTION'],
      });

      if (!bankReconcile) {
        throw new NotFoundException(`BankReconcile with ID ${id} not found`);
      }

      const previousTranxId = bankReconcile.TRANX_ID;
      const oldSnapshot = this.createEditSnapshot(bankReconcile);

      await transactionRefRepository.update(
        { BR_ID: bankReconcile.BR_ID },
        { BR_ID: null },
      );

      if (previousTranxId) {
        await transactionRepository.update(
          { TRANX_ID: previousTranxId },
          { TRANX_MATCH_STATUS: TransactionMatchStatus.UNMATCH },
        );
      }

      const nextRef1 = updateBankReconcileRefsDto.BR_REF1.trim();
      if (!nextRef1) {
        throw new BadRequestException('BR_REF1 is required');
      }

      // ล้าง ManyToOne ที่โหลดมาแล้ว — ไม่งั้น TypeORM save() จะคืน TRANX_ID เดิมจาก relation (BUG-005)
      Reflect.deleteProperty(bankReconcile, 'TRANSACTION');

      bankReconcile.BR_REF1 = nextRef1;
      bankReconcile.BR_REF2 =
        updateBankReconcileRefsDto.BR_REF2?.trim() || null;
      bankReconcile.TRANX_ID = null;

      const transactionRef = await transactionRefRepository.findOne({
        where: {
          TSC_REF1: bankReconcile.BR_REF1,
          TSC_REF2: bankReconcile.BR_REF2 ?? IsNull(),
        },
        relations: ['TRANSACTION'],
      });

      if (transactionRef) {
        const transaction = transactionRef.TRANSACTION;
        const matchesAmount =
          this.toCents(transaction.TRANX_AMOUNT) ===
          this.toCents(bankReconcile.BR_AMOUNT);

        transaction.TRANX_MATCH_STATUS = matchesAmount
          ? TransactionMatchStatus.MATCH
          : TransactionMatchStatus.MISSING;
        // ตั้งเฉพาะ FK — ห้ามผูก TRANSACTION relation ค้างไว้ตอน save bankReconcile
        bankReconcile.TRANX_ID = transactionRef.TRANX_ID;
        transactionRef.BR_ID = bankReconcile.BR_ID;

        await transactionRepository.save(transaction);
        await transactionRefRepository.save(transactionRef);
      }

      await bankReconcileRepository.save(bankReconcile);
      const updatedBankReconcile = await bankReconcileRepository.findOne({
        where: { BR_ID: id },
        relations: ['USER', 'USER.PROFILE', 'TRANSACTION'],
      });

      if (!updatedBankReconcile) {
        throw new NotFoundException(`BankReconcile with ID ${id} not found`);
      }

      const newSnapshot = this.createEditSnapshot(updatedBankReconcile);
      const changedFields = this.getChangedFields(oldSnapshot, newSnapshot);
      const changeReason = this.getChangeReason(oldSnapshot, newSnapshot);

      if (changeReason) {
        await editLogRepository.save(
          editLogRepository.create({
            BR_ID: id,
            CHANGED_BY: userId,
            OLD_SNAPSHOT: oldSnapshot,
            NEW_SNAPSHOT: newSnapshot,
            CHANGED_FIELDS: changedFields,
            CHANGE_REASON: changeReason,
          }),
        );
      }

      return updatedBankReconcile;
    });
  }

  async remove(id: number): Promise<void> {
    const bankReconcile = await this.findOne(id);
    await this.bankReconcilesRepository.softRemove(bankReconcile);
  }

  private parsePaymentFile(file: Express.Multer.File): RawPaymentRow[] {
    const extension = this.getFileExtension(file.originalname);

    if (extension === 'csv') {
      return parseCsv(file.buffer.toString('utf8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    }

    if (extension === 'xlsx' || extension === 'xls') {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return [];
      }
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        return [];
      }
      return XLSX.utils.sheet_to_json<RawPaymentRow>(worksheet, {
        defval: '',
      });
    }

    throw new BadRequestException(
      'Only .csv, .xlsx, and .xls files are allowed',
    );
  }

  private normalizeImportRow(row: RawPaymentRow): ImportPaymentRow | null {
    const applicantId = this.toCellString(
      this.getRowValue(row, [
        'applicantId',
        'applicant_id',
        'applicantID',
        'ApplicantID',
        'ref1',
        'ref_1',
        'รหัสประจำตัวนักศึกษา (ref1)',
        'รหัสประจำตัวนักศึกษา',
      ]),
    );
    const referenceNo = this.toCellString(
      this.getRowValue(row, [
        'referenceNo',
        'reference_no',
        'referenceNo2',
        'reference_no_2',
        'ref2',
        'ref_2',
        'เลขอ้างอิงการชำระเงิน (ref2)',
        'เลขอ้างอิงการชำระเงิน',
      ]),
    );
    const payerName = this.toCellString(
      this.getRowValue(row, [
        'payerName',
        'payer_name',
        'payer',
        'paidBy',
        'paid_by',
        'ผู้จ่ายเงิน',
      ]),
    );
    const amountText = this.toCellString(
      this.getRowValue(row, [
        'amount',
        'Amount',
        'AMOUNT',
        'paidAmount',
        'paid_amount',
        'จำนวนเงิน',
      ]),
    ).replace(/,/g, '');
    const amount = Number(amountText);

    const paymentDate = this.toCellString(
      this.getRowValue(row, [
        'paymentDate',
        'payment_date',
        'paymentdate',
        'วันที่จ่ายเงิน',
        'วันที่ชำระเงิน',
        'วันที่จ่าย',
        'วันที่ชำระ',
      ]),
    );
    const paymentTime = this.toCellString(
      this.getRowValue(row, [
        'paymentTime',
        'payment_time',
        'paymenttime',
        'เวลาจ่ายเงิน',
        'เวลาชำระเงิน',
        'เวลาจ่าย',
        'เวลาชำระ',
      ]),
    );

    if (!applicantId || !payerName || !amountText || Number.isNaN(amount)) {
      return null;
    }

    return {
      applicantId: applicantId.slice(0, 20),
      referenceNo: referenceNo ? referenceNo.slice(0, 20) : null,
      payerName: payerName.slice(0, 20),
      amount,
      paymentDate: paymentDate ? paymentDate.slice(0, 20) : null,
      paymentTime: paymentTime ? paymentTime.slice(0, 20) : null,
    };
  }

  private getRowValue(row: RawPaymentRow, aliases: string[]): unknown {
    const normalizedAliases = aliases.map((alias) =>
      alias.trim().toLowerCase(),
    );

    for (const [key, value] of Object.entries(row)) {
      if (
        normalizedAliases.includes(key.trim().toLowerCase()) &&
        value !== undefined
      ) {
        return value;
      }
    }

    return undefined;
  }

  private toCellString(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value instanceof Date) {
      return value.toISOString().trim();
    }
    if (
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean' &&
      typeof value !== 'bigint'
    ) {
      return '';
    }
    return String(value).trim();
  }

  private toCents(value: number | string): number {
    return Math.round(Number(value) * 100);
  }

  private async getExistingImportKeyHashes(
    rows: ImportPaymentRow[],
  ): Promise<Set<string>> {
    const importKeyHashes = [
      ...new Set(rows.map((row) => this.getImportRowHash(row))),
    ];
    if (importKeyHashes.length === 0) {
      return new Set<string>();
    }

    const existingRows = await this.dataSource
      .createQueryBuilder()
      .select(['br.BR_IMPORT_KEY_HASH AS BR_IMPORT_KEY_HASH'])
      .from('FIN_T_BANK_RECONCILES', 'br')
      .where('br.DELETED_AT IS NULL')
      .andWhere('br.BR_IMPORT_KEY_HASH IN (:...importKeyHashes)', {
        importKeyHashes,
      })
      .getRawMany<ExistingBankReconcileHashRow>();

    return new Set(
      existingRows
        .map((row) => row.BR_IMPORT_KEY_HASH)
        .filter((hash): hash is string => Boolean(hash)),
    );
  }

  private getImportRowKey(row: ImportPaymentRow): string {
    return [
      this.normalizeKeyCell(row.applicantId),
      this.normalizeKeyCell(row.referenceNo),
      this.normalizeKeyCell(row.paymentDate),
      this.normalizeKeyCell(row.paymentTime),
      String(this.toCents(row.amount)),
      this.normalizeKeyCell(row.payerName),
    ].join('|');
  }

  private getBankReconcileImportHash(
    row: BankReconcileImportHashSource,
  ): string {
    const importKey = [
      this.normalizeKeyCell(row.BR_REF1),
      this.normalizeKeyCell(row.BR_REF2),
      this.normalizeKeyCell(row.BR_REF3),
      this.normalizeKeyCell(row.BR_REF4),
      String(this.toCents(row.BR_AMOUNT)),
      this.normalizeKeyCell(row.BR_PAID_BY),
    ].join('|');

    return this.createImportKeyHash(importKey);
  }

  private getImportRowHash(row: ImportPaymentRow): string {
    return this.createImportKeyHash(this.getImportRowKey(row));
  }

  private createImportKeyHash(importKey: string): string {
    return createHash('sha256').update(importKey).digest('hex');
  }

  private createEditSnapshot(
    bankReconcile: BankReconcile,
  ): BankReconcileEditSnapshot {
    return {
      BR_REF1: bankReconcile.BR_REF1,
      BR_REF2: bankReconcile.BR_REF2,
      TRANX_ID: bankReconcile.TRANX_ID,
      TRANX_MATCH_STATUS: bankReconcile.TRANSACTION?.TRANX_MATCH_STATUS ?? null,
    };
  }

  private getChangedFields(
    oldSnapshot: BankReconcileEditSnapshot,
    newSnapshot: BankReconcileEditSnapshot,
  ): BankReconcileChangedField[] {
    const fields: BankReconcileChangedField[] = [
      'BR_REF1',
      'BR_REF2',
      'TRANX_ID',
      'TRANX_MATCH_STATUS',
    ];

    return fields.filter((field) => oldSnapshot[field] !== newSnapshot[field]);
  }

  private getChangeReason(
    oldSnapshot: BankReconcileEditSnapshot,
    newSnapshot: BankReconcileEditSnapshot,
  ): BankReconcileChangeReason | null {
    const hasRef1Changed = oldSnapshot.BR_REF1 !== newSnapshot.BR_REF1;
    const hasRef2Changed = oldSnapshot.BR_REF2 !== newSnapshot.BR_REF2;

    if (hasRef1Changed && hasRef2Changed) {
      return 'UPDATE_BOTH';
    }

    if (hasRef1Changed) {
      return 'UPDATE_REF1';
    }

    if (hasRef2Changed) {
      return 'UPDATE_REF2';
    }

    return null;
  }

  private normalizeKeyCell(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() ?? '';
  }

  async matchRefs(
    refs: Array<{ ref1: string; ref2: string }>,
  ): Promise<BankReconcileMatchResult[]> {
    if (!refs || refs.length === 0) return [];

    const normalizedRefs = refs
      .map((ref) => ({
        ref1: ref.ref1?.trim() ?? '',
        ref2: ref.ref2?.trim() ?? '',
      }))
      .filter((ref) => ref.ref1 || ref.ref2);

    if (normalizedRefs.length === 0) return [];

    const queryBuilder = this.dataSource
      .createQueryBuilder()
      .select([
        'tr.TSR_ID AS TSR_ID',
        'tr.TRANX_ID AS TRANX_ID',
        'tr.BR_ID AS BR_ID',
        'tr.TSC_REF1 AS TSC_REF1',
        'tr.TSC_REF2 AS TSC_REF2',
        'tr.TSC_REF3 AS TSC_REF3',
        'tr.TSC_REF4 AS TSC_REF4',
        'tr.TSC_BANK_REF AS TSC_BANK_REF',
        'tr.TSC_PARTNER_REF AS TSC_PARTNER_REF',
        `COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', profile.USER_TITLE_TH, profile.USER_FULLNAME_TH)), ''),
          NULLIF(TRIM(CONCAT_WS(' ', profile.USER_TITLE_EN, profile.USER_FULLNAME_EN)), ''),
          tp.TP_NAME
        ) AS APPLICANT_NAME`,
        't.TRANX_AMOUNT AS TRANX_AMOUNT',
        'tr.CREATED_AT AS CREATED_AT',
        'tr.UPDATED_AT AS UPDATED_AT',
      ])
      .from('FIN_T_TRANSACTIONS_REFS', 'tr')
      .innerJoin(
        'FIN_T_TRANSACTIONS',
        't',
        't.TRANX_ID = tr.TRANX_ID AND t.DELETED_AT IS NULL',
      )
      .leftJoin(
        'EXAM_T_ENROLLMENTS',
        'enrollment',
        'enrollment.ERM_ID = t.ERM_ID AND enrollment.DELETED_AT IS NULL',
      )
      .leftJoin(
        'BUU_GET_T_USER_PROFILE',
        'profile',
        'profile.USER_ID = enrollment.USER_ID AND profile.DELETED_AT IS NULL',
      )
      .leftJoin(
        'FIN_T_TRANSACTION_PROFILE',
        'tp',
        'tp.TRANX_ID = t.TRANX_ID AND tp.DELETED_AT IS NULL',
      )
      .where('tr.DELETED_AT IS NULL');

    queryBuilder.andWhere(
      new Brackets((qb) => {
        normalizedRefs.forEach((ref, index) => {
          if (ref.ref1 && ref.ref2) {
            qb.orWhere(
              `(tr.TSC_REF1 = :ref1_${index} AND tr.TSC_REF2 = :ref2_${index})`,
              {
                [`ref1_${index}`]: ref.ref1,
                [`ref2_${index}`]: ref.ref2,
              },
            );
          } else if (ref.ref1) {
            qb.orWhere(`tr.TSC_REF1 = :ref1_${index}`, {
              [`ref1_${index}`]: ref.ref1,
            });
          } else if (ref.ref2) {
            qb.orWhere(`tr.TSC_REF2 = :ref2_${index}`, {
              [`ref2_${index}`]: ref.ref2,
            });
          }
        });
      }),
    );

    return queryBuilder.orderBy('tr.TSR_ID', 'ASC').getRawMany();
  }

  async confirmPayment(
    tranxIds: number[],
  ): Promise<{ success: boolean; updated: number }> {
    if (!tranxIds || tranxIds.length === 0) {
      return { success: true, updated: 0 };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transactions = await queryRunner.manager
        .createQueryBuilder()
        .select([
          't.TRANX_ID AS TRANX_ID',
          't.TRANX_PAYMENT_STATUS AS TRANX_PAYMENT_STATUS',
          't.ERM_ID AS ERM_ID',
        ])
        .from('FIN_T_TRANSACTIONS', 't')
        .where('t.TRANX_ID IN (:...tranxIds)', { tranxIds })
        .getRawMany<TransactionStatusSnapshot>();

      const blockedStatuses = new Set<number>([
        TransactionPaymentStatus.REFUND,
        TransactionPaymentStatus.RECEIPT_VOIDED,
      ]);
      const blocked = transactions.filter((transaction) =>
        blockedStatuses.has(Number(transaction.TRANX_PAYMENT_STATUS)),
      );
      if (blocked.length > 0) {
        throw new BadRequestException(
          `Cannot approve refunded or receipt-voided transactions: ${blocked
            .map((transaction) => transaction.TRANX_ID)
            .join(', ')}`,
        );
      }

      // 1. Update Transactions
      const updateTranxResult = await queryRunner.manager
        .createQueryBuilder()
        .update('FIN_T_TRANSACTIONS')
        .set({
          TRANX_PAYMENT_STATUS: TransactionPaymentStatus.APPROVED,
          TRANX_MATCH_STATUS: TransactionMatchStatus.MATCH,
        })
        .where('TRANX_ID IN (:...tranxIds)', { tranxIds })
        .andWhere('TRANX_PAYMENT_STATUS NOT IN (:...excludedStatuses)', {
          excludedStatuses: [
            TransactionPaymentStatus.REFUND,
            TransactionPaymentStatus.RECEIPT_VOIDED,
          ],
        })
        .execute();

      // 2. Insert into History using the status before approval.
      if (transactions.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into('FIN_T_TRANSACTION_STATUS_HISTORY')
          .values(
            transactions.map((transaction) => ({
              TRANX_ID: Number(transaction.TRANX_ID),
              TSH_FROM: String(transaction.TRANX_PAYMENT_STATUS),
              TSH_TO: String(TransactionPaymentStatus.APPROVED),
              TSH_API_TYPE: TransactionApiType.APPROVE,
              TSH_RESP_CODE: '00',
              TSH_RESP_MESSAGE: 'SUCCESS',
              CREATED_AT: new Date(),
            })),
          )
          .execute();
      }

      // 3. Update Receipts
      const receiptRows = await queryRunner.manager
        .getRepository(Receipt)
        .find({
          where: { TRANX_ID: In(tranxIds) },
          select: ['RC_ID'],
        });
      const receiptIds = receiptRows.map((r) => r.RC_ID);
      await this.receiptNumberService.assignOnIssue(
        queryRunner.manager,
        receiptIds,
      );

      // 4. Update Exam Enrollments
      const ermIds = transactions
        .map((transaction) => Number(transaction.ERM_ID))
        .filter((ermId) => Number.isInteger(ermId) && ermId > 0);

      if (ermIds.length > 0) {
        await queryRunner.manager
          .createQueryBuilder()
          .update('EXAM_T_ENROLLMENTS')
          .set({ ERM_STATUS: ExamEnrollmentStatus.PAID })
          .where('ERM_ID IN (:...ermIds)', { ermIds })
          .execute();
      }

      await queryRunner.commitTransaction();
      return { success: true, updated: updateTranxResult.affected ?? 0 };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async listTestExportExams(): Promise<TestExportExamOption[]> {
    const rows = await this.dataSource
      .createQueryBuilder()
      .select([
        'exam.EXAM_ID AS EXAM_ID',
        'exam.EXAM_NAME AS EXAM_NAME',
        'exam.EXAM_ROUND AS EXAM_ROUND',
        'exam.EXAM_FISCAL_YEAR AS EXAM_FISCAL_YEAR',
        'exam.EXAM_DATE AS EXAM_DATE',
        'exam.EXAM_FEE AS EXAM_FEE',
        'COUNT(DISTINCT tr.TSR_ID) AS exportableCount',
      ])
      .from('EXAM_T_EXAM', 'exam')
      .innerJoin('EXAM_T_SESSIONS', 'session', 'session.EXAM_ID = exam.EXAM_ID')
      .innerJoin(
        'EXAM_T_ENROLLMENTS',
        'enrollment',
        'enrollment.SESSION_ID = session.SS_ID AND enrollment.DELETED_AT IS NULL AND enrollment.ERM_STATUS != :cancelledStatus',
        { cancelledStatus: ExamEnrollmentStatus.CANCELLED },
      )
      .innerJoin(
        'FIN_T_TRANSACTIONS',
        'transaction',
        'transaction.ERM_ID = enrollment.ERM_ID AND transaction.DELETED_AT IS NULL',
      )
      .innerJoin(
        'FIN_T_TRANSACTIONS_REFS',
        'tr',
        'tr.TRANX_ID = transaction.TRANX_ID AND tr.DELETED_AT IS NULL',
      )
      .where('exam.DELETED_AT IS NULL')
      .andWhere('exam.EXAM_FEE > 0')
      .groupBy('exam.EXAM_ID')
      .addGroupBy('exam.EXAM_NAME')
      .addGroupBy('exam.EXAM_ROUND')
      .addGroupBy('exam.EXAM_FISCAL_YEAR')
      .addGroupBy('exam.EXAM_DATE')
      .addGroupBy('exam.EXAM_FEE')
      .orderBy('exam.EXAM_DATE', 'DESC')
      .addOrderBy('exam.EXAM_ID', 'DESC')
      .getRawMany<TestExportExamRawRow>();

    return rows.map((row) => ({
      EXAM_ID: Number(row.EXAM_ID),
      EXAM_NAME: row.EXAM_NAME,
      EXAM_ROUND: row.EXAM_ROUND,
      EXAM_FISCAL_YEAR: row.EXAM_FISCAL_YEAR,
      EXAM_DATE: row.EXAM_DATE,
      EXAM_FEE: Number(row.EXAM_FEE),
      exportableCount: Number(row.exportableCount),
    }));
  }

  async getTestExportRows(examId: number): Promise<TestExportRow[]> {
    const exam = await this.dataSource
      .createQueryBuilder()
      .select(['exam.EXAM_ID AS EXAM_ID', 'exam.EXAM_FEE AS EXAM_FEE'])
      .from('EXAM_T_EXAM', 'exam')
      .where('exam.EXAM_ID = :examId', { examId })
      .andWhere('exam.DELETED_AT IS NULL')
      .getRawOne<{ EXAM_ID: number | string; EXAM_FEE: number | string }>();

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    if (Number(exam.EXAM_FEE) <= 0) {
      throw new BadRequestException(
        'Cannot export test payment CSV for exams without registration fee',
      );
    }

    const rows = await this.dataSource
      .createQueryBuilder()
      .select([
        'tr.TSC_REF1 AS TSC_REF1',
        'tr.TSC_REF2 AS TSC_REF2',
        `COALESCE(
          NULLIF(TRIM(CONCAT_WS(' ', profile.USER_TITLE_TH, profile.USER_FULLNAME_TH)), ''),
          NULLIF(TRIM(CONCAT_WS(' ', profile.USER_TITLE_EN, profile.USER_FULLNAME_EN)), ''),
          tp.TP_NAME,
          ''
        ) AS PAYER_NAME`,
        'transaction.TRANX_AMOUNT AS TRANX_AMOUNT',
        'transaction.TRANX_PAID_AT AS TRANX_PAID_AT',
        'transaction.TRANX_CREATED_AT AS TRANX_CREATED_AT',
      ])
      .from('FIN_T_TRANSACTIONS_REFS', 'tr')
      .innerJoin(
        'FIN_T_TRANSACTIONS',
        'transaction',
        'transaction.TRANX_ID = tr.TRANX_ID AND transaction.DELETED_AT IS NULL',
      )
      .innerJoin(
        'EXAM_T_ENROLLMENTS',
        'enrollment',
        'enrollment.ERM_ID = transaction.ERM_ID AND enrollment.DELETED_AT IS NULL AND enrollment.ERM_STATUS != :cancelledStatus',
        { cancelledStatus: ExamEnrollmentStatus.CANCELLED },
      )
      .innerJoin(
        'EXAM_T_SESSIONS',
        'session',
        'session.SS_ID = enrollment.SESSION_ID',
      )
      .innerJoin(
        'EXAM_T_EXAM',
        'exam',
        'exam.EXAM_ID = session.EXAM_ID AND exam.DELETED_AT IS NULL',
      )
      .leftJoin(
        'BUU_GET_T_USER_PROFILE',
        'profile',
        'profile.USER_ID = enrollment.USER_ID AND profile.DELETED_AT IS NULL',
      )
      .leftJoin(
        'FIN_T_TRANSACTION_PROFILE',
        'tp',
        'tp.TRANX_ID = transaction.TRANX_ID AND tp.DELETED_AT IS NULL',
      )
      .where('tr.DELETED_AT IS NULL')
      .andWhere('exam.EXAM_ID = :examId', { examId })
      .andWhere('exam.EXAM_FEE > 0')
      .orderBy('tr.TSR_ID', 'ASC')
      .getRawMany<TestExportRawRow>();

    return rows.map((row) => {
      const paymentSource = row.TRANX_PAID_AT ?? row.TRANX_CREATED_AT;
      const { paymentDate, paymentTime } =
        this.formatPaymentDateTime(paymentSource);
      const payerName = (row.PAYER_NAME ?? '').trim().slice(0, 20);

      return {
        applicantId: (row.TSC_REF1 ?? '').trim().slice(0, 20),
        referenceNo: row.TSC_REF2 ? row.TSC_REF2.trim().slice(0, 20) : null,
        payerName: payerName || 'Unknown',
        amount: Number(row.TRANX_AMOUNT).toFixed(2),
        paymentDate,
        paymentTime,
      };
    });
  }

  private formatPaymentDateTime(source: Date | string | null | undefined): {
    paymentDate: string;
    paymentTime: string;
  } {
    if (!source) {
      return { paymentDate: '', paymentTime: '' };
    }

    const date = source instanceof Date ? source : new Date(source);
    if (Number.isNaN(date.getTime())) {
      return { paymentDate: '', paymentTime: '' };
    }

    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeFormatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return {
      paymentDate: dateFormatter.format(date),
      paymentTime: timeFormatter.format(date),
    };
  }
}
