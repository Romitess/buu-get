import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoidedReceiptsService } from './voided-receipts.service';
import { VoidedReceiptsController } from './voided-receipts.controller';
import { VoidedReceipt } from './entities/voided-receipt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VoidedReceipt])],
  controllers: [VoidedReceiptsController],
  providers: [VoidedReceiptsService],
  exports: [VoidedReceiptsService],
})
export class VoidedReceiptsModule {}
