import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionPaymentStatus,
} from '../../transactions/entities/transaction.entity';
import { RequestApproval } from '../entities/request-approval.entity';
import { RequestPayment } from '../entities/request-payment.entity';
import { MockBankService } from './mock-bank.service';
import { PaymentMode } from '../constants/payment-mode';

export interface PaymentStatusResult {
  tranxId: number;
  paymentStatus: TransactionPaymentStatus;
  paid: boolean;
  ref1: string | null;
  ref2: string | null;
  amount: number;
  qrCode: string | null;
  expiresAt: Date | null;
  paymentMode: PaymentMode;
  message: string | null;
}

@Injectable()
export class PaymentStatusService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(RequestApproval)
    private readonly requestApprovalRepository: Repository<RequestApproval>,
    @InjectRepository(RequestPayment)
    private readonly requestPaymentRepository: Repository<RequestPayment>,
    private readonly mockBankService: MockBankService,
  ) {}

  async getStatus(tranxId: number): Promise<PaymentStatusResult> {
    const transaction = await this.transactionsRepository.findOne({
      where: { TRANX_ID: tranxId },
      relations: ['TRANSACTION_REF'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${tranxId} not found`);
    }

    const paid =
      transaction.TRANX_PAYMENT_STATUS === TransactionPaymentStatus.PAID;

    let message: string | null = null;
    if (!paid) {
      message = await this.consumeLatestErrorMessage(
        transaction.TRANSACTION_REF?.TSC_REF1 ?? null,
        transaction.TRANSACTION_REF?.TSC_REF2 ?? null,
      );
    }

    return {
      tranxId: transaction.TRANX_ID,
      paymentStatus: transaction.TRANX_PAYMENT_STATUS,
      paid,
      ref1: transaction.TRANSACTION_REF?.TSC_REF1 ?? null,
      ref2: transaction.TRANSACTION_REF?.TSC_REF2 ?? null,
      amount: Number(transaction.TRANX_AMOUNT),
      qrCode: transaction.TRANX_QR_CODE,
      expiresAt: transaction.TRANX_EXPIRES_AT,
      paymentMode: this.mockBankService.getPaymentMode(),
      message: paid ? 'ชำระเงินสำเร็จ' : message,
    };
  }

  private async consumeLatestErrorMessage(
    ref1: string | null,
    ref2: string | null,
  ): Promise<string | null> {
    if (!ref1 || !ref2) {
      return null;
    }

    const paymentError = await this.requestPaymentRepository
      .createQueryBuilder('p')
      .where('p.REF1 = :ref1', { ref1 })
      .andWhere('p.REF2 = :ref2', { ref2 })
      .andWhere('p.RESPCODE IS NOT NULL')
      .andWhere('p.RESPCODE <> 0')
      .andWhere('p.SHOW_MSG IS NULL')
      .orderBy('p.CREATEDATE', 'DESC')
      .addOrderBy('p.ID', 'DESC')
      .getOne();

    if (paymentError?.RESPMSG) {
      paymentError.SHOW_MSG = 'Y';
      await this.requestPaymentRepository.save(paymentError);
      return paymentError.RESPMSG;
    }

    const approvalError = await this.requestApprovalRepository
      .createQueryBuilder('a')
      .where('a.REF1 = :ref1', { ref1 })
      .andWhere('a.REF2 = :ref2', { ref2 })
      .andWhere('a.RESPCODE IS NOT NULL')
      .andWhere('a.RESPCODE <> 0')
      .andWhere('a.SHOW_MSG IS NULL')
      .orderBy('a.CREATEDATE', 'DESC')
      .addOrderBy('a.ID', 'DESC')
      .getOne();

    if (approvalError?.RESPMSG) {
      approvalError.SHOW_MSG = 'Y';
      await this.requestApprovalRepository.save(approvalError);
      return approvalError.RESPMSG;
    }

    return null;
  }
}
