import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { ExamReportService } from './exam-report.service';
import { ExamReportQueryDto } from './dto/exam-report-query.dto';
import { ExamReportRound } from './interfaces/exam-report.interface';

type MockQueryBuilder = {
  innerJoin: jest.Mock;
  leftJoin: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  select: jest.Mock;
  addSelect: jest.Mock;
  groupBy: jest.Mock;
  addGroupBy: jest.Mock;
  having: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  getRawMany: jest.Mock;
  getRawOne: jest.Mock;
};

type YearMetricRow = {
  year: string | number;
  registered: string | number;
  attended: string | number;
};

type YearAvgRow = {
  year: string | number;
  avgScore: string | number | null;
};

type YearBucketRow = {
  year: string | number;
  r40: string | number;
  r50: string | number;
  r60: string | number;
  r70: string | number;
  r80: string | number;
};

type YearMinMaxRow = {
  year: string | number;
  minScore: string | number | null;
  maxScore: string | number | null;
};

/** Private query helpers used by getSummary — typed spy target (no any). */
type SummaryQuerySurface = {
  getMetricByYear: (query: ExamReportQueryDto) => Promise<YearMetricRow[]>;
  getAvgScoreByYear: (query: ExamReportQueryDto) => Promise<YearAvgRow[]>;
  getScoreBucketByYear: (query: ExamReportQueryDto) => Promise<YearBucketRow[]>;
  getRounds: (query: ExamReportQueryDto) => Promise<ExamReportRound[]>;
  getScoreMinMaxByYear: (query: ExamReportQueryDto) => Promise<YearMinMaxRow[]>;
  getRepeatTakersByYear: (
    query: ExamReportQueryDto,
  ) => Promise<Map<number, number>>;
  getAttemptProportion: (
    query: ExamReportQueryDto,
  ) => Promise<{ firstTime: number; repeat: number }>;
};

const createQueryBuilderMock = (): MockQueryBuilder => {
  const qb: MockQueryBuilder = {
    innerJoin: jest.fn(),
    leftJoin: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    select: jest.fn(),
    addSelect: jest.fn(),
    groupBy: jest.fn(),
    addGroupBy: jest.fn(),
    having: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue(null),
  };
  qb.innerJoin.mockReturnValue(qb);
  qb.leftJoin.mockReturnValue(qb);
  qb.where.mockReturnValue(qb);
  qb.andWhere.mockReturnValue(qb);
  qb.select.mockReturnValue(qb);
  qb.addSelect.mockReturnValue(qb);
  qb.groupBy.mockReturnValue(qb);
  qb.addGroupBy.mockReturnValue(qb);
  qb.having.mockReturnValue(qb);
  qb.orderBy.mockReturnValue(qb);
  qb.addOrderBy.mockReturnValue(qb);
  return qb;
};

describe('ExamReportService', () => {
  let service: ExamReportService;
  let enrollmentQb: MockQueryBuilder;
  let dataSource: { getRepository: jest.Mock };

  const asQueries = (): SummaryQuerySurface =>
    service as unknown as SummaryQuerySurface;

  const stubSummaryQueries = (overrides: {
    metric?: YearMetricRow[];
    avg?: YearAvgRow[];
    bucket?: YearBucketRow[];
    rounds?: ExamReportRound[];
    minMax?: YearMinMaxRow[];
    repeatByYear?: Map<number, number>;
    attemptProportion?: { firstTime: number; repeat: number };
    /** When true, leave getRounds real so QB-driven round logic runs. */
    keepRealRounds?: boolean;
  }): void => {
    const q = asQueries();
    jest.spyOn(q, 'getMetricByYear').mockResolvedValue(overrides.metric ?? []);
    jest.spyOn(q, 'getAvgScoreByYear').mockResolvedValue(overrides.avg ?? []);
    jest
      .spyOn(q, 'getScoreBucketByYear')
      .mockResolvedValue(overrides.bucket ?? []);
    jest
      .spyOn(q, 'getScoreMinMaxByYear')
      .mockResolvedValue(overrides.minMax ?? []);
    jest
      .spyOn(q, 'getRepeatTakersByYear')
      .mockResolvedValue(overrides.repeatByYear ?? new Map());
    jest
      .spyOn(q, 'getAttemptProportion')
      .mockResolvedValue(
        overrides.attemptProportion ?? { firstTime: 0, repeat: 0 },
      );

    if (!overrides.keepRealRounds) {
      jest.spyOn(q, 'getRounds').mockResolvedValue(overrides.rounds ?? []);
    }
  };

  beforeEach(async () => {
    enrollmentQb = createQueryBuilderMock();
    dataSource = {
      getRepository: jest.fn().mockReturnValue({
        createQueryBuilder: jest.fn(() => enrollmentQb),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamReportService,
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(ExamReportService);
  });

  describe('getSummary', () => {
    it('should set changePercent to 0 when previous year value is 0 or missing (RPT-U-004)', async () => {
      // Arrange — target 2026 has data; 2025 missing/zero → changePercent 0
      stubSummaryQueries({
        metric: [{ year: 2026, registered: 10, attended: 8 }],
        avg: [{ year: 2026, avgScore: 65 }],
      });

      // Act
      const result = await service.getSummary({ toYear: '2026' });

      // Assert
      expect(result.stats.applicants.previousValue).toBe(0);
      expect(result.stats.applicants.changePercent).toBe(0);
      expect(result.stats.attended.changePercent).toBe(0);
      expect(result.stats.absent.changePercent).toBe(0);
      expect(result.stats.averageScore.changePercent).toBe(0);
    });

    it('should compute absent and attendance/absent rates from registered and attended (RPT-U-005)', async () => {
      // Arrange
      stubSummaryQueries({
        metric: [{ year: 2026, registered: 10, attended: 7 }],
        avg: [{ year: 2026, avgScore: 50 }],
      });

      // Act
      const result = await service.getSummary({ toYear: '2026' });

      // Assert
      expect(result.stats.applicants.value).toBe(10);
      expect(result.stats.attended.value).toBe(7);
      expect(result.stats.absent.value).toBe(3);
      expect(result.stats.attended.rate).toBe(70);
      expect(result.stats.absent.rate).toBe(30);
    });

    it('should null attended/absent for future rounds while keeping registered (RPT-U-006)', async () => {
      // Arrange — real getRounds; future exam date
      stubSummaryQueries({
        metric: [{ year: 2099, registered: 12, attended: 0 }],
        keepRealRounds: true,
      });
      enrollmentQb.getRawMany.mockResolvedValue([
        {
          round: '1',
          examDate: '2099-12-15',
          registered: 12,
          attended: 0,
        },
      ]);

      // Act
      const result = await service.getSummary({ toYear: '2099' });

      // Assert
      expect(result.rounds).toHaveLength(1);
      expect(result.rounds[0].registered).toBe(12);
      expect(result.rounds[0].attended).toBeNull();
      expect(result.rounds[0].absent).toBeNull();
    });

    it('should expose fixed score ranges starting at 40 and map bucket counts (RPT-U-007)', async () => {
      // Arrange — SQL buckets already exclude <40; response ranges must match SCORE_RANGES
      stubSummaryQueries({
        metric: [{ year: 2026, registered: 5, attended: 5 }],
        bucket: [
          {
            year: 2026,
            r40: 1,
            r50: 2,
            r60: 0,
            r70: 3,
            r80: 4,
          },
        ],
      });

      // Act
      const result = await service.getSummary({ toYear: '2026' });

      // Assert
      expect(result.scoreSummaryByYear.ranges).toEqual([
        '40-49',
        '50-59',
        '60-69',
        '70-79',
        '80-100',
      ]);
      expect(result.scoreSummaryByYear.rows).toEqual([
        { year: 2026, counts: [1, 2, 0, 3, 4] },
      ]);
    });

    it('should append /{year} to round labels without double suffix (RPT-U-008)', async () => {
      // Arrange — past dates so attended path runs; labels via formatRoundLabel
      stubSummaryQueries({
        metric: [{ year: 2026, registered: 4, attended: 4 }],
        keepRealRounds: true,
      });
      enrollmentQb.getRawMany.mockResolvedValue([
        {
          round: '1',
          examDate: '2026-06-01',
          registered: 2,
          attended: 2,
        },
        {
          round: '1/2026',
          examDate: '2026-07-01',
          registered: 2,
          attended: 1,
        },
      ]);

      // Act
      const result = await service.getSummary({ toYear: '2026' });

      // Assert
      expect(result.rounds[0].round).toBe('1/2026');
      expect(result.rounds[1].round).toBe('1/2026');
      expect(result.rounds.every((r) => !r.round.includes('1/2026/'))).toBe(
        true,
      );
    });

    it('should compute attemptProportion firstTime as total − repeat (RPT-U-009)', async () => {
      // Arrange — real getAttemptProportion; stub other private queries
      stubSummaryQueries({
        metric: [{ year: 2026, registered: 5, attended: 5 }],
      });
      jest.spyOn(asQueries(), 'getAttemptProportion').mockRestore();
      enrollmentQb.getRawOne.mockResolvedValue({ total: 5, repeat: 2 });

      // Act
      const result = await service.getSummary({ toYear: '2026' });

      // Assert
      expect(result.attemptProportion).toEqual({ firstTime: 3, repeat: 2 });
    });

    it('should key stats to toYear when set, else latest data year (RPT-U-010)', async () => {
      // Arrange
      const metric: YearMetricRow[] = [
        { year: 2024, registered: 20, attended: 18 },
        { year: 2025, registered: 30, attended: 25 },
      ];
      stubSummaryQueries({
        metric,
        avg: [
          { year: 2024, avgScore: 55 },
          { year: 2025, avgScore: 60 },
        ],
      });

      // Act — with toYear
      const withToYear = await service.getSummary({ toYear: '2024' });
      // Act — without toYear → latest year in data (2025)
      const withoutToYear = await service.getSummary({});

      // Assert
      expect(withToYear.stats.applicants.value).toBe(20);
      expect(withToYear.stats.attended.value).toBe(18);
      expect(withoutToYear.stats.applicants.value).toBe(30);
      expect(withoutToYear.stats.attended.value).toBe(25);
    });
  });
});
