import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamLocationSeatsController } from './exam-location-seats.controller';
import { ExamLocationSeatsService } from './exam-location-seats.service';
import { ExamLocationSeat } from './entities/exam-location-seat.entity';
import { ExamLocation } from '../exam-locations/entities/exam-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamLocationSeat, ExamLocation])],
  controllers: [ExamLocationSeatsController],
  providers: [ExamLocationSeatsService],
  exports: [ExamLocationSeatsService],
})
export class ExamLocationSeatsModule {}
