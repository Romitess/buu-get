import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { MoodleSyncLog } from './entities/moodle-sync-log.entity';
import { CreateMoodleSyncLogDto } from './dto/create-moodle-sync-log.dto';

@Injectable()
export class MoodleSyncLogsService {
  constructor(
    @InjectRepository(MoodleSyncLog)
    private readonly moodleSyncLogsRepository: Repository<MoodleSyncLog>,
  ) {}

  /**
   * @param manager (optional) ถ้าส่งมา จะเขียน log ภายใต้ transaction เดียวกัน
   * (ใช้ตอน register ที่ user ยังไม่ commit — FK USER_ID ต้องอยู่ tx เดียวกัน)
   */
  async create(
    createMoodleSyncLogDto: CreateMoodleSyncLogDto,
    manager?: EntityManager,
  ): Promise<MoodleSyncLog> {
    const repo = manager
      ? manager.getRepository(MoodleSyncLog)
      : this.moodleSyncLogsRepository;
    return repo.save(repo.create(createMoodleSyncLogDto));
  }
}
