import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoreRubricsService } from './score-rubrics.service';
import { ScoreRubricsController } from './score-rubrics.controller';
import { ScoreRubric } from './entities/score-rubric.entity';
import { ScoreRubricItem } from './entities/score-rubric-item.entity';
import { Exam } from '../exam/entities/exam.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScoreRubric, ScoreRubricItem, Exam])],
  controllers: [ScoreRubricsController],
  providers: [ScoreRubricsService],
  exports: [ScoreRubricsService],
})
export class ScoreRubricsModule {}
