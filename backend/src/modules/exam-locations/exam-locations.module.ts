import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamLocationsController } from './exam-locations.controller';
import { ExamLocationsService } from './exam-locations.service';
import { ExamLocation } from './entities/exam-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamLocation])],
  controllers: [ExamLocationsController],
  providers: [ExamLocationsService],
  exports: [ExamLocationsService],
})
export class ExamLocationsModule {}
