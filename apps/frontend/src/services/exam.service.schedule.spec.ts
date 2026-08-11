import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackendExam, BackendLocation, BackendSession } from 'src/types/exam';
import { formatFee, formatLocationWithRoom } from 'src/constants/exam';

const { apiGet } = vi.hoisted(() => ({
  apiGet: vi.fn(),
}));

vi.mock('src/boot/axios', () => ({
  api: {
    get: apiGet,
  },
}));

import { fetchScheduleData, invalidateExamCache } from './exam.service';

const EXAM_DATE = '2026-08-15';

const makeLocation = (overrides: Partial<BackendLocation> = {}): BackendLocation => ({
  LOCATION_ID: 1,
  LOCATION_NAME: 'อาคารเรียนรวม',
  LOCATION_ROOM_NO: '101',
  ...overrides,
});

const makeSession = (overrides: Partial<BackendSession> = {}): BackendSession => ({
  SS_ID: 1,
  SS_START_TIME: '09:00:00',
  SS_END_TIME: '12:00:00',
  SS_CAPACITY: 20,
  ACTIVE_ENROLLMENT_COUNT: 0,
  ...overrides,
});

const makeExam = (overrides: Partial<BackendExam> = {}): BackendExam => ({
  EXAM_ID: 1,
  EXAM_NAME: 'BUU-GET',
  EXAM_ROUND: '1',
  EXAM_FISCAL_YEAR: '2569',
  EXAM_TYPE: 'ทั่วไป',
  EXAM_FORMAT: 'คอมพิวเตอร์',
  EXAM_FEE: 500,
  EXAM_DATE,
  EXAM_REG_START_DATE: '2026-08-01',
  EXAM_REG_END_DATE: '2026-08-14',
  EXAM_PAY_START_DATE: '2026-08-01',
  EXAM_PAY_END_DATE: '2026-08-14',
  EXAM_PUBLISHED: true,
  FUND_SOURCE_ID: 1,
  SESSIONS: [makeSession()],
  ...overrides,
});

describe('fetchScheduleData same-day exams', () => {
  beforeEach(() => {
    invalidateExamCache();
    vi.clearAllMocks();
  });

  it('includes sessions from all published exams on the same date', async () => {
    // Newest-first order (CREATED_AT DESC) — regression for examId day guard
    apiGet.mockResolvedValue({
      data: [
        makeExam({
          EXAM_ID: 2,
          EXAM_NAME: 'BUU-GET Afternoon',
          EXAM_FEE: 700,
          SESSIONS: [makeSession({ SS_ID: 201, SS_START_TIME: '13:00:00', SS_END_TIME: '16:00:00' })],
        }),
        makeExam({
          EXAM_ID: 1,
          EXAM_NAME: 'BUU-GET Morning',
          EXAM_FEE: 500,
          SESSIONS: [makeSession({ SS_ID: 101, SS_START_TIME: '09:00:00', SS_END_TIME: '12:00:00' })],
        }),
      ],
    });

    const schedule = await fetchScheduleData(true);
    const day = schedule[EXAM_DATE];

    expect(day).toBeDefined();
    expect(day!.rounds).toHaveLength(2);
    expect(day!.rounds.map((r) => r.id).sort((a, b) => a - b)).toEqual([101, 201]);
    expect(day!.rounds.find((r) => r.id === 101)?.examId).toBe(1);
    expect(day!.rounds.find((r) => r.id === 201)?.examId).toBe(2);
    expect(day!.rounds.find((r) => r.id === 101)?.title).toContain('BUU-GET Morning');
    expect(day!.rounds.find((r) => r.id === 201)?.title).toContain('BUU-GET Afternoon');
  });

  it('maps distinct per-round locations for same-day exams', async () => {
    const morningLoc = makeLocation({
      LOCATION_ID: 1,
      LOCATION_NAME: 'อาคาร A',
      LOCATION_ROOM_NO: '101',
    });
    const afternoonLoc = makeLocation({
      LOCATION_ID: 2,
      LOCATION_NAME: 'อาคาร B',
      LOCATION_ROOM_NO: '202',
    });

    apiGet.mockResolvedValue({
      data: [
        makeExam({
          EXAM_ID: 2,
          EXAM_NAME: 'Afternoon',
          SESSIONS: [
            makeSession({
              SS_ID: 201,
              SS_START_TIME: '13:00:00',
              SS_END_TIME: '16:00:00',
              LOCATION: afternoonLoc,
            }),
          ],
        }),
        makeExam({
          EXAM_ID: 1,
          EXAM_NAME: 'Morning',
          SESSIONS: [
            makeSession({
              SS_ID: 101,
              SS_START_TIME: '09:00:00',
              SS_END_TIME: '12:00:00',
              LOCATION: morningLoc,
            }),
          ],
        }),
      ],
    });

    const schedule = await fetchScheduleData(true);
    const rounds = schedule[EXAM_DATE]!.rounds;

    expect(rounds.find((r) => r.id === 101)?.location).toBe(
      formatLocationWithRoom('อาคาร A', '101'),
    );
    expect(rounds.find((r) => r.id === 201)?.location).toBe(
      formatLocationWithRoom('อาคาร B', '202'),
    );
  });

  it('does not merge seats across different exams with the same timeRange', async () => {
    apiGet.mockResolvedValue({
      data: [
        makeExam({
          EXAM_ID: 2,
          EXAM_FEE: 700,
          SESSIONS: [
            makeSession({
              SS_ID: 202,
              SS_CAPACITY: 30,
              ACTIVE_ENROLLMENT_COUNT: 5,
              SS_START_TIME: '09:00:00',
              SS_END_TIME: '12:00:00',
            }),
          ],
        }),
        makeExam({
          EXAM_ID: 1,
          EXAM_FEE: 500,
          SESSIONS: [
            makeSession({
              SS_ID: 101,
              SS_CAPACITY: 20,
              ACTIVE_ENROLLMENT_COUNT: 2,
              SS_START_TIME: '09:00:00',
              SS_END_TIME: '12:00:00',
            }),
          ],
        }),
      ],
    });

    const schedule = await fetchScheduleData(true);
    const rounds = schedule[EXAM_DATE]!.rounds;

    expect(rounds).toHaveLength(2);
    const roundA = rounds.find((r) => r.examId === 1)!;
    const roundB = rounds.find((r) => r.examId === 2)!;
    expect(roundA.timeRange).toBe(roundB.timeRange);
    expect(roundA.availableSeats).toBe(18);
    expect(roundA.totalSeats).toBe(20);
    expect(roundB.availableSeats).toBe(25);
    expect(roundB.totalSeats).toBe(30);
    expect(roundA.fee).toBe(formatFee(500));
    expect(roundB.fee).toBe(formatFee(700));
  });

  it('sums seats and joins unique locations for same exam and timeRange', async () => {
    apiGet.mockResolvedValue({
      data: [
        makeExam({
          EXAM_ID: 1,
          SESSIONS: [
            makeSession({
              SS_ID: 101,
              SS_CAPACITY: 20,
              ACTIVE_ENROLLMENT_COUNT: 0,
              SS_START_TIME: '09:00:00',
              SS_END_TIME: '12:00:00',
              LOCATION: makeLocation({
                LOCATION_ID: 1,
                LOCATION_NAME: 'อาคาร A',
                LOCATION_ROOM_NO: '101',
              }),
            }),
            makeSession({
              SS_ID: 102,
              SS_CAPACITY: 15,
              ACTIVE_ENROLLMENT_COUNT: 3,
              SS_START_TIME: '09:00:00',
              SS_END_TIME: '12:00:00',
              LOCATION: makeLocation({
                LOCATION_ID: 2,
                LOCATION_NAME: 'อาคาร A',
                LOCATION_ROOM_NO: '102',
              }),
            }),
          ],
        }),
      ],
    });

    const schedule = await fetchScheduleData(true);
    const rounds = schedule[EXAM_DATE]!.rounds;

    expect(rounds).toHaveLength(1);
    expect(rounds[0]!.examId).toBe(1);
    expect(rounds[0]!.timeRange).toBe('09:00 - 12:00');
    expect(rounds[0]!.totalSeats).toBe(35);
    expect(rounds[0]!.availableSeats).toBe(32);
    expect(rounds[0]!.location).toBe(
      `${formatLocationWithRoom('อาคาร A', '101')}, ${formatLocationWithRoom('อาคาร A', '102')}`,
    );
  });

  it('still includes a later exam when the first exam already owns the day', async () => {
    apiGet.mockResolvedValue({
      data: [
        makeExam({
          EXAM_ID: 99,
          EXAM_NAME: 'Latest Opening',
          SESSIONS: [makeSession({ SS_ID: 990, SS_START_TIME: '14:00:00', SS_END_TIME: '17:00:00' })],
        }),
        makeExam({
          EXAM_ID: 11,
          EXAM_NAME: 'Earlier Opening',
          SESSIONS: [makeSession({ SS_ID: 110, SS_START_TIME: '08:00:00', SS_END_TIME: '11:00:00' })],
        }),
      ],
    });

    const schedule = await fetchScheduleData(true);
    const day = schedule[EXAM_DATE]!;

    expect(day.examId).toBe(99);
    expect(day.rounds).toHaveLength(2);
    expect(day.rounds.some((r) => r.examId === 11 && r.id === 110)).toBe(true);
    expect(day.rounds.some((r) => r.examId === 99 && r.id === 990)).toBe(true);
  });
});
