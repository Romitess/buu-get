import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../../exam-enrollments/entities/exam-enrollment.entity';
import { ExamSession } from '../../exam-sessions/entities/exam-session.entity';
import {
  Transaction,
  TransactionMatchStatus,
  TransactionPaymentStatus,
} from '../../transactions/entities/transaction.entity';
import { TransactionRef } from '../../transaction-refs/entities/transaction-ref.entity';
import {
  TransactionApiType,
  TransactionStatusHistory,
} from '../../transaction-status-history/entities/transaction-status-history.entity';
import { BankCallbackRequestDto } from '../dto/bank-callback-request.dto';
import { BankCallbackResponseDto } from '../dto/bank-callback-response.dto';
import { RequestPayment } from '../entities/request-payment.entity';
import {
  amountsEqual,
  buildBankResponse,
  clipToLength,
  mapBankCallbackRequestToLog,
  mapBankCallbackResponseToLog,
  maskBankRequestData,
  parseBankDateTime,
  BankRespCode,
} from '../utils/bank-callback.util';

@Injectable()
export class BillPaymentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @InjectRepository(RequestPayment)
    private readonly requestPaymentRepository: Repository<RequestPayment>,
  ) {}

  async payment(
    body: BankCallbackRequestDto,
  ): Promise<BankCallbackResponseDto> {
    // lifelong: 1 callback = 2 rows (request + response)
    await this.insertRequestLog(body);

    const bankRef = body.bankRef ?? '';
    const amount = body.amount ?? '';
    const cusName = body.cusName ?? '';
    const tranxIdRaw = body.tranxId ?? '';

    const expectedUser = this.configService.getOrThrow<string>('BANK_API_USER');
    const expectedPassword =
      this.configService.getOrThrow<string>('BANK_API_PASSWORD');

    if (
      (body.user ?? '') !== expectedUser ||
      (body.password ?? '') !== expectedPassword
    ) {
      return this.insertResponseLog(
        body,
        buildBankResponse({
          respCode: BankRespCode.INVALID_CREDENTIALS,
          bankRef,
          amount,
          cusName,
          tranxId: tranxIdRaw || null,
        }),
      );
    }

    const tranxId = Number(tranxIdRaw);
    if (!tranxIdRaw || Number.isNaN(tranxId)) {
      return this.insertResponseLog(
        body,
        buildBankResponse({
          respCode: BankRespCode.INVALID_TRANX,
          bankRef,
          amount,
          cusName,
          tranxId: tranxIdRaw || null,
        }),
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const transaction = await manager
        .getRepository(Transaction)
        .createQueryBuilder('t')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('t.TRANSACTION_REF', 'ref')
        .leftJoinAndSelect('t.ENROLLMENT', 'enrollment')
        .where('t.TRANX_ID = :id', { id: tranxId })
        .getOne();

      if (!transaction) {
        return this.insertResponseLog(
          body,
          buildBankResponse({
            respCode: BankRespCode.INVALID_TRANX,
            bankRef,
            amount,
            cusName,
            tranxId,
          }),
        );
      }

      const ref = transaction.TRANSACTION_REF;
      const ref1 = body.ref1 ?? '';
      const ref2 = body.ref2 ?? '';

      if (!ref || ref.TSC_REF1 !== ref1 || ref.TSC_REF2 !== ref2) {
        return this.insertResponseLog(
          body,
          buildBankResponse({
            respCode: BankRespCode.INVALID_REFERENCE,
            bankRef,
            amount,
            cusName,
            tranxId,
          }),
        );
      }

      if (transaction.TRANX_PAYMENT_STATUS === TransactionPaymentStatus.PAID) {
        return this.insertResponseLog(
          body,
          buildBankResponse({
            respCode: BankRespCode.OVER_LIMIT,
            bankRef,
            amount,
            cusName,
            tranxId,
          }),
        );
      }

      const enrollment = transaction.ENROLLMENT;
      if (
        enrollment &&
        enrollment.ERM_STATUS !== ExamEnrollmentStatus.UNPAID
      ) {
        return this.insertResponseLog(
          body,
          buildBankResponse({
            respCode: BankRespCode.DUPLICATE,
            bankRef,
            amount,
            cusName,
            tranxId,
          }),
        );
      }

      const parsed = parseBankDateTime(body.dateTime);
      if (!parsed) {
        return this.insertResponseLog(
          body,
          buildBankResponse({
            respCode: BankRespCode.EXPIRED,
            bankRef,
            amount,
            cusName,
            tranxId,
            respMsg: 'Bill Payment Expired',
          }),
        );
      }

      if (
        transaction.TRANX_EXPIRES_AT &&
        parsed.asDate > transaction.TRANX_EXPIRES_AT
      ) {
        return this.insertResponseLog(
          body,
          buildBankResponse({
            respCode: BankRespCode.EXPIRED,
            bankRef,
            amount,
            cusName,
            tranxId,
            respMsg: 'Bill Payment Expired',
          }),
        );
      }

      if (enrollment) {
        const seatFull = await this.isSessionFull(
          manager.getRepository(ExamSession),
          manager.getRepository(ExamEnrollment),
          enrollment.SESSION_ID,
        );
        if (seatFull) {
          return this.insertResponseLog(
            body,
            buildBankResponse({
              respCode: BankRespCode.EXPIRED,
              bankRef,
              amount,
              cusName,
              tranxId,
              respMsg: 'Bill Payment Expired.',
            }),
          );
        }
      }

      if (!amountsEqual(transaction.TRANX_AMOUNT, amount)) {
        return this.insertResponseLog(
          body,
          buildBankResponse({
            respCode: BankRespCode.INVALID_AMOUNT,
            bankRef,
            amount,
            cusName,
            tranxId,
          }),
        );
      }

      const previousStatus = transaction.TRANX_PAYMENT_STATUS;
      transaction.TRANX_PAYMENT_STATUS = TransactionPaymentStatus.PAID;
      transaction.TRANX_MATCH_STATUS = TransactionMatchStatus.MATCH;
      transaction.TRANX_PAID_AT = parsed.asDate;
      transaction.TRANX_BANK_DATETIME = parsed.asDate;
      transaction.TRANX_EFFECTIVE_DATE = parsed.asDate;
      transaction.TRANX_UPDATED_AT = new Date();
      if (body.bankCode) {
        transaction.TRANX_BANK_CODE = body.bankCode.slice(0, 3);
      }
      if (body.bankRef) {
        ref.TSC_BANK_REF = body.bankRef.slice(0, 20);
        await manager.getRepository(TransactionRef).save(ref);
      }
      await manager.getRepository(Transaction).save(transaction);

      if (enrollment) {
        enrollment.ERM_STATUS = ExamEnrollmentStatus.PAID;
        await manager.getRepository(ExamEnrollment).save(enrollment);
      }

      await manager.getRepository(TransactionStatusHistory).save(
        manager.getRepository(TransactionStatusHistory).create({
          TRANX_ID: transaction.TRANX_ID,
          TSH_FROM: String(previousStatus),
          TSH_TO: String(TransactionPaymentStatus.PAID),
          TSH_API_TYPE: TransactionApiType.PAYMENT,
          TSH_RESP_CODE: BankRespCode.SUCCESS,
          TSH_RESP_MESSAGE: 'Payment confirmed by bank callback',
        }),
      );

      return this.insertResponseLog(
        body,
        buildBankResponse({
          respCode: BankRespCode.SUCCESS,
          bankRef,
          amount,
          cusName,
          tranxId,
        }),
      );
    });
  }

  private async isSessionFull(
    sessionRepo: Repository<ExamSession>,
    enrollmentRepo: Repository<ExamEnrollment>,
    sessionId: number,
  ): Promise<boolean> {
    const session = await sessionRepo.findOne({ where: { SS_ID: sessionId } });
    if (!session?.SS_CAPACITY) {
      return false;
    }

    const reserved = await enrollmentRepo.count({
      where: {
        SESSION_ID: sessionId,
        ERM_STATUS: Not(In([ExamEnrollmentStatus.CANCELLED])),
      },
    });

    return reserved >= session.SS_CAPACITY;
  }

  private async insertRequestLog(
    body: BankCallbackRequestDto,
  ): Promise<RequestPayment> {
    return this.requestPaymentRepository.save(
      this.requestPaymentRepository.create({
        ...mapBankCallbackRequestToLog(body),
        REQUEST_DATA: maskBankRequestData(body),
      }),
    );
  }

  /** lifelong insert_response: separate row with REF1/REF2 + resp fields */
  private async insertResponseLog(
    body: BankCallbackRequestDto,
    response: BankCallbackResponseDto,
  ): Promise<BankCallbackResponseDto> {
    const mapped = mapBankCallbackResponseToLog(response);
    await this.requestPaymentRepository.save(
      this.requestPaymentRepository.create({
        REF1: clipToLength(body.ref1, 20),
        REF2: clipToLength(body.ref2, 20),
        TRANXID: mapped.TRANXID,
        BANKREF: mapped.BANKREF,
        RESPCODE: mapped.RESPCODE,
        RESPMSG: mapped.RESPMSG,
        BALANCE: mapped.BALANCE,
        CUSNAME: mapped.CUSNAME,
        INFO: mapped.INFO,
      }),
    );
    return response;
  }
}
