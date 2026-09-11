import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankCallbacksModule } from '../bank-callbacks/bank-callback.module';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { Receipt } from '../receipts/entities/receipt.entity';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { PaymentConfig } from '../payment-configs/entities/payment-config.entity';
import { TransactionStatusHistory } from '../transaction-status-history/entities/transaction-status-history.entity';
import { TransactionRef } from '../transaction-refs/entities/transaction-ref.entity';
import { TransactionProfile } from '../transaction-profiles/entities/transaction-profile.entity';
import { EnrollmentAuditModule } from '../enrollment-audit/enrollment-audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      Receipt,
      ExamEnrollment,
      PaymentConfig,
      TransactionStatusHistory,
      TransactionRef,
      TransactionProfile,
    ]),
    EnrollmentAuditModule,
    BankCallbacksModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
