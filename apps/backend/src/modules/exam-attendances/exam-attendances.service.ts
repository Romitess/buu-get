import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamAttendance } from './entities/exam-attendance.entity';
import { CreateExamAttendanceDto } from './dto/create-exam-attendance.dto';
import { UpdateExamAttendanceDto } from './dto/update-exam-attendance.dto';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';

@Injectable()
export class ExamAttendancesService {
  constructor(
    @InjectRepository(ExamAttendance)
    private readonly examAttendanceRepository: Repository<ExamAttendance>,
    @InjectRepository(ExamEnrollment)
    private readonly examEnrollmentRepository: Repository<ExamEnrollment>,
  ) {}

  async create(
    createExamAttendanceDto: CreateExamAttendanceDto,
  ): Promise<ExamAttendance> {
    // ถ้าไม่ได้ส่งเวลามา ให้ใช้เวลาปัจจุบัน
    if (!createExamAttendanceDto.ATTEND_CHECK_IN_TIME) {
      createExamAttendanceDto.ATTEND_CHECK_IN_TIME = new Date();
    }

    const attendance = this.examAttendanceRepository.create(
      createExamAttendanceDto,
    );
    const saved = await this.examAttendanceRepository.save(attendance);

    if (Number(saved.ATTEND_STATUS) === 1) {
      await this.examEnrollmentRepository.update(saved.ERM_ID, {
        ERM_STATUS: ExamEnrollmentStatus.ATTENDED,
      });
    }

    return saved;
  }

  async findAll(): Promise<ExamAttendance[]> {
    return await this.examAttendanceRepository.find({
      relations: ['ENROLLMENT'],
    });
  }

  async findOne(id: number): Promise<ExamAttendance> {
    const attendance = await this.examAttendanceRepository.findOne({
      where: { ATTEND_ID: id },
      relations: ['ENROLLMENT'],
    });

    if (!attendance) {
      throw new NotFoundException(`Exam Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  async update(
    id: number,
    updateExamAttendanceDto: UpdateExamAttendanceDto,
  ): Promise<ExamAttendance> {
    const attendance = await this.findOne(id);
    const updated = this.examAttendanceRepository.merge(
      attendance,
      updateExamAttendanceDto,
    );
    const saved = await this.examAttendanceRepository.save(updated);

    if (Number(saved.ATTEND_STATUS) === 1) {
      await this.examEnrollmentRepository.update(saved.ERM_ID, {
        ERM_STATUS: ExamEnrollmentStatus.ATTENDED,
      });
    }

    return saved;
  }

  async remove(id: number): Promise<void> {
    const attendance = await this.findOne(id);
    await this.examAttendanceRepository.softRemove(attendance);
  }
}
