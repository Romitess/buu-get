import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentConfig } from '../payment-configs/entities/payment-config.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { BankCallbackController } from './bank-callback.controller';
import { RequestApproval } from './entities/request-approval.entity';
import { RequestPayment } from './entities/request-payment.entity';
import { BillApprovalService } from './services/bill-approval.service';
import { BillPaymentService } from './services/bill-payment.service';
import { MockBankService } from './services/mock-bank.service';
import { PaymentStatusService } from './services/payment-status.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RequestApproval,
      RequestPayment,
      Transaction,
      PaymentConfig,
    ]),
  ],
  controllers: [BankCallbackController],
  providers: [
    BillApprovalService,
    BillPaymentService,
    MockBankService,
    PaymentStatusService,
  ],
  exports: [
    BillApprovalService,
    BillPaymentService,
    MockBankService,
    PaymentStatusService,
  ],
})
export class BankCallbacksModule {}
