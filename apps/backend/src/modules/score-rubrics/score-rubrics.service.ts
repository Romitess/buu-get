import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ScoreRubric } from './entities/score-rubric.entity';
import { ScoreRubricItem } from './entities/score-rubric-item.entity';
import {
  CreateScoreRubricDto,
  ScoreRubricItemResponseDto,
  ScoreRubricResponseDto,
  UpdateScoreRubricDto,
} from './dto/score-rubric.dto';
import { Exam } from '../exam/entities/exam.entity';

@Injectable()
export class ScoreRubricsService {
  constructor(
    @InjectRepository(ScoreRubric)
    private readonly rubricRepository: Repository<ScoreRubric>,
    @InjectRepository(ScoreRubricItem)
    private readonly rubricItemRepository: Repository<ScoreRubricItem>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    private readonly dataSource: DataSource,
  ) {}

  private mapItem(item: ScoreRubricItem): ScoreRubricItemResponseDto {
    return {
      id: item.SRBI_ID,
      nameTh: item.SRBI_NAME_TH,
      nameEn: item.SRBI_NAME_EN,
      code: item.SRBI_CODE,
      maxScore: Number(item.SRBI_MAX_SCORE),
      sortOrder: item.SRBI_SORT_ORDER,
    };
  }

  private mapRubric(rubric: ScoreRubric): ScoreRubricResponseDto {
    const items = (rubric.ITEMS ?? [])
      .filter((item) => !item.DELETED_AT)
      .sort((a, b) => a.SRBI_SORT_ORDER - b.SRBI_SORT_ORDER)
      .map((item) => this.mapItem(item));

    return {
      id: rubric.SRB_ID,
      nameTh: rubric.SRB_NAME_TH,
      nameEn: rubric.SRB_NAME_EN,
      isDefault: rubric.SRB_IS_DEFAULT,
      items,
    };
  }

  async findAll(): Promise<ScoreRubricResponseDto[]> {
    const rubrics = await this.rubricRepository.find({
      relations: ['ITEMS'],
      order: { SRB_ID: 'ASC' },
    });
    return rubrics.map((rubric) => this.mapRubric(rubric));
  }

  async findOne(id: number): Promise<ScoreRubricResponseDto> {
    const rubric = await this.rubricRepository.findOne({
      where: { SRB_ID: id },
      relations: ['ITEMS'],
    });
    if (!rubric) {
      throw new NotFoundException(`ScoreRubric with ID ${id} not found`);
    }
    return this.mapRubric(rubric);
  }

  async findOneWithItems(id: number): Promise<ScoreRubric> {
    const rubric = await this.rubricRepository.findOne({
      where: { SRB_ID: id },
      relations: ['ITEMS'],
    });
    if (!rubric) {
      throw new NotFoundException(`ScoreRubric with ID ${id} not found`);
    }
    return rubric;
  }

  async create(dto: CreateScoreRubricDto): Promise<ScoreRubricResponseDto> {
    return this.dataSource.transaction(async (manager) => {
      const rubric = manager.create(ScoreRubric, {
        SRB_NAME_TH: dto.nameTh,
        SRB_NAME_EN: dto.nameEn,
        SRB_IS_DEFAULT: false,
      });
      const savedRubric = await manager.save(rubric);

      const items = dto.items.map((item) =>
        manager.create(ScoreRubricItem, {
          SRB_ID: savedRubric.SRB_ID,
          SRBI_NAME_TH: item.nameTh,
          SRBI_NAME_EN: item.nameEn,
          SRBI_CODE: item.code ?? null,
          SRBI_MAX_SCORE: item.maxScore ?? 50,
          SRBI_SORT_ORDER: item.sortOrder,
        }),
      );
      await manager.save(items);

      const reloaded = await manager.findOne(ScoreRubric, {
        where: { SRB_ID: savedRubric.SRB_ID },
        relations: ['ITEMS'],
      });
      if (!reloaded) {
        throw new NotFoundException('ScoreRubric not found after create');
      }
      return this.mapRubric(reloaded);
    });
  }

  async update(
    id: number,
    dto: UpdateScoreRubricDto,
  ): Promise<ScoreRubricResponseDto> {
    const rubric = await this.findOneWithItems(id);
    if (rubric.SRB_IS_DEFAULT && dto.items) {
      throw new BadRequestException(
        'ไม่สามารถแก้ไขรายการของชุดเกณฑ์เริ่มต้นได้',
      );
    }

    const usedByExamWithScores = await this.examRepository
      .createQueryBuilder('exam')
      .innerJoin('exam.SESSIONS', 'session')
      .innerJoin('session.ENROLLMENTS', 'enrollment')
      .innerJoin('enrollment.SCORE', 'score')
      .where('exam.SRB_ID = :rubricId', { rubricId: id })
      .andWhere('score.DELETED_AT IS NULL')
      .getCount();

    if (usedByExamWithScores > 0 && dto.items) {
      throw new ConflictException(
        'ไม่สามารถแก้ไขรายการในชุดเกณฑ์ที่ถูกใช้กับคะแนนที่บันทึกแล้ว',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.nameTh !== undefined) rubric.SRB_NAME_TH = dto.nameTh;
      if (dto.nameEn !== undefined) rubric.SRB_NAME_EN = dto.nameEn;
      await manager.save(rubric);

      if (dto.items) {
        await manager.softDelete(ScoreRubricItem, { SRB_ID: id });
        const items = dto.items.map((item) =>
          manager.create(ScoreRubricItem, {
            SRB_ID: id,
            SRBI_NAME_TH: item.nameTh,
            SRBI_NAME_EN: item.nameEn,
            SRBI_CODE: item.code ?? null,
            SRBI_MAX_SCORE: item.maxScore ?? 50,
            SRBI_SORT_ORDER: item.sortOrder,
          }),
        );
        await manager.save(items);
      }

      const reloaded = await manager.findOne(ScoreRubric, {
        where: { SRB_ID: id },
        relations: ['ITEMS'],
      });
      if (!reloaded) {
        throw new NotFoundException(`ScoreRubric with ID ${id} not found`);
      }
      return this.mapRubric(reloaded);
    });
  }

  async remove(id: number): Promise<void> {
    const rubric = await this.findOneWithItems(id);
    if (rubric.SRB_IS_DEFAULT) {
      throw new BadRequestException('ไม่สามารถลบชุดเกณฑ์เริ่มต้นได้');
    }

    const examCount = await this.examRepository.count({
      where: { SRB_ID: id },
    });
    if (examCount > 0) {
      throw new ConflictException('ไม่สามารถลบชุดเกณฑ์ที่ถูกใช้กับรอบสอบแล้ว');
    }

    await this.rubricRepository.softRemove(rubric);
  }

  async assertRubricUsable(rubricId: number): Promise<ScoreRubric> {
    const rubric = await this.findOneWithItems(rubricId);
    const activeItems = (rubric.ITEMS ?? []).filter((item) => !item.DELETED_AT);
    if (activeItems.length === 0) {
      throw new BadRequestException('ชุดเกณฑ์คะแนนต้องมีอย่างน้อย 1 รายการ');
    }
    return rubric;
  }
}
