import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from 'src/common/utils/authz.util';
import { PaymentConfig } from '../../payment-configs/entities/payment-config.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { BankCallbackRequestDto } from '../dto/bank-callback-request.dto';
import { BankCallbackResponseDto } from '../dto/bank-callback-response.dto';
import { PaymentMode } from '../constants/payment-mode';
import { BillApprovalService } from './bill-approval.service';
import { BillPaymentService } from './bill-payment.service';
import { formatBankDateTime } from '../utils/bank-callback.util';

export interface MockPayResult {
  approval: BankCallbackResponseDto;
  payment: BankCallbackResponseDto;
}

@Injectable()
export class MockBankService {
  constructor(
    private readonly configService: ConfigService,
    private readonly billApprovalService: BillApprovalService,
    private readonly billPaymentService: BillPaymentService,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(PaymentConfig)
    private readonly paymentConfigRepository: Repository<PaymentConfig>,
  ) {}

  async mockPay(
    tranxId: number,
    user: AuthenticatedUser,
  ): Promise<MockPayResult> {
    const mode = this.getPaymentMode();
    if (mode !== PaymentMode.MOCK) {
      throw new ServiceUnavailableException(
        'Mock bank payment is only available when PAYMENT_MODE=mock',
      );
    }

    const transaction = await this.transactionsRepository.findOne({
      where: { TRANX_ID: tranxId },
      relations: ['ENROLLMENT', 'TRANSACTION_REF', 'PAYMENT_CONFIG'],
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${tranxId} not found`);
    }

    if (transaction.ENROLLMENT?.USER_ID !== user.userId) {
      throw new ForbiddenException(
        'You are not allowed to mock-pay this transaction',
      );
    }

    const ref = transaction.TRANSACTION_REF;
    if (!ref?.TSC_REF1 || !ref.TSC_REF2) {
      throw new NotFoundException(
        'Transaction refs are missing; recreate payment intent first',
      );
    }

    const paymentConfig =
      transaction.PAYMENT_CONFIG ??
      (await this.paymentConfigRepository.findOne({
        where: { PC_ID: transaction.PC_ID },
      }));

    const now = new Date();
    const dateTime = formatBankDateTime(now);
    const effDate = dateTime.slice(0, 8);
    const bankRef = `MOCK${dateTime}`;

    const baseBody: BankCallbackRequestDto = {
      user: this.configService.getOrThrow<string>('BANK_API_USER'),
      password: this.configService.getOrThrow<string>('BANK_API_PASSWORD'),
      comCode:
        paymentConfig?.PC_COMP_CODE ??
        this.configService.get<string>('BANK_COM_CODE', 'BUU'),
      prodCode:
        paymentConfig?.PC_PROD_CODE ??
        this.configService.get<string>('BANK_PROD_CODE', 'GET'),
      command: 'approve',
      bankCode: transaction.TRANX_BANK_CODE || '014',
      bankRef,
      dateTime,
      effDate,
      amount: String(Number(transaction.TRANX_AMOUNT)),
      channel: 'mobile',
      cusName: 'Mock Bank Payer',
      ref1: ref.TSC_REF1,
      ref2: ref.TSC_REF2,
      ref3: '',
      ref4: '',
    };

    const approval = await this.billApprovalService.approve(baseBody);

    const paymentBody: BankCallbackRequestDto = {
      ...baseBody,
      command: 'payment',
      tranxId: String(approval.tranxId ?? tranxId),
      dateTime: formatBankDateTime(new Date()),
    };

    const payment = await this.billPaymentService.payment(paymentBody);

    return { approval, payment };
  }

  getPaymentMode(): PaymentMode {
    const raw = this.configService.get<string>('PAYMENT_MODE', PaymentMode.CSV);
    if (
      raw === PaymentMode.MOCK ||
      raw === PaymentMode.REALTIME_BANK ||
      raw === PaymentMode.CSV
    ) {
      return raw;
    }
    return PaymentMode.CSV;
  }

  assertBankCallbacksEnabled(): void {
    const mode = this.getPaymentMode();
    if (mode === PaymentMode.CSV) {
      throw new ServiceUnavailableException(
        'Bank callback APIs are disabled when PAYMENT_MODE=csv',
      );
    }
  }
}
