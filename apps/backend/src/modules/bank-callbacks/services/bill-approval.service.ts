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
  TransactionPaymentStatus,
} from '../../transactions/entities/transaction.entity';
import { TransactionRef } from '../../transaction-refs/entities/transaction-ref.entity';
import {
  TransactionApiType,
  TransactionStatusHistory,
} from '../../transaction-status-history/entities/transaction-status-history.entity';
import { BankCallbackRequestDto } from '../dto/bank-callback-request.dto';
import { BankCallbackResponseDto } from '../dto/bank-callback-response.dto';
import { RequestApproval } from '../entities/request-approval.entity';
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
export class BillApprovalService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @InjectRepository(RequestApproval)
    private readonly requestApprovalRepository: Repository<RequestApproval>,
  ) {}

  async approve(
    body: BankCallbackRequestDto,
  ): Promise<BankCallbackResponseDto> {
    // lifelong: 1 callback = 2 rows (request + response)
    await this.insertRequestLog(body);

    const bankRef = body.bankRef ?? '';
    const amount = body.amount ?? '';
    const cusName = body.cusName ?? '';

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
        }),
      );
    }

    const ref1 = body.ref1 ?? '';
    const ref2 = body.ref2 ?? '';

    const ref = await this.dataSource.getRepository(TransactionRef).findOne({
      where: { TSC_REF1: ref1, TSC_REF2: ref2 },
      relations: ['TRANSACTION', 'TRANSACTION.ENROLLMENT'],
    });

    if (!ref?.TRANSACTION) {
      return this.insertResponseLog(
        body,
        buildBankResponse({
          respCode: BankRespCode.INVALID_REFERENCE,
          bankRef,
          amount,
          cusName,
        }),
      );
    }

    const transaction = ref.TRANSACTION;
    const enrollment = transaction.ENROLLMENT;

    if (!enrollment) {
      return this.insertResponseLog(
        body,
        buildBankResponse({
          respCode: BankRespCode.INVALID_REFERENCE,
          bankRef,
          amount,
          cusName,
        }),
      );
    }

    if (enrollment.ERM_STATUS !== ExamEnrollmentStatus.UNPAID) {
      return this.insertResponseLog(
        body,
        buildBankResponse({
          respCode: BankRespCode.DUPLICATE,
          bankRef,
          amount,
          cusName,
          tranxId: transaction.TRANX_ID,
        }),
      );
    }

    if (
      transaction.TRANX_PAYMENT_STATUS !== TransactionPaymentStatus.PENDING &&
      transaction.TRANX_PAYMENT_STATUS !== TransactionPaymentStatus.APPROVED
    ) {
      return this.insertResponseLog(
        body,
        buildBankResponse({
          respCode: BankRespCode.INVALID_REFERENCE,
          bankRef,
          amount,
          cusName,
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
          respMsg: 'Bill Payment Expired',
        }),
      );
    }

    const seatFull = await this.isSessionFull(enrollment.SESSION_ID);
    if (seatFull) {
      return this.insertResponseLog(
        body,
        buildBankResponse({
          respCode: BankRespCode.EXPIRED,
          bankRef,
          amount,
          cusName,
          respMsg: 'Bill Payment Expired.',
        }),
      );
    }

    if (!amountsEqual(transaction.TRANX_AMOUNT, amount)) {
      return this.insertResponseLog(
        body,
        buildBankResponse({
          respCode: BankRespCode.INVALID_AMOUNT,
          bankRef,
          amount,
          cusName,
        }),
      );
    }

    if (transaction.TRANX_PAYMENT_STATUS === TransactionPaymentStatus.PENDING) {
      await this.dataSource.transaction(async (manager) => {
        const locked = await manager
          .getRepository(Transaction)
          .createQueryBuilder('t')
          .setLock('pessimistic_write')
          .where('t.TRANX_ID = :id', { id: transaction.TRANX_ID })
          .getOne();

        if (
          locked &&
          locked.TRANX_PAYMENT_STATUS === TransactionPaymentStatus.PENDING
        ) {
          locked.TRANX_PAYMENT_STATUS = TransactionPaymentStatus.APPROVED;
          locked.TRANX_BANK_DATETIME = parsed.asDate;
          locked.TRANX_EFFECTIVE_DATE = parsed.asDate;
          locked.TRANX_UPDATED_AT = new Date();
          await manager.getRepository(Transaction).save(locked);

          await manager.getRepository(TransactionStatusHistory).save(
            manager.getRepository(TransactionStatusHistory).create({
              TRANX_ID: locked.TRANX_ID,
              TSH_FROM: String(TransactionPaymentStatus.PENDING),
              TSH_TO: String(TransactionPaymentStatus.APPROVED),
              TSH_API_TYPE: TransactionApiType.APPROVE,
              TSH_RESP_CODE: BankRespCode.SUCCESS,
              TSH_RESP_MESSAGE: 'Bill approved',
            }),
          );
        }
      });
    }

    return this.insertResponseLog(
      body,
      buildBankResponse({
        respCode: BankRespCode.SUCCESS,
        bankRef,
        amount,
        cusName,
        tranxId: transaction.TRANX_ID,
      }),
    );
  }

  private async isSessionFull(sessionId: number): Promise<boolean> {
    const session = await this.dataSource.getRepository(ExamSession).findOne({
      where: { SS_ID: sessionId },
    });
    if (!session?.SS_CAPACITY) {
      return false;
    }

    const reserved = await this.dataSource.getRepository(ExamEnrollment).count({
      where: {
        SESSION_ID: sessionId,
        ERM_STATUS: Not(In([ExamEnrollmentStatus.CANCELLED])),
      },
    });

    return reserved >= session.SS_CAPACITY;
  }

  private async insertRequestLog(
    body: BankCallbackRequestDto,
  ): Promise<RequestApproval> {
    return this.requestApprovalRepository.save(
      this.requestApprovalRepository.create({
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
    await this.requestApprovalRepository.save(
      this.requestApprovalRepository.create({
        REF1: clipToLength(body.ref1, 20),
        REF2: clipToLength(body.ref2, 20),
        TRANXID: mapped.TRANXID,
        BANKREF: mapped.BANKREF,
        RESPCODE: mapped.RESPCODE,
        RESPMSG: mapped.RESPMSG,
        BALANCE: mapped.BALANCE,
        CUSNAME: mapped.CUSNAME,
        INFO: mapped.INFO ? mapped.INFO.slice(0, 50) : null,
      }),
    );
    return response;
  }
}
