import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankReconcilesService } from './bank-reconciles.service';
import { BankReconcilesController } from './bank-reconciles.controller';
import { BankReconcile } from './entities/bank-reconcile.entity';
import { BankReconcileEditLog } from './entities/bank-reconcile-edit-log.entity';
import { TransactionRef } from '../transaction-refs/entities/transaction-ref.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { ReceiptsModule } from '../receipts/receipts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BankReconcile,
      BankReconcileEditLog,
      TransactionRef,
      Transaction,
    ]),
    ReceiptsModule,
  ],
  controllers: [BankReconcilesController],
  providers: [BankReconcilesService],
  exports: [BankReconcilesService],
})
export class BankReconcilesModule {}
