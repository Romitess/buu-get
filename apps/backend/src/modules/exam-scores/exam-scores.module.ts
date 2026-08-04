import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamScoresService } from './exam-scores.service';
import { ExamScoresController } from './exam-scores.controller';
import { ExamScore } from './entities/exam-score.entity';
import { ExamScoreLine } from './entities/exam-score-line.entity';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { ScoreCriteriaModule } from '../score-criteria/score-criteria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamScore, ExamScoreLine, ExamEnrollment]),
    ScoreCriteriaModule,
  ],
  controllers: [ExamScoresController],
  providers: [ExamScoresService],
  exports: [ExamScoresService],
})
export class ExamScoresModule {}
