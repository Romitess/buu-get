import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionRefsService } from './transaction-refs.service';
import { TransactionRefsController } from './transaction-refs.controller';
import { TransactionRef } from './entities/transaction-ref.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionRef])],
  controllers: [TransactionRefsController],
  providers: [TransactionRefsService],
  exports: [TransactionRefsService],
})
export class TransactionRefsModule {}
