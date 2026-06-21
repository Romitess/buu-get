import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { ExamPasscode } from './entities/exam-passcode.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { CreatePasscodesDto } from './dto/create-passcodes.dto';
import { ExamPasscodeLog } from './entities/exam-passcode-log.entity';
import { PasscodeLogResponseDto } from './dto/passcode-log-response.dto';
@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamPasscode)
    private readonly examPasscodeRepository: Repository<ExamPasscode>,
    @InjectRepository(ExamPasscodeLog)
    private readonly examPasscodeLogRepository: Repository<ExamPasscodeLog>,
  ) {}

  async create(createExamDto: CreateExamDto): Promise<Exam> {
    const exam = this.examRepository.create(createExamDto);
    return await this.examRepository.save(exam);
  }

  async findAll(): Promise<Exam[]> {
    return await this.examRepository.find({
      // โหลด relation แบบแยก query ต่อ relation แทน JOIN เดียว เพื่อเลี่ยง
      // cartesian product (ENROLLMENTS x SESSION_LOCATIONS) ที่ทำให้ query ช้ามาก
      relationLoadStrategy: 'query',
      order: {
        CREATED_AT: 'DESC',
      },
      relations: [
        'SESSIONS',
        'SESSIONS.ENROLLMENTS',
        'SESSIONS.SESSION_LOCATIONS',
        'SESSIONS.SESSION_LOCATIONS.LOCATION',
      ],
      select: {
        EXAM_ID: true,
        EXAM_NAME: true,
        EXAM_ROUND: true,
        EXAM_TYPE: true,
        EXAM_FORMAT: true,
        EXAM_FEE: true,
        EXAM_DATE: true,
        EXAM_REG_START_DATE: true,
        EXAM_REG_END_DATE: true,
        EXAM_PAY_START_DATE: true,
        EXAM_PAY_END_DATE: true,
        EXAM_PUBLISHED: true,
        EXAM_MOODLE_COURSE_ID: true,
        CREATED_AT: true,
        UPDATED_AT: true,
        FUND_SOURCE_ID: true,
        SESSIONS: {
          SS_ID: true,
          EXAM_ID: true,
          SS_START_TIME: true,
          SS_END_TIME: true,
          SS_CAPACITY: true,
          SS_SESSION_STATUS: true,
          ENROLLMENTS: {
            ERM_ID: true,
            SESSION_ID: true,
            SL_ID: true,
            ERM_STATUS: true,
          },
          SESSION_LOCATIONS: {
            SL_ID: true,
            LOCATION_ID: true,
            SS_ID: true,
            SS_NAME: true,
            LOCATION: {
              LOCATION_ID: true,
              LOCATION_NAME: true,
              LOCATION_ROOM_NO: true,
              LOCATION_SEAT_CAPACITY: true,
            },
          },
        },
      },
    });
  }

  async findOne(id: number): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { EXAM_ID: id },
      // โหลด relation แบบแยก query ต่อ relation แทน JOIN เดียว เพื่อเลี่ยง
      // cartesian product (ENROLLMENTS x SEATS x SESSION_LOCATIONS) ที่ทำให้
      // endpoint /exam/:id ช้ามาก (วัดได้ ~131s บนรอบสอบใหญ่)
      relationLoadStrategy: 'query',
      relations: [
        'SESSIONS',
        'SESSIONS.SESSION_LOCATIONS',
        'SESSIONS.SESSION_LOCATIONS.LOCATION',
        'SESSIONS.SESSION_LOCATIONS.LOCATION.SEATS',
        'SESSIONS.ENROLLMENTS',
        'FUND_SOURCE',
        'PASSCODES',
      ],
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return exam;
  }

  //การบันทึกประวัติการใช้ log
  async logPasscodeUsage(
    examId: number,
    passcodeId: number,
    fullName: string,
    passcode: string,
  ): Promise<ExamPasscodeLog> {
    const log = this.examPasscodeLogRepository.create({
      EXAM_ID: examId,
      PASSCODE_ID: passcodeId,
      FULL_NAME: fullName,
      PASSCODE: passcode,
    });
    return await this.examPasscodeLogRepository.save(log);
  }

  //การดูประวัติการใช้ log
  async getPasscodeHistory(examId: number): Promise<PasscodeLogResponseDto[]> {
    const exam = await this.findOne(examId);
    if (!exam) {
      throw new NotFoundException(`Exam with ID ${examId} not found`);
    }

    const logs = await this.examPasscodeLogRepository.find({
      where: { EXAM_ID: examId },
      order: { USED_AT: 'DESC' },
    });

    return logs.map((log) => {
      const usedAt = new Date(log.USED_AT);
      return {
        logId: log.LOG_ID,
        fullName: log.FULL_NAME,
        passcode: log.PASSCODE,
        usedDate: usedAt.toISOString().split('T')[0] ?? '',
        usedTime: usedAt.toTimeString().split(' ')[0] ?? '',
      };
    });
  }

  async update(id: number, updateExamDto: UpdateExamDto): Promise<Exam> {
    const exam = await this.findOne(id);
    const updated = this.examRepository.merge(exam, updateExamDto);
    return await this.examRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const exam = await this.findOne(id);
    await this.examRepository.softRemove(exam);
  }

  async createPasscodes(
    examId: number,
    createPasscodesDto: CreatePasscodesDto,
  ): Promise<ExamPasscode[]> {
    const exam = await this.findOne(examId);

    // Delete existing passcodes for this exam to prevent duplicates if editing
    await this.examPasscodeRepository.delete({ EXAM_ID: examId });

    const passcodes = createPasscodesDto.passcodes.map((p) => {
      const nationalId = p.nationalId?.trim() || p.passportNo?.trim();
      const fullName = p.fullName?.trim() || p.fullNameEn?.trim();

      if (!nationalId || !fullName) {
        throw new BadRequestException(
          'Passcode item must include either nationalId or passportNo, and either fullName or fullNameEn.',
        );
      }

      return this.examPasscodeRepository.create({
        EXAM_ID: exam.EXAM_ID,
        NATIONAL_ID: nationalId,
        FULL_NAME: fullName,
        PASSCODE: p.passcode,
      });
    });

    return await this.examPasscodeRepository.save(passcodes);
  }
}
