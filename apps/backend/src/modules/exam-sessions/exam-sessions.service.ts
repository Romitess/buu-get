import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { MemberSessionCodesService } from 'src/common/services/member-session-codes.service';
import { Exam } from '../exam/entities/exam.entity';
import { ExamSession } from './entities/exam-session.entity';
import { CreateExamSessionDto } from './dto/create-exam-session.dto';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto';

@Injectable()
export class ExamSessionsService {
  constructor(
    @InjectRepository(ExamSession)
    private readonly examSessionRepository: Repository<ExamSession>,
    private readonly dataSource: DataSource,
    private readonly memberSessionCodesService: MemberSessionCodesService,
  ) {}

  async create(
    createExamSessionDto: CreateExamSessionDto,
  ): Promise<ExamSession> {
    // Allocate + persist inside the transaction, then hydrate AFTER commit.
    // Calling this.findOne() while the txn is still open uses a separate
    // connection that cannot see the uncommitted row (MySQL REPEATABLE READ)
    // → 404 "Exam Session with ID N not found" on every create.
    const ssId = await this.dataSource.transaction(async (manager) => {
      const exam = await manager.getRepository(Exam).findOne({
        where: { EXAM_ID: createExamSessionDto.EXAM_ID },
      });
      if (!exam) {
        throw new NotFoundException(
          `Exam with ID ${createExamSessionDto.EXAM_ID} not found`,
        );
      }

      const session = manager
        .getRepository(ExamSession)
        .create(createExamSessionDto);
      const saved = await manager.getRepository(ExamSession).save(session);

      const sessionCode =
        await this.memberSessionCodesService.allocateSessionCode(manager, {
          examType: exam.EXAM_TYPE,
          examFiscalYear: exam.EXAM_FISCAL_YEAR,
          at: saved.CREATED_AT ?? new Date(),
        });
      await manager
        .getRepository(ExamSession)
        .update({ SS_ID: saved.SS_ID }, { SESSION_CODE: sessionCode });

      return saved.SS_ID;
    });

    return this.findOne(ssId);
  }

  async findAll(): Promise<ExamSession[]> {
    // ไม่โหลด LOCATION.SEATS บน list — seat grid เป็น one-to-many ใหญ่
    // (O(sessions × rooms × seats)); ใช้ findOne / seat endpoints เมื่อต้องการแผนผังที่นั่ง
    return await this.examSessionRepository.find({
      relations: ['EXAM', 'SESSION_LOCATIONS', 'SESSION_LOCATIONS.LOCATION'],
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
