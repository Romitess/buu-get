import { Injectable } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { ExamReportQueryDto } from './dto/exam-report-query.dto';
import {
  ExamReportStat,
  ExamReportSummary,
} from './interfaces/exam-report.interface';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { ExamAttendStatus } from '../exam-attendances/entities/exam-attendance.entity';

/** ช่วงคะแนนของกราฟสรุปคะแนน (เลือก B: นับเฉพาะ >= 40) */
const SCORE_RANGES = ['40-49', '50-59', '60-69', '70-79', '80-100'];

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

@Injectable()
export class ExamReportService {
  constructor(private readonly dataSource: DataSource) {}

  async getSummary(query: ExamReportQueryDto): Promise<ExamReportSummary> {
    const metricByYear = await this.getMetricByYear(query);
    const avgByYear = await this.getAvgScoreByYear(query);
    const bucketByYear = await this.getScoreBucketByYear(query);
    const rounds = await this.getRounds(query);

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

    return {
      stats,
      attendanceByYear,
      registrationTrend,
      rounds,
      scoreSummaryByYear,
    };
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
      const round = row.round ? `${row.round}/${yearLabel}` : `${yearLabel}`;

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
}
