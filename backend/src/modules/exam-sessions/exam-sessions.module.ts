import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamSessionsController } from './exam-sessions.controller';
import { ExamSessionsService } from './exam-sessions.service';
import { ExamSession } from './entities/exam-session.entity';
import { ExamSessionLocation } from '../exam-session-locations/entities/exam-session-location.entity';
import { ExamLocationsModule } from '../exam-locations/exam-locations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamSession, ExamSessionLocation]),
    ExamLocationsModule,
  ],
  controllers: [ExamSessionsController],
  providers: [ExamSessionsService],
  exports: [ExamSessionsService],
})
export class ExamSessionsModule {}
