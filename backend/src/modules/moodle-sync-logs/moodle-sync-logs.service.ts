import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MoodleSyncLog } from './entities/moodle-sync-log.entity';
import { CreateMoodleSyncLogDto } from './dto/create-moodle-sync-log.dto';

@Injectable()
export class MoodleSyncLogsService {
  constructor(
    @InjectRepository(MoodleSyncLog)
    private readonly moodleSyncLogsRepository: Repository<MoodleSyncLog>,
  ) {}

  async create(
    createMoodleSyncLogDto: CreateMoodleSyncLogDto,
  ): Promise<MoodleSyncLog> {
    const moodleSyncLog = this.moodleSyncLogsRepository.create(
      createMoodleSyncLogDto,
    );
    return this.moodleSyncLogsRepository.save(moodleSyncLog);
  }
}
