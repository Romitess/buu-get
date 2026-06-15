import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamScore } from './entities/exam-score.entity';
import { CreateExamScoreDto } from './dto/create-exam-score.dto';
import { UpdateExamScoreDto } from './dto/update-exam-score.dto';

@Injectable()
export class ExamScoresService {
  constructor(
    @InjectRepository(ExamScore)
    private readonly examScoreRepository: Repository<ExamScore>,
  ) {}

  async create(createExamScoreDto: CreateExamScoreDto): Promise<ExamScore> {
    const newScore = this.examScoreRepository.create(createExamScoreDto);
    return await this.examScoreRepository.save(newScore);
  }

  async findAll(): Promise<ExamScore[]> {
    return await this.examScoreRepository.find({
      relations: ['ENROLLMENT', 'CERTIFICATES'],
    });
  }

  async findOne(id: number): Promise<ExamScore> {
    const score = await this.examScoreRepository.findOne({
      where: { SCORES_ID: id },
      relations: ['ENROLLMENT', 'CERTIFICATES'],
    });
    if (!score) {
      throw new NotFoundException(`ExamScore with ID ${id} not found`);
    }
    return score;
  }

  async update(
    id: number,
    updateExamScoreDto: UpdateExamScoreDto,
  ): Promise<ExamScore> {
    const score = await this.findOne(id);
    Object.assign(score, updateExamScoreDto);
    return await this.examScoreRepository.save(score);
  }

  async remove(id: number): Promise<void> {
    const score = await this.findOne(id);
    await this.examScoreRepository.softRemove(score);
  }
}
