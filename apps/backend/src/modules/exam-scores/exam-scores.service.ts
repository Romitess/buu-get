import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PaginationQueryDto,
} from 'src/common/dto/pagination-query.dto';
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

  async findAll(
    query: PaginationQueryDto = {},
  ): Promise<PaginatedResponse<ExamScore>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const [data, total] = await this.examScoreRepository.findAndCount({
      relations: ['ENROLLMENT', 'CERTIFICATES'],
      skip: (page - 1) * limit,
      take: limit,
      order: { SCORES_ID: 'DESC' },
    });
    return buildPaginatedResponse(data, total, page, limit);
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
