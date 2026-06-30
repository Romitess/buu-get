import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamCertificate } from './entities/exam-certificate.entity';
import { CreateExamCertificateDto } from './dto/create-exam-certificate.dto';
import { UpdateExamCertificateDto } from './dto/update-exam-certificate.dto';
import { ExamScore } from '../exam-scores/entities/exam-score.entity';
import {
  ExamSession,
  ExamSessionStatus,
} from '../exam-sessions/entities/exam-session.entity';

@Injectable()
export class ExamCertificatesService {
  constructor(
    @InjectRepository(ExamCertificate)
    private readonly examCertificateRepository: Repository<ExamCertificate>,
    @InjectRepository(ExamScore)
    private readonly examScoreRepository: Repository<ExamScore>,
    @InjectRepository(ExamSession)
    private readonly examSessionRepository: Repository<ExamSession>,
  ) {}

  async create(
    createExamCertificateDto: CreateExamCertificateDto,
  ): Promise<ExamCertificate> {
    const newCertificate = this.examCertificateRepository.create(
      createExamCertificateDto,
    );
    const saved = await this.examCertificateRepository.save(newCertificate);

    // Find the exam score to get the session ID
    const score = await this.examScoreRepository.findOne({
      where: { SCORES_ID: createExamCertificateDto.SCORES_ID },
      relations: ['ENROLLMENT'],
    });

    if (score?.ENROLLMENT?.SESSION_ID) {
      await this.examSessionRepository.update(score.ENROLLMENT.SESSION_ID, {
        SS_SESSION_STATUS: ExamSessionStatus.COMPLETED,
      });
    }

    return saved;
  }

  async findAll(): Promise<ExamCertificate[]> {
    return await this.examCertificateRepository.find({
      relations: ['SCORE', 'USER'],
    });
  }

  async findOne(id: number): Promise<ExamCertificate> {
    const certificate = await this.examCertificateRepository.findOne({
      where: { CERT_ID: id },
      relations: ['SCORE', 'USER'],
    });
    if (!certificate) {
      throw new NotFoundException(`ExamCertificate with ID ${id} not found`);
    }
    return certificate;
  }

  async update(
    id: number,
    updateExamCertificateDto: UpdateExamCertificateDto,
  ): Promise<ExamCertificate> {
    const certificate = await this.findOne(id);
    Object.assign(certificate, updateExamCertificateDto);
    return await this.examCertificateRepository.save(certificate);
  }

  async remove(id: number): Promise<void> {
    const certificate = await this.findOne(id);
    await this.examCertificateRepository.softRemove(certificate);
  }
}
