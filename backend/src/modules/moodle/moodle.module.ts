import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodleSyncLogsModule } from '../moodle-sync-logs/moodle-sync-logs.module';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { MoodleClientService } from './moodle-client.service';
import { MoodleSyncService } from './moodle-sync.service';
import { MoodleEnrolWorker } from './moodle-enrol.worker';

@Module({
  imports: [MoodleSyncLogsModule, TypeOrmModule.forFeature([ExamEnrollment])],
  providers: [MoodleClientService, MoodleSyncService, MoodleEnrolWorker],
  exports: [MoodleSyncService],
})
export class MoodleModule {}
