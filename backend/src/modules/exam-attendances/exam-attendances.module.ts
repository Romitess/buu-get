import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamAttendancesService } from './exam-attendances.service';
import { ExamAttendancesController } from './exam-attendances.controller';
import { ExamAttendance } from './entities/exam-attendance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamAttendance])],
  controllers: [ExamAttendancesController],
  providers: [ExamAttendancesService],
  exports: [ExamAttendancesService],
})
export class ExamAttendancesModule {}
