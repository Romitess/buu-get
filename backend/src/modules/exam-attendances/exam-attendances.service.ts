import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamAttendance } from './entities/exam-attendance.entity';
import { CreateExamAttendanceDto } from './dto/create-exam-attendance.dto';
import { UpdateExamAttendanceDto } from './dto/update-exam-attendance.dto';

@Injectable()
export class ExamAttendancesService {
  constructor(
    @InjectRepository(ExamAttendance)
    private readonly examAttendanceRepository: Repository<ExamAttendance>,
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
    return await this.examAttendanceRepository.save(attendance);
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
    return await this.examAttendanceRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const attendance = await this.findOne(id);
    await this.examAttendanceRepository.softRemove(attendance);
  }
}
