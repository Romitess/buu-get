import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamSession } from './entities/exam-session.entity';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';

@Injectable()
export class ExamSessionsService {
  constructor(
    @InjectRepository(ExamSession)
    private readonly examSessionRepository: Repository<ExamSession>,
  ) {}

  async create(
    createExamSessionDto: CreateExamSessionDto,
  ): Promise<ExamSession> {
    const session = this.examSessionRepository.create(createExamSessionDto);
    const saved = await this.examSessionRepository.save(session);
    return await this.findOne(saved.SS_ID);
  }

  async findAll(): Promise<ExamSession[]> {
    return await this.examSessionRepository.find({
      relations: [
        'EXAM',
        'SESSION_LOCATIONS',
        'SESSION_LOCATIONS.LOCATION',
        'SESSION_LOCATIONS.LOCATION.SEATS',
      ],
    });
  }

  async findOne(id: number): Promise<ExamSession> {
    const session = await this.examSessionRepository.findOne({
      where: { SS_ID: id },
      relations: [
        'EXAM',
        'SESSION_LOCATIONS',
        'SESSION_LOCATIONS.LOCATION',
        'SESSION_LOCATIONS.LOCATION.SEATS',
      ],
    });

    if (!session) {
      throw new NotFoundException(`Exam Session with ID ${id} not found`);
    }

    return session;
  }

  /**
   * โหลด session สำหรับ update/softRemove โดยไม่ดึง LOCATION.SEATS
   * (seats กราฟใหญ่ — ไม่จำเป็นตอน mutate metadata ของ session)
   */
  private async findOneForMutation(id: number): Promise<ExamSession> {
    const session = await this.examSessionRepository.findOne({
      where: { SS_ID: id },
      relations: ['EXAM', 'SESSION_LOCATIONS', 'SESSION_LOCATIONS.LOCATION'],
    });

    if (!session) {
      throw new NotFoundException(`Exam Session with ID ${id} not found`);
    }

    return session;
  }

  async update(
    id: number,
    updateExamSessionDto: UpdateExamSessionDto,
  ): Promise<ExamSession> {
    const session = await this.findOneForMutation(id);
    this.examSessionRepository.merge(session, updateExamSessionDto);
    const saved = await this.examSessionRepository.save(session);
    return await this.findOneForMutation(saved.SS_ID);
  }

  async remove(id: number): Promise<void> {
    const session = await this.findOneForMutation(id);
    await this.examSessionRepository.softRemove(session);
  }
}
