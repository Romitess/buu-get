import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionStatusHistoryService } from './transaction-status-history.service';
import { TransactionStatusHistoryController } from './transaction-status-history.controller';
import { TransactionStatusHistory } from './entities/transaction-status-history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionStatusHistory])],
  controllers: [TransactionStatusHistoryController],
  providers: [TransactionStatusHistoryService],
  exports: [TransactionStatusHistoryService],
})
export class TransactionStatusHistoryModule {}
