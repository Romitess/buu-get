import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { Exam } from './entities/exam.entity';
import { ExamPasscode } from './entities/exam-passcode.entity';
import { ExamPasscodeLog } from './entities/exam-passcode-log.entity';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { MoodleModule } from '../moodle/moodle.module';
import { ScoreRubricsModule } from '../score-rubrics/score-rubrics.module';
import { ExamScoresModule } from '../exam-scores/exam-scores.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exam,
      ExamPasscode,
      ExamPasscodeLog,
      ExamEnrollment,
    ]),
    MoodleModule,
    ScoreRubricsModule,
    ExamScoresModule,
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
