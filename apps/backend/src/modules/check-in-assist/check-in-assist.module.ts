import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { CheckInAssistController } from './check-in-assist.controller';
import { CheckInAssistService } from './check-in-assist.service';
import { CheckInAssistSession } from './entities/check-in-assist-session.entity';
import { CheckInAssistEvent } from './entities/check-in-assist-event.entity';
import { ExamEnrollmentsModule } from '../exam-enrollments/exam-enrollments.module';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { Exam } from '../exam/entities/exam.entity';
import { ExamSessionLocation } from '../exam-session-locations/entities/exam-session-location.entity';
import { ExamSessionLocationProctor } from '../exam-session-locations/entities/exam-session-location-proctor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CheckInAssistSession,
      CheckInAssistEvent,
      ExamEnrollment,
      Exam,
      ExamSessionLocation,
      ExamSessionLocationProctor,
    ]),
    ExamEnrollmentsModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
  ],
  controllers: [CheckInAssistController],
  providers: [CheckInAssistService],
})
export class CheckInAssistModule {}
