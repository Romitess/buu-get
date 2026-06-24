import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { Exam } from './entities/exam.entity';
import { ExamPasscode } from './entities/exam-passcode.entity';
import { ExamPasscodeLog } from './entities/exam-passcode-log.entity';
import { MoodleModule } from '../moodle/moodle.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamPasscode, ExamPasscodeLog]),
    MoodleModule,
  ],
  controllers: [ExamController],
  providers: [ExamService],
  exports: [ExamService],
})
export class ExamModule {}
