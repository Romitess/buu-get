import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { ExamScore } from './entities/exam-score.entity';
import { ExamScoreLine } from './entities/exam-score-line.entity';
import { CreateExamScoreDto } from './dto/create-exam-score.dto';
import { ExamScoreQueryDto } from './dto/exam-score-query.dto';
import { UpdateExamScoreDto } from './dto/update-exam-score.dto';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { ScoreRubricItem } from '../score-rubrics/entities/score-rubric-item.entity';
import { SCORE_RUBRIC_ITEM_CODE } from '../score-rubrics/constants/score-rubric-codes';
import { ScoreCriteriaService } from '../score-criteria/score-criteria.service';

interface ResolvedRubricContext {
  rubricItems: ScoreRubricItem[];
  examSrbId: number;
}

interface ScoreLinesPayload {
  lines: CreateExamScoreDto['lines'];
}

@Injectable()
export class ExamScoresService {
  constructor(
    @InjectRepository(ExamScore)
    private readonly examScoreRepository: Repository<ExamScore>,
    @InjectRepository(ExamScoreLine)
    private readonly examScoreLineRepository: Repository<ExamScoreLine>,
    @InjectRepository(ExamEnrollment)
    private readonly enrollmentRepository: Repository<ExamEnrollment>,
    private readonly dataSource: DataSource,
    private readonly scoreCriteriaService: ScoreCriteriaService,
  ) {}

  private async resolveRubricForEnrollment(
    ermId: number,
  ): Promise<ResolvedRubricContext> {
    const enrollment = await this.enrollmentRepository.findOne({
      where: { ERM_ID: ermId },
      relations: [
        'SESSION',
        'SESSION.EXAM',
        'SESSION.EXAM.SCORE_RUBRIC',
        'SESSION.EXAM.SCORE_RUBRIC.ITEMS',
      ],
    });

    if (!enrollment?.SESSION?.EXAM) {
      throw new NotFoundException(`Enrollment ${ermId} not found`);
    }

    const exam = enrollment.SESSION.EXAM;
    if (!exam.SRB_ID || !exam.SCORE_RUBRIC) {
      throw new BadRequestException('รอบสอบนี้ยังไม่ได้กำหนดชุดเกณฑ์คะแนน');
    }

    const rubricItems = (exam.SCORE_RUBRIC.ITEMS ?? [])
      .filter((item) => !item.DELETED_AT)
      .sort((a, b) => a.SRBI_SORT_ORDER - b.SRBI_SORT_ORDER);

    if (rubricItems.length === 0) {
      throw new BadRequestException('ชุดเกณฑ์คะแนนของรอบสอบไม่มีรายการ');
    }

    return { rubricItems, examSrbId: exam.SRB_ID };
  }

  private validateLinesAgainstRubric(
    lines: CreateExamScoreDto['lines'],
    rubricItems: ScoreRubricItem[],
  ): void {
    const rubricItemIds = new Set(rubricItems.map((item) => item.SRBI_ID));
    const inputIds = new Set(lines.map((line) => line.SRBI_ID));

    if (inputIds.size !== lines.length) {
      throw new BadRequestException('พบรายการคะแนนซ้ำใน payload');
    }

    for (const item of rubricItems) {
      if (!inputIds.has(item.SRBI_ID)) {
        throw new BadRequestException(
          `ต้องระบุคะแนนสำหรับ "${item.SRBI_NAME_TH}"`,
        );
      }
    }

    for (const line of lines) {
      if (!rubricItemIds.has(line.SRBI_ID)) {
        throw new BadRequestException(
          `รายการคะแนน SRBI_ID=${line.SRBI_ID} ไม่อยู่ในชุดเกณฑ์ของรอบสอบ`,
        );
      }
      const item = rubricItems.find((r) => r.SRBI_ID === line.SRBI_ID);
      if (item && line.score > Number(item.SRBI_MAX_SCORE)) {
        throw new BadRequestException(
          `คะแนน "${item.SRBI_NAME_TH}" เกินคะแนนเต็ม (${item.SRBI_MAX_SCORE})`,
        );
      }
      if (line.score < 0) {
        throw new BadRequestException('คะแนนต้องไม่ต่ำกว่า 0');
      }
    }
  }

  private applyLegacyColumns(
    score: ExamScore,
    lines: CreateExamScoreDto['lines'],
    rubricItems: ScoreRubricItem[],
  ): void {
    const lineByItemId = new Map(
      lines.map((line) => [line.SRBI_ID, line.score]),
    );

    for (const item of rubricItems) {
      const value = lineByItemId.get(item.SRBI_ID);
      if (value === undefined) continue;

      if (item.SRBI_CODE === SCORE_RUBRIC_ITEM_CODE.LANG_USE) {
        score.SC_LANG_USE_SCORE = value;
      }
      if (item.SRBI_CODE === SCORE_RUBRIC_ITEM_CODE.READING) {
        score.SC_READING_SCORE = value;
      }
    }

    score.SC_TOTAL_SCORE = lines.reduce((sum, line) => sum + line.score, 0);
  }

  private buildLineEntities(
    scoresId: number,
    lines: CreateExamScoreDto['lines'],
    rubricItems: ScoreRubricItem[],
  ): ExamScoreLine[] {
    const itemById = new Map(rubricItems.map((item) => [item.SRBI_ID, item]));

    return lines.map((line) => {
      const item = itemById.get(line.SRBI_ID);
      if (!item) {
        throw new BadRequestException(
          `ไม่พบรายการเกณฑ์ SRBI_ID=${line.SRBI_ID}`,
        );
      }

      return this.examScoreLineRepository.create({
        SCORES_ID: scoresId,
        SRBI_ID: item.SRBI_ID,
        SCL_NAME_TH: item.SRBI_NAME_TH,
        SCL_NAME_EN: item.SRBI_NAME_EN,
        SCL_MAX_SCORE: item.SRBI_MAX_SCORE,
        SCL_SORT_ORDER: item.SRBI_SORT_ORDER,
        SCL_SCORE: line.score,
      });
    });
  }

  private async persistScoreWithLines(
    score: ExamScore,
    dto: ScoreLinesPayload,
    rubricItems: ScoreRubricItem[],
  ): Promise<ExamScore> {
    return this.dataSource.transaction(async (manager) => {
      this.applyLegacyColumns(score, dto.lines, rubricItems);
      score.SC_BAND_LEVEL = await this.scoreCriteriaService.resolveBandLevel(
        Number(score.SC_TOTAL_SCORE ?? 0),
      );

      const savedScore = await manager.save(ExamScore, score);

      await manager.delete(ExamScoreLine, { SCORES_ID: savedScore.SCORES_ID });
      const lineEntities = this.buildLineEntities(
        savedScore.SCORES_ID,
        dto.lines,
        rubricItems,
      );
      await manager.save(ExamScoreLine, lineEntities);

      const reloaded = await manager.findOne(ExamScore, {
        where: { SCORES_ID: savedScore.SCORES_ID },
        relations: ['ENROLLMENT', 'CERTIFICATES', 'LINES'],
      });
      if (!reloaded) {
        throw new NotFoundException('ExamScore not found after save');
      }
      return reloaded;
    });
  }

  /**
   * Upsert by ERM_ID — enrollment มีคะแนนได้แค่ 1 แถว (OneToOne unique).
   */
  async create(createExamScoreDto: CreateExamScoreDto): Promise<ExamScore> {
    const { rubricItems } = await this.resolveRubricForEnrollment(
      createExamScoreDto.ERM_ID,
    );
    this.validateLinesAgainstRubric(createExamScoreDto.lines, rubricItems);

    const existing = await this.examScoreRepository.findOne({
      where: { ERM_ID: createExamScoreDto.ERM_ID },
      withDeleted: true,
    });

    if (existing) {
      if (existing.DELETED_AT) {
        existing.DELETED_AT = null;
      }
      existing.ERM_ID = createExamScoreDto.ERM_ID;
      return this.persistScoreWithLines(
        existing,
        createExamScoreDto,
        rubricItems,
      );
    }

    const newScore = this.examScoreRepository.create({
      ERM_ID: createExamScoreDto.ERM_ID,
    });
    return this.persistScoreWithLines(
      newScore,
      createExamScoreDto,
      rubricItems,
    );
  }

  async findAll(
    query: ExamScoreQueryDto = {},
  ): Promise<PaginatedResponse<ExamScore>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;

    const qb = this.examScoreRepository
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.ENROLLMENT', 'enrollment')
      .leftJoinAndSelect('score.CERTIFICATES', 'certificates')
      .leftJoinAndSelect('score.LINES', 'lines')
      .where('score.DELETED_AT IS NULL')
      .orderBy('score.SCORES_ID', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.examId != null || query.sessionId != null) {
      qb.innerJoin('enrollment.SESSION', 'session');
      if (query.examId != null) {
        qb.andWhere('session.EXAM_ID = :examId', { examId: query.examId });
      }
      if (query.sessionId != null) {
        qb.andWhere('enrollment.SESSION_ID = :sessionId', {
          sessionId: query.sessionId,
        });
      }
    }

    const [data, total] = await qb.getManyAndCount();
    return buildPaginatedResponse(data, total, page, limit);
  }

  async findOne(id: number): Promise<ExamScore> {
    const score = await this.examScoreRepository.findOne({
      where: { SCORES_ID: id },
      relations: ['ENROLLMENT', 'CERTIFICATES', 'LINES'],
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

    if (!updateExamScoreDto.lines || updateExamScoreDto.lines.length === 0) {
      Object.assign(score, updateExamScoreDto);
      return await this.examScoreRepository.save(score);
    }

    const { rubricItems } = await this.resolveRubricForEnrollment(score.ERM_ID);
    this.validateLinesAgainstRubric(updateExamScoreDto.lines, rubricItems);

    return this.persistScoreWithLines(
      score,
      { lines: updateExamScoreDto.lines },
      rubricItems,
    );
  }

  async remove(id: number): Promise<void> {
    const score = await this.findOne(id);
    await this.examScoreRepository.softRemove(score);
  }

  /** ตรวจว่า exam มีคะแนนที่บันทึกแล้วหรือไม่ */
  async examHasSavedScores(examId: number): Promise<boolean> {
    const count = await this.examScoreRepository
      .createQueryBuilder('score')
      .innerJoin('score.ENROLLMENT', 'enrollment')
      .innerJoin('enrollment.SESSION', 'session')
      .where('session.EXAM_ID = :examId', { examId })
      .andWhere('score.DELETED_AT IS NULL')
      .getCount();
    return count > 0;
  }
}
