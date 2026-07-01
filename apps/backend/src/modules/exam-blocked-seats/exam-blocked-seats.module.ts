import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamBlockedSeat } from './entities/exam-blocked-seat.entity';
import { ExamBlockedSeatsService } from './exam-blocked-seats.service';
import { ExamBlockedSeatsController } from './exam-blocked-seats.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ExamBlockedSeat])],
  controllers: [ExamBlockedSeatsController],
  providers: [ExamBlockedSeatsService],
  exports: [TypeOrmModule, ExamBlockedSeatsService],
})
export class ExamBlockedSeatsModule {}
