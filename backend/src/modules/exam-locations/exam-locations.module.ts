import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamLocationsController } from './exam-locations.controller';
import { ExamLocationsService } from './exam-locations.service';
import { ExamLocation } from './entities/exam-location.entity';
import { ExamLocationSeat } from '../exam-location-seats/entities/exam-location-seat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamLocation, ExamLocationSeat])],
  controllers: [ExamLocationsController],
  providers: [ExamLocationsService],
  exports: [ExamLocationsService],
})
export class ExamLocationsModule {}
