import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamAttendancesService } from './exam-attendances.service';
import { ExamAttendancesController } from './exam-attendances.controller';
import { ExamAttendance } from './entities/exam-attendance.entity';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamAttendance, ExamEnrollment])],
  controllers: [ExamAttendancesController],
  providers: [ExamAttendancesService],
  exports: [ExamAttendancesService],
})
export class ExamAttendancesModule {}
