import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoidedReceiptsService } from './voided-receipts.service';
import { VoidedReceiptsController } from './voided-receipts.controller';
import { VoidedReceipt } from './entities/voided-receipt.entity';
import { Receipt } from '../receipts/entities/receipt.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { TransactionStatusHistory } from '../transaction-status-history/entities/transaction-status-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VoidedReceipt,
      Receipt,
      Transaction,
      ExamEnrollment,
      TransactionStatusHistory,
    ]),
  ],
  controllers: [VoidedReceiptsController],
  providers: [VoidedReceiptsService],
  exports: [VoidedReceiptsService],
})
export class VoidedReceiptsModule {}
