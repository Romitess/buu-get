import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MoodleSyncLogsService } from './moodle-sync-logs.service';
import { CreateMoodleSyncLogDto } from './dto/create-moodle-sync-log.dto';
import { MoodleSyncLog } from './entities/moodle-sync-log.entity';

@ApiTags('Moodle Sync Logs')
@Controller('moodle-sync-logs')
export class MoodleSyncLogsController {
  constructor(private readonly moodleSyncLogsService: MoodleSyncLogsService) {}

  @Post()
  @ApiOperation({ summary: 'สร้างล็อกการซิงก์ข้อมูล Moodle' })
  @ApiResponse({
    status: 201,
    description: 'สร้างล็อกการซิงก์ข้อมูลสำเร็จ',
    type: MoodleSyncLog,
  })
  create(
    @Body() createMoodleSyncLogDto: CreateMoodleSyncLogDto,
  ): Promise<MoodleSyncLog> {
    return this.moodleSyncLogsService.create(createMoodleSyncLogDto);
  }
}
