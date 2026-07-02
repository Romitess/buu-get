import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamEnrollmentsController } from './exam-enrollments.controller';
import { ExamEnrollmentsService } from './exam-enrollments.service';
import { ExamEnrollment } from './entities/exam-enrollment.entity';
import { ExamSession } from '../exam-sessions/entities/exam-session.entity';
import { ExamSessionLocation } from '../exam-session-locations/entities/exam-session-location.entity';
import { ExamLocationSeat } from '../exam-location-seats/entities/exam-location-seat.entity';
import { ExamPasscode } from '../exam/entities/exam-passcode.entity';
import { User } from '../users/entities/user.entity';
import { ExamPasscodeLog } from '../exam/entities/exam-passcode-log.entity';
import { TestTakerIdService } from './test-taker-id.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamEnrollment,
      ExamSession,
      ExamSessionLocation,
      ExamLocationSeat,
      ExamPasscode,
      ExamPasscodeLog,
      User,
    ]),
  ],
  controllers: [ExamEnrollmentsController],
  providers: [ExamEnrollmentsService, TestTakerIdService],
  exports: [ExamEnrollmentsService, TestTakerIdService],
})
export class ExamEnrollmentsModule {}
