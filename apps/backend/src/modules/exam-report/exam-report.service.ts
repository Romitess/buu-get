import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { ExamReportQueryDto } from './dto/exam-report-query.dto';
import { ExamReportYearQueryDto } from './dto/exam-report-year-query.dto';
import {
  ExamCandidateInfo,
  ExamInformationRound,
  ExamReportListResponse,
  ExamReportOption,
  ExamReportOptions,
  ExamReportStat,
  ExamReportSummary,
  ExamYearTableRow,
} from './interfaces/exam-report.interface';
import { buildPaginatedResponse } from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { Exam } from '../exam/entities/exam.entity';
import { ExamScoreLine } from '../exam-scores/entities/exam-score-line.entity';

/** ช่วงคะแนนของกราฟสรุปคะแนน (เลือก B: นับเฉพาะ >= 40) */
const SCORE_RANGES = ['40-49', '50-59', '60-69', '70-79', '80-100'];

/** ชื่อเดือนภาษาไทยสำหรับ dropdown ฟิลเตอร์ */
const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
];

interface YearMetricRow {
  year: string | number;
  registered: string | number;
  attended: string | number;
}

interface YearAvgRow {
  year: string | number;
  avgScore: string | number | null;
}

interface YearBucketRow {
  year: string | number;
  r40: string | number;
  r50: string | number;
  r60: string | number;
  r70: string | number;
  r80: string | number;
}

interface RoundRawRow {
  round: string | null;
  examDate: string | null;
  registered: string | number;
  attended: string | number;
}

interface YearMinMaxRow {
  year: string | number;
  minScore: string | number | null;
  maxScore: string | number | null;
}

interface YearRepeatRow {
  year: string | number;
  repeatTakers: string | number;
}

interface AttemptProportionRow {
  total: string | number;
  repeat: string | number;
}

interface ExamInformationRoundRawRow {
  round: string | null;
  examDate: string | null;
  applicants: string | number;
  attended: string | number;
  repeatTakers: string | number;
  minScore: string | number | null;
  maxScore: string | number | null;
  averageScore: string | number | null;
}

interface ExamCandidateInfoRawRow {
  enrollmentId: string | number;
  scoresId: string | number | null;
  examNumber: string | null;
  prefix: string | null;
  fullName: string | null;
  vocabularyGrammarScore: string | number | null;
  readingScore: string | number | null;
  totalScore: string | number | null;
  level: string | number | null;
  attemptStatus: 'firstAttempt' | 'repeatAttempt';
}

@Injectable()
export class ExamReportService {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary(query: ExamReportQueryDto): Promise<ExamReportSummary> {
    const metricByYear = await this.getMetricByYear(query);
    const avgByYear = await this.getAvgScoreByYear(query);
    const bucketByYear = await this.getScoreBucketByYear(query);
    const rounds = await this.getRounds(query);
    const minMaxByYear = await this.getScoreMinMaxByYear(query);
    const [repeatByYear, attemptProportion] = await Promise.all([
      this.getRepeatTakersByYear(query),
      this.getAttemptProportion(query),
    ]);

    // ปีที่อยู่ในข้อมูล (เรียงจากน้อยไปมาก)
    const years = metricByYear.map((m) => Number(m.year)).sort((a, b) => a - b);

    // ปีเป้าหมายของการ์ดสถิติ = ปีสิ้นสุดที่เลือก หรือปีล่าสุดที่มีข้อมูล
    const targetYear = query.toYear
      ? Number(query.toYear)
      : (years[years.length - 1] ?? new Date().getFullYear());
    const previousYear = targetYear - 1;

    // สร้าง map เพื่อ lookup ง่าย
    const registeredMap = new Map<number, number>();
    const attendedMap = new Map<number, number>();
    metricByYear.forEach((m) => {
      registeredMap.set(Number(m.year), Number(m.registered));
      attendedMap.set(Number(m.year), Number(m.attended));
    });
    const avgMap = new Map<number, number>();
    avgByYear.forEach((a) => {
      avgMap.set(Number(a.year), a.avgScore === null ? 0 : Number(a.avgScore));
    });

    // ── การ์ดสถิติ ──
    const registeredNow = registeredMap.get(targetYear) ?? 0;
    const registeredPrev = registeredMap.get(previousYear) ?? 0;
    const attendedNow = attendedMap.get(targetYear) ?? 0;
    const attendedPrev = attendedMap.get(previousYear) ?? 0;
    const absentNow = registeredNow - attendedNow;
    const absentPrev = registeredPrev - attendedPrev;
    const avgNow = this.round1(avgMap.get(targetYear) ?? 0);
    const avgPrev = this.round1(avgMap.get(previousYear) ?? 0);

    const stats: ExamReportSummary['stats'] = {
      applicants: this.buildStat(registeredNow, registeredPrev),
      attended: {
        ...this.buildStat(attendedNow, attendedPrev),
        rate: this.percent(attendedNow, registeredNow),
      },
      absent: {
        ...this.buildStat(absentNow, absentPrev),
        rate: this.percent(absentNow, registeredNow),
      },
      averageScore: {
        ...this.buildStat(avgNow, avgPrev),
        trend: years.map((y) => this.round1(avgMap.get(y) ?? 0)),
      },
    };

    // ── กราฟตามปี ──
    const attendanceByYear = years.map((y) => {
      const registered = registeredMap.get(y) ?? 0;
      const attended = attendedMap.get(y) ?? 0;
      return { year: y, attended, absent: registered - attended };
    });

    const registrationTrend = years.map((y) => ({
      year: y,
      registered: registeredMap.get(y) ?? 0,
    }));

    const bucketMap = new Map<number, number[]>();
    bucketByYear.forEach((b) => {
      bucketMap.set(Number(b.year), [
        Number(b.r40),
        Number(b.r50),
        Number(b.r60),
        Number(b.r70),
        Number(b.r80),
      ]);
    });
    const scoreYears = bucketByYear
      .map((b) => Number(b.year))
      .sort((a, b) => a - b);
    const scoreSummaryByYear = {
      ranges: SCORE_RANGES,
      rows: scoreYears.map((y) => ({
        year: y,
        counts: bucketMap.get(y) ?? [0, 0, 0, 0, 0],
      })),
    };

    // ── ตารางสรุปรายปี ──
    const minScoreMap = new Map<number, number | null>();
    const maxScoreMap = new Map<number, number | null>();
    minMaxByYear.forEach((m) => {
      minScoreMap.set(
        Number(m.year),
        m.minScore === null ? null : this.round1(Number(m.minScore)),
      );
      maxScoreMap.set(
        Number(m.year),
        m.maxScore === null ? null : this.round1(Number(m.maxScore)),
      );
    });

    const yearTable: ExamYearTableRow[] = years.map((y) => {
      const registered = registeredMap.get(y) ?? 0;
      const attended = attendedMap.get(y) ?? 0;
      const avg = avgMap.get(y);
      return {
        year: y,
        registered,
        attended,
        absent: registered - attended,
        repeatTakers: repeatByYear.get(y) ?? 0,
        minScore: minScoreMap.get(y) ?? null,
        maxScore: maxScoreMap.get(y) ?? null,
        averageScore: avg === undefined ? null : this.round1(avg),
      };
    });

    return {
      stats,
      attendanceByYear,
      registrationTrend,
      rounds,
      scoreSummaryByYear,
      attemptProportion,
      yearTable,
    };
  }

  /** ตัวเลือกฟิลเตอร์ (ปี/เดือน/รอบ) จากข้อมูลจริง */
  async getOptions(): Promise<ExamReportOptions> {
    const examRepo = this.dataSource.getRepository(Exam);

    const yearRows = await examRepo
      .createQueryBuilder('x')
      .select('DISTINCT YEAR(x.EXAM_DATE)', 'year')
      .where('x.EXAM_DATE IS NOT NULL')
      .orderBy('year', 'DESC')
      .getRawMany<{ year: string | number }>();

    const years: ExamReportOption[] = yearRows
      .filter((r) => r.year !== null)
      .map((r) => ({ label: String(r.year), value: String(r.year) }));

    const months: ExamReportOption[] = THAI_MONTHS.map((name, idx) => ({
      label: name,
      value: String(idx + 1).padStart(2, '0'),
    }));

    const roundRows = await examRepo
      .createQueryBuilder('x')
      .select('DISTINCT x.EXAM_ROUND', 'round')
      .where('x.EXAM_ROUND IS NOT NULL')
      .orderBy('x.EXAM_ROUND', 'ASC')
      .getRawMany<{ round: string | null }>();

    const rounds: ExamReportOption[] = roundRows
      .filter((r) => r.round)
      .map((r) => ({ label: String(r.round), value: String(r.round) }));

    return { years, months, rounds };
  }

  /** รายละเอียดรอบสอบภายในปีที่เลือก สำหรับหน้า exam-information */
  async getYearRounds(
    year: number,
    query: ExamReportYearQueryDto = {},
  ): Promise<ExamReportListResponse<ExamInformationRound>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const search = query.search?.trim();

    const repeatTakersSql = `
      COUNT(DISTINCT CASE
        WHEN sc.SCORES_ID IS NOT NULL
          AND ${this.previousScoreExistsSql()}
        THEN e.USER_ID
      END)
    `;

    const listQb = this.baseEnrollmentQb()
      .leftJoin('e.SCORE', 'sc')
      .select('x.EXAM_ROUND', 'round')
      .addSelect('x.EXAM_DATE', 'examDate')
      .addSelect('COUNT(DISTINCT e.ERM_ID)', 'applicants')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN e.ERM_STATUS = ${ExamEnrollmentStatus.ATTENDED} THEN e.ERM_ID END)`,
        'attended',
      )
      .addSelect(repeatTakersSql, 'repeatTakers')
      .addSelect('MIN(sc.SC_TOTAL_SCORE)', 'minScore')
      .addSelect('MAX(sc.SC_TOTAL_SCORE)', 'maxScore')
      .addSelect('AVG(sc.SC_TOTAL_SCORE)', 'averageScore')
      .andWhere('x.EXAM_DATE IS NOT NULL')
      .andWhere('YEAR(x.EXAM_DATE) = :year', { year })
      .groupBy('x.EXAM_ID')
      .addGroupBy('x.EXAM_ROUND')
      .addGroupBy('x.EXAM_DATE')
      .orderBy('x.EXAM_DATE', 'ASC')
      .addOrderBy('x.EXAM_ID', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyYearListSearch(listQb, search);

    const countQb = this.baseEnrollmentQb()
      .andWhere('x.EXAM_DATE IS NOT NULL')
      .andWhere('YEAR(x.EXAM_DATE) = :year', { year })
      .select('COUNT(DISTINCT x.EXAM_ID)', 'cnt');
    this.applyYearListSearch(countQb, search);

    const [rows, totalRow, scoreAgg] = await Promise.all([
      listQb.getRawMany<ExamInformationRoundRawRow>(),
      countQb.getRawOne<{ cnt: string | number }>(),
      this.getYearRoundScoreAggregates(year),
    ]);

    const total = Number(totalRow?.cnt ?? 0);
    const data = rows.map((row) => {
      const applicants = Number(row.applicants);
      const attended = Number(row.attended);
      const examDate = row.examDate ? new Date(row.examDate) : null;
      const examYear = examDate?.getFullYear() ?? year;
      const round = this.formatRoundLabel(row.round, examYear);

      return {
        round,
        applicants,
        attended,
        absent: applicants - attended,
        repeatTakers: Number(row.repeatTakers),
        minScore: this.roundNullable(row.minScore),
        maxScore: this.roundNullable(row.maxScore),
        averageScore: this.roundNullable(row.averageScore),
      };
    });

    const pageResponse = buildPaginatedResponse(data, total, page, limit);
    return {
      data: pageResponse.data,
      meta: {
        ...pageResponse.meta,
        minScore: scoreAgg.minScore,
        maxScore: scoreAgg.maxScore,
        averageScore: scoreAgg.averageScore,
      },
    };
  }

  /** รายชื่อผู้เข้าสอบและคะแนนรายบุคคลภายในปี/รอบสอบที่เลือก */
  async getYearRoundCandidates(
    year: number,
    query: ExamReportYearQueryDto = {},
  ): Promise<ExamReportListResponse<ExamCandidateInfo>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const search = query.search?.trim();
    const round = query.round;

    const qb = this.baseEnrollmentQb()
      .innerJoin('e.USER', 'u')
      .leftJoin('e.SCORE', 'sc')
      .leftJoin(
        'BUU_GET_T_USER_PROFILE',
        'profile',
        'profile.USER_ID = e.USER_ID AND profile.DELETED_AT IS NULL',
      )
      .select('e.ERM_ID', 'enrollmentId')
      .addSelect("COALESCE(e.ERM_TEST_TAKER, u.USER_CODE, '')", 'examNumber')
      .addSelect(
        "COALESCE(profile.USER_TITLE_TH, profile.USER_TITLE_EN, '')",
        'prefix',
      )
      .addSelect(
        "COALESCE(profile.USER_FULLNAME_TH, profile.USER_FULLNAME_EN, u.USER_EMAIL, '')",
        'fullName',
      )
      .addSelect('sc.SCORES_ID', 'scoresId')
      .addSelect('sc.SC_LANG_USE_SCORE', 'vocabularyGrammarScore')
      .addSelect('sc.SC_READING_SCORE', 'readingScore')
      .addSelect('sc.SC_TOTAL_SCORE', 'totalScore')
      .addSelect('sc.SC_BAND_LEVEL', 'level')
      .addSelect(
        `CASE WHEN ${this.previousScoreExistsSql()} THEN 'repeatAttempt' ELSE 'firstAttempt' END`,
        'attemptStatus',
      )
      .andWhere('x.EXAM_DATE IS NOT NULL')
      .andWhere('YEAR(x.EXAM_DATE) = :year', { year })
      .orderBy('e.ERM_TEST_TAKER', 'ASC')
      .addOrderBy('e.ERM_ID', 'ASC');

    this.applyRoundLabelFilter(qb, round);
    this.applyCandidateSearch(qb, search);

    const countQb = qb.clone();
    const total = await countQb.getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getRawMany<ExamCandidateInfoRawRow>();

    const scoreIds = rows
      .map((row) => (row.scoresId != null ? Number(row.scoresId) : null))
      .filter((id): id is number => id != null);
    const [linesByScoreId, scoreAgg] = await Promise.all([
      this.loadScoreLinesByScoreIds(scoreIds),
      this.getYearRoundScoreAggregates(year, round),
    ]);

    const data = rows.map((row) => {
      const scoresId = row.scoresId != null ? Number(row.scoresId) : null;
      const scoreLines =
        scoresId != null ? linesByScoreId.get(scoresId) : undefined;

      return {
        id: String(row.enrollmentId),
        examNumber: row.examNumber ?? '',
        prefix: row.prefix ?? '',
        fullName: row.fullName ?? '',
        vocabularyGrammarScore: this.roundNullable(row.vocabularyGrammarScore),
        readingScore: this.roundNullable(row.readingScore),
        totalScore: this.roundNullable(row.totalScore),
        level:
          row.level === null || row.level === undefined
            ? null
            : String(row.level).trim() || null,
        attemptStatus:
          row.attemptStatus === 'repeatAttempt'
            ? ('repeatAttempt' as const)
            : ('firstAttempt' as const),
        scoreLines,
      };
    });

    const pageResponse = buildPaginatedResponse(data, total, page, limit);
    return {
      data: pageResponse.data,
      meta: {
        ...pageResponse.meta,
        minScore: scoreAgg.minScore,
        maxScore: scoreAgg.maxScore,
        averageScore: scoreAgg.averageScore,
      },
    };
  }

  private async loadScoreLinesByScoreIds(scoreIds: number[]): Promise<
    Map<
      number,
      {
        nameTh: string;
        nameEn: string;
        score: number | null;
        maxScore: number;
        sortOrder: number;
      }[]
    >
  > {
    if (scoreIds.length === 0) {
      return new Map();
    }

    const lines = await this.dataSource
      .getRepository(ExamScoreLine)
      .createQueryBuilder('line')
      .where('line.SCORES_ID IN (:...scoreIds)', { scoreIds })
      .andWhere('line.DELETED_AT IS NULL')
      .orderBy('line.SCL_SORT_ORDER', 'ASC')
      .getMany();

    const map = new Map<
      number,
      {
        nameTh: string;
        nameEn: string;
        score: number | null;
        maxScore: number;
        sortOrder: number;
      }[]
    >();

    for (const line of lines) {
      const bucket = map.get(line.SCORES_ID) ?? [];
      bucket.push({
        nameTh: line.SCL_NAME_TH,
        nameEn: line.SCL_NAME_EN,
        score: this.roundNullable(line.SCL_SCORE),
        maxScore: Number(line.SCL_MAX_SCORE),
        sortOrder: line.SCL_SORT_ORDER,
      });
      map.set(line.SCORES_ID, bucket);
    }

    return map;
  }

  // ── Query helpers ─────────────────────────────────────────

  /** จำนวนผู้สมัคร (registered) และผู้เข้าสอบ (attended INTIME) ต่อปี */
  private async getMetricByYear(
    query: ExamReportQueryDto,
  ): Promise<YearMetricRow[]> {
    const qb = this.baseEnrollmentQb()
      .select('YEAR(x.EXAM_DATE)', 'year')
      .addSelect('COUNT(DISTINCT e.ERM_ID)', 'registered')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN e.ERM_STATUS = ${ExamEnrollmentStatus.ATTENDED} THEN e.ERM_ID END)`,
        'attended',
      )
      .groupBy('year')
      .having('year IS NOT NULL');

    this.applyYearRange(qb, query);
    return qb.getRawMany<YearMetricRow>();
  }

  /** คะแนนเฉลี่ย (SC_TOTAL_SCORE สเกล 0-100) ต่อปี — เฉพาะคนที่มีคะแนน */
  private async getAvgScoreByYear(
    query: ExamReportQueryDto,
  ): Promise<YearAvgRow[]> {
    const qb = this.baseEnrollmentQb()
      .innerJoin('e.SCORE', 'sc')
      .select('YEAR(x.EXAM_DATE)', 'year')
      .addSelect('AVG(sc.SC_TOTAL_SCORE)', 'avgScore')
      .groupBy('year')
      .having('year IS NOT NULL');

    this.applyYearRange(qb, query);
    return qb.getRawMany<YearAvgRow>();
  }

  /** นับจำนวนคนตามช่วงคะแนน (>= 40 เท่านั้น) ต่อปี */
  private async getScoreBucketByYear(
    query: ExamReportQueryDto,
  ): Promise<YearBucketRow[]> {
    const qb = this.baseEnrollmentQb()
      .innerJoin('e.SCORE', 'sc')
      .select('YEAR(x.EXAM_DATE)', 'year')
      .addSelect(
        'SUM(CASE WHEN sc.SC_TOTAL_SCORE >= 40 AND sc.SC_TOTAL_SCORE < 50 THEN 1 ELSE 0 END)',
        'r40',
      )
      .addSelect(
        'SUM(CASE WHEN sc.SC_TOTAL_SCORE >= 50 AND sc.SC_TOTAL_SCORE < 60 THEN 1 ELSE 0 END)',
        'r50',
      )
      .addSelect(
        'SUM(CASE WHEN sc.SC_TOTAL_SCORE >= 60 AND sc.SC_TOTAL_SCORE < 70 THEN 1 ELSE 0 END)',
        'r60',
      )
      .addSelect(
        'SUM(CASE WHEN sc.SC_TOTAL_SCORE >= 70 AND sc.SC_TOTAL_SCORE < 80 THEN 1 ELSE 0 END)',
        'r70',
      )
      .addSelect(
        'SUM(CASE WHEN sc.SC_TOTAL_SCORE >= 80 THEN 1 ELSE 0 END)',
        'r80',
      )
      .groupBy('year')
      .having('year IS NOT NULL');

    this.applyYearRange(qb, query);
    return qb.getRawMany<YearBucketRow>();
  }

  /** คะแนนต่ำสุด/สูงสุด (SC_TOTAL_SCORE) ต่อปี */
  private async getScoreMinMaxByYear(
    query: ExamReportQueryDto,
  ): Promise<YearMinMaxRow[]> {
    const qb = this.baseEnrollmentQb()
      .innerJoin('e.SCORE', 'sc')
      .select('YEAR(x.EXAM_DATE)', 'year')
      .addSelect('MIN(sc.SC_TOTAL_SCORE)', 'minScore')
      .addSelect('MAX(sc.SC_TOTAL_SCORE)', 'maxScore')
      .where('sc.SC_TOTAL_SCORE IS NOT NULL')
      .groupBy('year')
      .having('year IS NOT NULL');

    this.applyYearRange(qb, query);
    return qb.getRawMany<YearMinMaxRow>();
  }

  /**
   * จำนวนผู้เข้าสอบซ้ำรายปี = COUNT(DISTINCT USER_ID) ที่มีคะแนนในปีนั้น
   * และมี enrollment มีคะแนนก่อนหน้า (lifetime — ไม่จำกัดช่วงฟิลเตอร์)
   */
  private async getRepeatTakersByYear(
    query: ExamReportQueryDto,
  ): Promise<Map<number, number>> {
    const qb = this.baseEnrollmentQb()
      .innerJoin('e.SCORE', 'sc')
      .select('YEAR(x.EXAM_DATE)', 'year')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN ${this.previousScoreExistsSql()} THEN e.USER_ID END)`,
        'repeatTakers',
      )
      .andWhere('x.EXAM_DATE IS NOT NULL')
      .groupBy('year')
      .having('year IS NOT NULL');

    this.applyYearRange(qb, query);
    const rows = await qb.getRawMany<YearRepeatRow>();

    const map = new Map<number, number>();
    rows.forEach((row) => {
      map.set(Number(row.year), Number(row.repeatTakers));
    });
    return map;
  }

  /**
   * สัดส่วนสอบครั้งเดียว / สอบซ้ำ ในช่วงฟิลเตอร์ (นับคนที่มีคะแนน)
   * - repeat: มีอย่างน้อย 1 scored attempt ใน window ที่เป็น repeat (มี prior lifetime)
   * - firstTime: scored users ใน window ที่ไม่ใช่ repeat
   */
  private async getAttemptProportion(
    query: ExamReportQueryDto,
  ): Promise<{ firstTime: number; repeat: number }> {
    const qb = this.baseEnrollmentQb()
      .innerJoin('e.SCORE', 'sc')
      .select('COUNT(DISTINCT e.USER_ID)', 'total')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN ${this.previousScoreExistsSql()} THEN e.USER_ID END)`,
        'repeat',
      )
      .andWhere('x.EXAM_DATE IS NOT NULL');

    this.applyYearRange(qb, query);
    const row = await qb.getRawOne<AttemptProportionRow>();

    const total = Number(row?.total ?? 0);
    const repeat = Number(row?.repeat ?? 0);
    return {
      firstTime: Math.max(0, total - repeat),
      repeat,
    };
  }

  /**
   * มี enrollment มีคะแนนก่อนหน้าของ user เดียวกันหรือไม่
   * (เรียง EXAM_DATE แล้ว EXAM_ID — ใช้พารามิเตอร์ :cancelled จาก baseEnrollmentQb)
   */
  private previousScoreExistsSql(): string {
    return `
      EXISTS (
        SELECT 1
        FROM EXAM_T_ENROLLMENTS prev_e
        INNER JOIN EXAM_T_SESSIONS prev_s
          ON prev_s.SS_ID = prev_e.SESSION_ID
          AND prev_s.DELETED_AT IS NULL
        INNER JOIN EXAM_T_EXAM prev_x
          ON prev_x.EXAM_ID = prev_s.EXAM_ID
          AND prev_x.DELETED_AT IS NULL
        INNER JOIN EXAM_T_SCORES prev_sc
          ON prev_sc.ERM_ID = prev_e.ERM_ID
          AND prev_sc.DELETED_AT IS NULL
        WHERE prev_e.USER_ID = e.USER_ID
          AND prev_e.ERM_ID <> e.ERM_ID
          AND prev_e.DELETED_AT IS NULL
          AND prev_e.ERM_STATUS != :cancelled
          AND prev_x.EXAM_DATE IS NOT NULL
          AND (
            prev_x.EXAM_DATE < x.EXAM_DATE
            OR (prev_x.EXAM_DATE = x.EXAM_DATE AND prev_x.EXAM_ID < x.EXAM_ID)
          )
      )
    `;
  }

  /** ตารางรอบสอบ — registered / attended ต่อรอบ (ต่อ Exam) */
  private async getRounds(
    query: ExamReportQueryDto,
  ): Promise<ExamReportSummary['rounds']> {
    const qb = this.baseEnrollmentQb()
      .select('x.EXAM_ROUND', 'round')
      .addSelect('x.EXAM_DATE', 'examDate')
      .addSelect('COUNT(DISTINCT e.ERM_ID)', 'registered')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN e.ERM_STATUS = ${ExamEnrollmentStatus.ATTENDED} THEN e.ERM_ID END)`,
        'attended',
      )
      .groupBy('x.EXAM_ID')
      .addGroupBy('x.EXAM_ROUND')
      .addGroupBy('x.EXAM_DATE')
      .orderBy('x.EXAM_DATE', 'ASC');

    this.applyYearRange(qb, query);
    const rows = await qb.getRawMany<RoundRawRow>();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rows.map((row) => {
      const examDateStr = row.examDate ?? '';
      const yearLabel = examDateStr ? new Date(examDateStr).getFullYear() : '';
      const round = this.formatRoundLabel(row.round, yearLabel);

      const registered = Number(row.registered);
      const attended = Number(row.attended);
      const isFuture = examDateStr ? new Date(examDateStr) > today : true;

      // ยังไม่ถึงวันสอบ → ยังไม่มีผลเข้า/ขาดสอบ
      if (isFuture) {
        return {
          round,
          examDate: examDateStr,
          registered,
          attended: null,
          absent: null,
        };
      }

      return {
        round,
        examDate: examDateStr,
        registered,
        attended,
        absent: registered - attended,
      };
    });
  }

  // ── Shared building blocks ────────────────────────────────

  /** base query: enrollment (ไม่นับ CANCELLED) → session → exam */
  private baseEnrollmentQb(): SelectQueryBuilder<ExamEnrollment> {
    return this.dataSource
      .getRepository(ExamEnrollment)
      .createQueryBuilder('e')
      .innerJoin('e.SESSION', 's')
      .innerJoin('s.EXAM', 'x')
      .where('e.ERM_STATUS != :cancelled', {
        cancelled: ExamEnrollmentStatus.CANCELLED,
      });
  }

  private formatRoundLabel(
    round: string | null,
    year: number | string | null,
  ): string {
    const roundText = round?.trim();
    const yearText = year === null ? '' : String(year).trim();

    if (!roundText) return yearText;
    if (!yearText || roundText.endsWith(`/${yearText}`)) return roundText;

    return `${roundText}/${yearText}`;
  }

  /** คะแนนรวมทั้งปี/รอบ — ไม่ผูกกับ page/search ของรายการ */
  private async getYearRoundScoreAggregates(
    year: number,
    round?: string,
  ): Promise<{
    minScore: number | null;
    maxScore: number | null;
    averageScore: number | null;
  }> {
    const qb = this.baseEnrollmentQb()
      .leftJoin('e.SCORE', 'sc')
      .select('MIN(sc.SC_TOTAL_SCORE)', 'minScore')
      .addSelect('MAX(sc.SC_TOTAL_SCORE)', 'maxScore')
      .addSelect('AVG(sc.SC_TOTAL_SCORE)', 'averageScore')
      .andWhere('x.EXAM_DATE IS NOT NULL')
      .andWhere('YEAR(x.EXAM_DATE) = :year', { year });

    this.applyRoundLabelFilter(qb, round);

    const row = await qb.getRawOne<{
      minScore: string | number | null;
      maxScore: string | number | null;
      averageScore: string | number | null;
    }>();

    return {
      minScore: this.roundNullable(row?.minScore ?? null),
      maxScore: this.roundNullable(row?.maxScore ?? null),
      averageScore: this.roundNullable(row?.averageScore ?? null),
    };
  }

  private applyYearListSearch(
    qb: SelectQueryBuilder<ExamEnrollment>,
    search?: string,
  ): void {
    const searchText = search?.trim();
    if (!searchText) return;

    qb.andWhere(
      `(
        x.EXAM_ROUND LIKE :roundSearch
        OR x.EXAM_NAME LIKE :roundSearch
        OR CONCAT(TRIM(x.EXAM_ROUND), '/', TRIM(x.EXAM_FISCAL_YEAR)) LIKE :roundSearch
        OR CONCAT(TRIM(x.EXAM_ROUND), '/', YEAR(x.EXAM_DATE)) LIKE :roundSearch
      )`,
      { roundSearch: `%${searchText}%` },
    );
  }

  private applyCandidateSearch(
    qb: SelectQueryBuilder<ExamEnrollment>,
    search?: string,
  ): void {
    const searchText = search?.trim();
    if (!searchText) return;

    qb.andWhere(
      `(
        COALESCE(e.ERM_TEST_TAKER, u.USER_CODE, '') LIKE :candidateSearch
        OR COALESCE(profile.USER_TITLE_TH, profile.USER_TITLE_EN, '') LIKE :candidateSearch
        OR COALESCE(profile.USER_FULLNAME_TH, profile.USER_FULLNAME_EN, u.USER_EMAIL, '') LIKE :candidateSearch
      )`,
      { candidateSearch: `%${searchText}%` },
    );
  }

  private applyRoundLabelFilter(
    qb: SelectQueryBuilder<ExamEnrollment>,
    round?: string,
  ): void {
    const roundText = round?.trim();
    if (!roundText) return;

    qb.andWhere(
      `(
        TRIM(x.EXAM_ROUND) = :roundLabel
        OR CONCAT(TRIM(x.EXAM_ROUND), '/', TRIM(x.EXAM_FISCAL_YEAR)) = :roundLabel
        OR CONCAT(TRIM(x.EXAM_ROUND), '/', YEAR(x.EXAM_DATE)) = :roundLabel
      )`,
      { roundLabel: roundText },
    );
  }

  /** กรองช่วงปีจาก Exam.EXAM_DATE (month/round filter เป็น TODO รอบหน้า) */
  private applyYearRange(
    qb: SelectQueryBuilder<ExamEnrollment>,
    query: ExamReportQueryDto,
  ): void {
    if (query.fromYear) {
      qb.andWhere('YEAR(x.EXAM_DATE) >= :fromYear', {
        fromYear: Number(query.fromYear),
      });
    }
    if (query.toYear) {
      qb.andWhere('YEAR(x.EXAM_DATE) <= :toYear', {
        toYear: Number(query.toYear),
      });
    }
  }

  private buildStat(value: number, previousValue: number): ExamReportStat {
    return {
      value,
      previousValue,
      changePercent:
        previousValue > 0
          ? this.round1(((value - previousValue) / previousValue) * 100)
          : 0,
    };
  }

  private percent(part: number, whole: number): number {
    return whole > 0 ? Math.round((part / whole) * 100) : 0;
  }

  private round1(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private roundNullable(value: string | number | null): number | null {
    if (value === null) return null;

    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? null : this.round1(numericValue);
  }
}
