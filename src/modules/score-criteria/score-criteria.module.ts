import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoreCriteriaService } from './score-criteria.service';
import { ScoreCriteriaController } from './score-criteria.controller';
import { ScoreCriteria } from './entities/score-criteria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScoreCriteria])],
  controllers: [ScoreCriteriaController],
  providers: [ScoreCriteriaService],
  exports: [ScoreCriteriaService],
})
export class ScoreCriteriaModule {}
