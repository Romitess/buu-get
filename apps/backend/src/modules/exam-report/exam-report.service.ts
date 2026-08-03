import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { ExamReportQueryDto } from './dto/exam-report-query.dto';
import {
  ExamBandChange,
  ExamCandidateInfo,
  ExamInformationRound,
  ExamReportOption,
  ExamReportOptions,
  ExamReportStat,
  ExamReportSummary,
  ExamYearTableRow,
} from './interfaces/exam-report.interface';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { ExamAttendStatus } from '../exam-attendances/entities/exam-attendance.entity';
import { Exam } from '../exam/entities/exam.entity';

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

interface ScoredAttemptRow {
  userId: string | number;
  year: string | number;
  band: string | number | null;
}

interface YearMinMaxRow {
  year: string | number;
  minScore: string | number | null;
  maxScore: string | number | null;
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
    const scoredAttempts = await this.getUserScoredAttempts(query);

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

    // ── การเปลี่ยนแปลง Band ของผู้เข้าสอบซ้ำ + ผู้เข้าสอบซ้ำรายปี ──
    const { bandChange, repeatByYear } = this.computeBandChange(scoredAttempts);

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
      bandChange,
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
  async getYearRounds(year: number): Promise<ExamInformationRound[]> {
    const repeatTakersSql = `
      COUNT(DISTINCT CASE
        WHEN sc.SCORES_ID IS NOT NULL
          AND EXISTS (
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
        THEN e.USER_ID
      END)
    `;

    const rows = await this.baseEnrollmentQb()
      .leftJoin('e.ATTENDANCES', 'a')
      .leftJoin('e.SCORE', 'sc')
      .select('x.EXAM_ROUND', 'round')
      .addSelect('x.EXAM_DATE', 'examDate')
      .addSelect('COUNT(DISTINCT e.ERM_ID)', 'applicants')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN a.ATTEND_STATUS = ${ExamAttendStatus.INTIME} THEN e.ERM_ID END)`,
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
      .getRawMany<ExamInformationRoundRawRow>();

    return rows.map((row) => {
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
  }

  /** รายชื่อผู้เข้าสอบและคะแนนรายบุคคลภายในปี/รอบสอบที่เลือก */
  async getYearRoundCandidates(
    year: number,
    round?: string,
  ): Promise<ExamCandidateInfo[]> {
    const previousScoreExistsSql = `
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
      .addSelect('sc.SC_LANG_USE_SCORE', 'vocabularyGrammarScore')
      .addSelect('sc.SC_READING_SCORE', 'readingScore')
      .addSelect('sc.SC_TOTAL_SCORE', 'totalScore')
      .addSelect('sc.SC_BAND_LEVEL', 'level')
      .addSelect(
        `CASE WHEN ${previousScoreExistsSql} THEN 'repeatAttempt' ELSE 'firstAttempt' END`,
        'attemptStatus',
      )
      .andWhere('x.EXAM_DATE IS NOT NULL')
      .andWhere('YEAR(x.EXAM_DATE) = :year', { year })
      .orderBy('e.ERM_TEST_TAKER', 'ASC')
      .addOrderBy('e.ERM_ID', 'ASC');

    this.applyRoundLabelFilter(qb, round);

    const rows = await qb.getRawMany<ExamCandidateInfoRawRow>();

    return rows.map((row) => ({
      id: String(row.enrollmentId),
      examNumber: row.examNumber ?? '',
      prefix: row.prefix ?? '',
      fullName: row.fullName ?? '',
      vocabularyGrammarScore: this.roundNullable(row.vocabularyGrammarScore),
      readingScore: this.roundNullable(row.readingScore),
      totalScore: this.roundNullable(row.totalScore),
      level: this.roundNullable(row.level),
      attemptStatus:
        row.attemptStatus === 'repeatAttempt'
          ? 'repeatAttempt'
          : 'firstAttempt',
    }));
  }

  // ── Query helpers ─────────────────────────────────────────

  /** จำนวนผู้สมัคร (registered) และผู้เข้าสอบ (attended INTIME) ต่อปี */
  private async getMetricByYear(
    query: ExamReportQueryDto,
  ): Promise<YearMetricRow[]> {
    const qb = this.baseEnrollmentQb()
      .leftJoin('e.ATTENDANCES', 'a')
      .select('YEAR(x.EXAM_DATE)', 'year')
      .addSelect('COUNT(DISTINCT e.ERM_ID)', 'registered')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN a.ATTEND_STATUS = ${ExamAttendStatus.INTIME} THEN e.ERM_ID END)`,
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
   * ครั้งที่เข้าสอบและมีคะแนนของผู้ใช้แต่ละคน (เรียงตามวันสอบ)
   * ใช้คำนวณการเปลี่ยนแปลง Band และจำนวนผู้เข้าสอบซ้ำรายปี
   */
  private async getUserScoredAttempts(
    query: ExamReportQueryDto,
  ): Promise<ScoredAttemptRow[]> {
    const qb = this.baseEnrollmentQb()
      .innerJoin('e.SCORE', 'sc')
      .select('e.USER_ID', 'userId')
      .addSelect('YEAR(x.EXAM_DATE)', 'year')
      .addSelect('sc.SC_BAND_LEVEL', 'band')
      .where('x.EXAM_DATE IS NOT NULL')
      .orderBy('e.USER_ID', 'ASC')
      .addOrderBy('x.EXAM_DATE', 'ASC');

    this.applyYearRange(qb, query);
    return qb.getRawMany<ScoredAttemptRow>();
  }

  /**
   * จากรายการครั้งสอบที่เรียงตามผู้ใช้+วันสอบ → คำนวณ:
   * - bandChange: เทียบ Band ครั้งล่าสุดกับครั้งก่อนหน้าของผู้เข้าสอบซ้ำ
   * - repeatByYear: นับครั้งสอบที่ "ไม่ใช่ครั้งแรก" ของผู้ใช้ ตามปีของครั้งนั้น
   */
  private computeBandChange(rows: ScoredAttemptRow[]): {
    bandChange: ExamBandChange;
    repeatByYear: Map<number, number>;
  } {
    const attemptsByUser = new Map<
      number,
      { year: number; band: number | null }[]
    >();
    rows.forEach((r) => {
      const userId = Number(r.userId);
      const list = attemptsByUser.get(userId) ?? [];
      list.push({
        year: Number(r.year),
        band: r.band === null ? null : Number(r.band),
      });
      attemptsByUser.set(userId, list);
    });

    const bandChange: ExamBandChange = {
      repeatTakers: 0,
      increased: 0,
      same: 0,
      decreased: 0,
    };
    const repeatByYear = new Map<number, number>();

    attemptsByUser.forEach((attempts) => {
      // ครั้งสอบที่ไม่ใช่ครั้งแรก → นับเป็นผู้เข้าสอบซ้ำของปีนั้น
      attempts.slice(1).forEach((a) => {
        repeatByYear.set(a.year, (repeatByYear.get(a.year) ?? 0) + 1);
      });

      // การเปลี่ยน Band: ใช้เฉพาะครั้งที่มี Band เทียบสองครั้งล่าสุด
      const withBand = attempts.filter((a) => a.band !== null);
      if (withBand.length < 2) return;

      const last = withBand[withBand.length - 1].band as number;
      const prev = withBand[withBand.length - 2].band as number;
      bandChange.repeatTakers += 1;
      if (last > prev) bandChange.increased += 1;
      else if (last < prev) bandChange.decreased += 1;
      else bandChange.same += 1;
    });

    return { bandChange, repeatByYear };
  }

  /** ตารางรอบสอบ — registered / attended ต่อรอบ (ต่อ Exam) */
  private async getRounds(
    query: ExamReportQueryDto,
  ): Promise<ExamReportSummary['rounds']> {
    const qb = this.baseEnrollmentQb()
      .leftJoin('e.ATTENDANCES', 'a')
      .select('x.EXAM_ROUND', 'round')
      .addSelect('x.EXAM_DATE', 'examDate')
      .addSelect('COUNT(DISTINCT e.ERM_ID)', 'registered')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN a.ATTEND_STATUS = ${ExamAttendStatus.INTIME} THEN e.ERM_ID END)`,
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
