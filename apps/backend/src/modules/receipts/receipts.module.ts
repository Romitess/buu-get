import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptsService } from './receipts.service';
import { ReceiptNumberService } from './receipt-number.service';
import { ReceiptIssueService } from './receipt-issue.service';
import { ReceiptsController } from './receipts.controller';
import { Receipt } from './entities/receipt.entity';
import { ReceiptSequence } from './entities/receipt-sequence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Receipt, ReceiptSequence])],
  controllers: [ReceiptsController],
  providers: [ReceiptsService, ReceiptNumberService, ReceiptIssueService],
  exports: [ReceiptsService, ReceiptNumberService, ReceiptIssueService],
})
export class ReceiptsModule {}
