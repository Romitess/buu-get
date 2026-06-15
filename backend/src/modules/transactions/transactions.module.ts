import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { Receipt } from '../receipts/entities/receipt.entity';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { PaymentConfig } from '../payment-configs/entities/payment-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Transaction,
      Receipt,
      ExamEnrollment,
      PaymentConfig,
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
