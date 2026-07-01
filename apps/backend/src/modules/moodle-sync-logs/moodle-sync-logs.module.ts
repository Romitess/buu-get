import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoodleSyncLogsService } from './moodle-sync-logs.service';
import { MoodleSyncLogsController } from './moodle-sync-logs.controller';
import { MoodleSyncLog } from './entities/moodle-sync-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MoodleSyncLog])],
  controllers: [MoodleSyncLogsController],
  providers: [MoodleSyncLogsService],
  exports: [MoodleSyncLogsService],
})
export class MoodleSyncLogsModule {}
