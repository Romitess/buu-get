import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoucherConfigsService } from './voucher-configs.service';
import { VoucherConfigsController } from './voucher-configs.controller';
import { ExamRule } from './entities/voucher-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamRule])],
  controllers: [VoucherConfigsController],
  providers: [VoucherConfigsService],
  exports: [VoucherConfigsService],
})
export class VoucherConfigsModule {}
