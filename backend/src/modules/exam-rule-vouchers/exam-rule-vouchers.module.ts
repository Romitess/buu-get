import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamRuleVouchersService } from './exam-rule-vouchers.service';
import { ExamRuleVouchersController } from './exam-rule-vouchers.controller';
import { ExamRuleVoucher } from './entities/exam-rule-voucher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamRuleVoucher])],
  controllers: [ExamRuleVouchersController],
  providers: [ExamRuleVouchersService],
  exports: [ExamRuleVouchersService],
})
export class ExamRuleVouchersModule {}
