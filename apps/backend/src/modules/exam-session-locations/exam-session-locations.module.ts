import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamSessionLocationsController } from './exam-session-locations.controller';
import { ExamSessionLocationsService } from './exam-session-locations.service';
import { ExamSessionLocation } from './entities/exam-session-location.entity';
import { ExamSessionLocationProctor } from './entities/exam-session-location-proctor.entity';
import { ExamLocation } from '../exam-locations/entities/exam-location.entity';
import { ExamSession } from '../exam-sessions/entities/exam-session.entity';
import { MsgPerson } from '../msg-persons/entities/msg-person.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamSessionLocation,
      ExamSessionLocationProctor,
      ExamLocation,
      ExamSession,
      MsgPerson,
    ]),
  ],
  controllers: [ExamSessionLocationsController],
  providers: [ExamSessionLocationsService],
  exports: [ExamSessionLocationsService],
})
export class ExamSessionLocationsModule {}
