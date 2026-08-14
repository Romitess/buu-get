import { api } from 'src/boot/axios';
import type {
  ExamReportFilter,
  ExamReportOptions,
  ExamReportStatCard,
  ExamReportSummary,
  ExamReportRoundRow,
  ExamYearTableRow,
  ExamInformationRoundRow,
  ExamCandidateInfoRow,
} from 'src/types/exam-report.types';
import type { PaginationMeta } from 'src/types/pagination';

// ============================================================
// Exam Report Service — เชื่อม backend จริง (/exam-report)
// backend คืนตัวเลขดิบ; ส่วน icon/สี/format จัดการที่ frontend
// ============================================================

/** โครงสร้าง response ดิบจาก backend */
interface BackendStat {
  value: number;
  previousValue: number;
  changePercent: number;
}
interface BackendRateStat extends BackendStat {
  rate: number;
}
interface BackendScoreStat extends BackendStat {
  trend: number[];
}
interface BackendExamReportSummary {
  stats: {
    applicants: BackendStat;
    attended: BackendRateStat;
    absent: BackendRateStat;
    averageScore: BackendScoreStat;
  };
  attendanceByYear: { year: number; attended: number; absent: number }[];
  registrationTrend: { year: number; registered: number }[];
  rounds: {
    round: string;
    examDate: string;
    registered: number | null;
    attended: number | null;
    absent: number | null;
  }[];
  scoreSummaryByYear: {
    ranges: string[];
    rows: { year: number; counts: number[] }[];
  };
  attemptProportion: {
    firstTime: number;
    repeat: number;
  };
  yearTable: ExamYearTableRow[];
}

interface BackendExamInformationRound {
  round: string;
  applicants: number;
  attended: number;
  absent: number;
  repeatTakers: number;
  minScore: number | null;
  maxScore: number | null;
  averageScore: number | null;
}

interface BackendExamCandidateInfo {
  id: string;
  examNumber: string;
  prefix: string;
  fullName: string;
  vocabularyGrammarScore: number | null;
  readingScore: number | null;
  totalScore: number | null;
  level: string | null;
  attemptStatus: ExamCandidateInfoRow['attemptStatus'];
  scoreLines?: ExamCandidateInfoRow['scoreLines'];
}

/** ตัวแปร CSS สีของแต่ละช่วงคะแนน (เรียงตาม ranges จาก backend) */
const SCORE_RANGE_COLOR_VARS = [
  '--exam-report-score-40',
  '--exam-report-score-50',
  '--exam-report-score-60',
  '--exam-report-score-70',
  '--exam-report-score-80',
];

const formatThaiDate = (iso: string): string => {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const numberText = (value: number): string => value.toLocaleString('en-US');

/** map response backend → โครงสร้างที่ component ใช้ */
const mapSummary = (data: BackendExamReportSummary): ExamReportSummary => {
  const { stats } = data;

  const statCards: ExamReportStatCard[] = [
    {
      key: 'applicant',
      icon: 'people',
      iconColorVar: '--exam-report-stat-applicant',
      iconBgVar: '--exam-report-stat-applicant-bg',
      label: 'จำนวนผู้สมัคร',
      value: stats.applicants.value,
      unit: 'คน',
      trend: stats.applicants.changePercent >= 0 ? 'up' : 'down',
      changePercent: Math.abs(stats.applicants.changePercent),
      comparePrevious: `จากปีที่แล้ว (${numberText(stats.applicants.previousValue)} คน)`,
      visual: 'none',
    },
    {
      key: 'attended',
      icon: 'check_circle',
      iconColorVar: '--exam-report-stat-attended',
      iconBgVar: '--exam-report-stat-attended-bg',
      label: 'ผู้เข้าสอบ',
      value: stats.attended.value,
      unit: 'คน',
      trend: stats.attended.changePercent >= 0 ? 'up' : 'down',
      changePercent: Math.abs(stats.attended.changePercent),
      comparePrevious: `จากปีที่แล้ว (${numberText(stats.attended.previousValue)} คน)`,
      visual: 'donut',
      donutPercent: stats.attended.rate,
      donutCaption: 'อัตราการเข้าสอบ',
    },
    {
      key: 'absent',
      icon: 'block',
      iconColorVar: '--exam-report-stat-absent',
      iconBgVar: '--exam-report-stat-absent-bg',
      label: 'ขาดสอบ',
      value: stats.absent.value,
      unit: 'คน',
      trend: stats.absent.changePercent >= 0 ? 'up' : 'down',
      changePercent: Math.abs(stats.absent.changePercent),
      comparePrevious: `จากปีที่แล้ว (${numberText(stats.absent.previousValue)} คน)`,
      visual: 'donut',
      donutPercent: stats.absent.rate,
      donutCaption: 'อัตราการขาดสอบ',
    },
    {
      key: 'averageScore',
      icon: 'bar_chart',
      iconColorVar: '--exam-report-stat-score',
      iconBgVar: '--exam-report-stat-score-bg',
      label: 'คะแนนเฉลี่ย',
      value: stats.averageScore.value,
      unit: 'คะแนน',
      trend: stats.averageScore.changePercent >= 0 ? 'up' : 'down',
      changePercent: Math.abs(stats.averageScore.changePercent),
      comparePrevious: `จากปีที่แล้ว (${numberText(stats.averageScore.previousValue)} คะแนน)`,
      visual: 'sparkline',
      sparkline: stats.averageScore.trend,
    },
  ];

  const rounds: ExamReportRoundRow[] = data.rounds.map((r) => ({
    round: r.round,
    date: formatThaiDate(r.examDate),
    registered: r.registered,
    attended: r.attended,
    absent: r.absent,
  }));

  return {
    statCards,
    attendanceChart: {
      categories: data.attendanceByYear.map((a) => String(a.year)),
      attended: data.attendanceByYear.map((a) => a.attended),
      absent: data.attendanceByYear.map((a) => a.absent),
    },
    trendChart: {
      categories: data.registrationTrend.map((t) => String(t.year)),
      registered: data.registrationTrend.map((t) => t.registered),
    },
    rounds,
    scoreSummaryChart: {
      years: data.scoreSummaryByYear.rows.map((row) => String(row.year)),
      series: data.scoreSummaryByYear.ranges.map((range, i) => ({
        name: range,
        colorVar: SCORE_RANGE_COLOR_VARS[i] ?? '--exam-report-score-40',
        data: data.scoreSummaryByYear.rows.map((row) => row.counts[i] ?? 0),
      })),
    },
    attemptProportion: data.attemptProportion,
    yearTable: data.yearTable,
  };
};

/** ลบค่าว่างออกจาก query params ก่อนส่ง */
const cleanParams = (filter: ExamReportFilter): Record<string, string> =>
  Object.fromEntries(
    Object.entries(filter).filter(([, v]) => v !== '' && v !== null && v !== undefined),
  );

/** ดึงข้อมูลสรุปทั้งหน้ารายงานการสอบ */
export const fetchExamReportSummary = async (
  filter: ExamReportFilter,
): Promise<ExamReportSummary> => {
  const response = await api.get<BackendExamReportSummary>('/exam-report/summary', {
    params: cleanParams(filter),
  });
  return mapSummary(response.data);
};

/** ดึงตัวเลือกฟิลเตอร์ทั้งหมด (ปี/เดือน/รอบ) */
export const fetchExamReportOptions = async (): Promise<ExamReportOptions> => {
  const response = await api.get<ExamReportOptions>('/exam-report/options');
  return response.data;
};

export interface ExamReportScoreMeta extends PaginationMeta {
  minScore: number | null;
  maxScore: number | null;
  averageScore: number | null;
}

export interface ExamInformationRoundsPage {
  data: ExamInformationRoundRow[];
  total: number;
  minScore: number | null;
  maxScore: number | null;
  averageScore: number | null;
}

export interface ExamCandidateInfoPage {
  data: ExamCandidateInfoRow[];
  total: number;
  minScore: number | null;
  maxScore: number | null;
  averageScore: number | null;
}

const mapRoundRow = (row: BackendExamInformationRound): ExamInformationRoundRow => ({
  round: row.round,
  applicants: Number(row.applicants),
  attended: Number(row.attended),
  absent: Number(row.absent),
  repeatTakers: Number(row.repeatTakers),
  minScore: row.minScore === null ? null : Number(row.minScore),
  maxScore: row.maxScore === null ? null : Number(row.maxScore),
  averageScore: row.averageScore === null ? null : Number(row.averageScore),
});

const mapCandidateRow = (row: BackendExamCandidateInfo): ExamCandidateInfoRow => ({
  id: row.id,
  examNumber: row.examNumber,
  prefix: row.prefix,
  fullName: row.fullName,
  vocabularyGrammarScore:
    row.vocabularyGrammarScore === null ? null : Number(row.vocabularyGrammarScore),
  readingScore: row.readingScore === null ? null : Number(row.readingScore),
  totalScore: row.totalScore === null ? null : Number(row.totalScore),
  level: row.level === null ? null : String(row.level),
  attemptStatus: row.attemptStatus,
  ...(row.scoreLines
    ? {
        scoreLines: row.scoreLines.map((line) => ({
          ...line,
          score: line.score === null ? null : Number(line.score),
          maxScore: Number(line.maxScore),
          sortOrder: Number(line.sortOrder),
        })),
      }
    : {}),
});

const readScoreMeta = (
  meta: ExamReportScoreMeta | undefined,
): Pick<ExamReportScoreMeta, 'minScore' | 'maxScore' | 'averageScore' | 'total'> => ({
  total: meta?.total ?? 0,
  minScore: meta?.minScore ?? null,
  maxScore: meta?.maxScore ?? null,
  averageScore: meta?.averageScore ?? null,
});

export const fetchExamInformationRounds = async (
  year: string | number,
  params?: { page?: number; limit?: number; search?: string; signal?: AbortSignal },
): Promise<ExamInformationRoundsPage> => {
  const requestConfig: {
    params: Record<string, number | string>;
    signal?: AbortSignal;
  } = {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      ...(params?.search?.trim() ? { search: params.search.trim() } : {}),
    },
  };
  if (params?.signal) {
    requestConfig.signal = params.signal;
  }

  const response = await api.get<{ data: BackendExamInformationRound[]; meta: ExamReportScoreMeta }>(
    `/exam-report/years/${year}/rounds`,
    requestConfig,
  );

  const body = response.data;
  const scores = readScoreMeta(body.meta);
  return {
    data: (body.data ?? []).map(mapRoundRow),
    total: scores.total,
    minScore: scores.minScore,
    maxScore: scores.maxScore,
    averageScore: scores.averageScore,
  };
};

export const fetchExamCandidateInfo = async (
  year: string | number,
  options?: {
    round?: string;
    page?: number;
    limit?: number;
    search?: string;
    signal?: AbortSignal;
  },
): Promise<ExamCandidateInfoPage> => {
  const requestConfig: {
    params: Record<string, number | string>;
    signal?: AbortSignal;
  } = {
    params: {
      page: options?.page ?? 1,
      limit: options?.limit ?? 10,
      ...(options?.search?.trim() ? { search: options.search.trim() } : {}),
      ...(options?.round ? { round: options.round } : {}),
    },
  };
  if (options?.signal) {
    requestConfig.signal = options.signal;
  }

  const response = await api.get<{ data: BackendExamCandidateInfo[]; meta: ExamReportScoreMeta }>(
    `/exam-report/years/${year}/candidates`,
    requestConfig,
  );

  const body = response.data;
  const scores = readScoreMeta(body.meta);
  return {
    data: (body.data ?? []).map(mapCandidateRow),
    total: scores.total,
    minScore: scores.minScore,
    maxScore: scores.maxScore,
    averageScore: scores.averageScore,
  };
};
