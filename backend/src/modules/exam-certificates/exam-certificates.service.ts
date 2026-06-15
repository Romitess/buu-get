import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamCertificate } from './entities/exam-certificate.entity';
import { CreateExamCertificateDto } from './dto/create-exam-certificate.dto';
import { UpdateExamCertificateDto } from './dto/update-exam-certificate.dto';

@Injectable()
export class ExamCertificatesService {
  constructor(
    @InjectRepository(ExamCertificate)
    private readonly examCertificateRepository: Repository<ExamCertificate>,
  ) {}

  async create(
    createExamCertificateDto: CreateExamCertificateDto,
  ): Promise<ExamCertificate> {
    const newCertificate = this.examCertificateRepository.create(
      createExamCertificateDto,
    );
    return await this.examCertificateRepository.save(newCertificate);
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
