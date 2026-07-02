import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamScoresService } from './exam-scores.service';
import { ExamScoresController } from './exam-scores.controller';
import { ExamScore } from './entities/exam-score.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamScore])],
  controllers: [ExamScoresController],
  providers: [ExamScoresService],
})
export class ExamScoresModule {}
