import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamVouchersService } from './exam-vouchers.service';
import { ExamVouchersController } from './exam-vouchers.controller';
import { ExamVoucher } from './entities/exam-voucher.entity';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamVoucher, ExamEnrollment])],
  controllers: [ExamVouchersController],
  providers: [ExamVouchersService],
  exports: [ExamVouchersService],
})
export class ExamVouchersModule {}
