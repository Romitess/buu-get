import {
  buildExamStartDateTime,
  evaluateRegistrationWindow,
} from './exam-registration-window.util';

describe('buildExamStartDateTime', () => {
  it('builds Bangkok instant from date and time', () => {
    const start = buildExamStartDateTime('2026-07-23', '09:00:00');
    expect(start?.toISOString()).toBe('2026-07-23T02:00:00.000Z');
  });

  it('parses time with fractional seconds from MySQL TIME', () => {
    const start = buildExamStartDateTime('2026-07-23', '14:30:00.000000');
    expect(start?.toISOString()).toBe('2026-07-23T07:30:00.000Z');
  });

  it('returns null when date or time is missing', () => {
    expect(buildExamStartDateTime(null, '09:00:00')).toBeNull();
    expect(buildExamStartDateTime('2026-07-23', null)).toBeNull();
  });
});

describe('evaluateRegistrationWindow', () => {
  const base = {
    regStart: '2026-07-01T00:00:00+07:00',
    regEnd: '2026-07-23',
    examDate: '2026-07-23',
    startTime: '09:00:00',
  };

  it('is open before exam start within registration window', () => {
    expect(
      evaluateRegistrationWindow({
        ...base,
        now: new Date('2026-07-23T01:59:00.000Z'),
      }),
    ).toBe('open');
  });

  it('returns exam_started at session start', () => {
    expect(
      evaluateRegistrationWindow({
        ...base,
        now: new Date('2026-07-23T02:00:00.000Z'),
      }),
    ).toBe('exam_started');
  });

  it('returns not_open before registration start', () => {
    expect(
      evaluateRegistrationWindow({
        ...base,
        now: new Date('2026-06-30T16:00:00.000Z'), // 23:00 +07 on June 30
      }),
    ).toBe('not_open');
  });

  it('returns closed after registration end of day', () => {
    expect(
      evaluateRegistrationWindow({
        ...base,
        examDate: '2026-07-25',
        startTime: '09:00:00',
        now: new Date('2026-07-23T17:00:00.000Z'), // after 23:59:59+07
      }),
    ).toBe('closed');
  });

  it('returns invalid when exam start cannot be built', () => {
    expect(
      evaluateRegistrationWindow({
        ...base,
        startTime: null,
        now: new Date('2026-07-22T00:00:00.000Z'),
      }),
    ).toBe('invalid');
  });

  it('evaluates each session start independently', () => {
    const now = new Date('2026-07-23T03:00:00.000Z'); // 10:00 +07
    expect(
      evaluateRegistrationWindow({
        ...base,
        startTime: '09:00:00',
        now,
      }),
    ).toBe('exam_started');
    expect(
      evaluateRegistrationWindow({
        ...base,
        startTime: '14:00:00',
        now,
      }),
    ).toBe('open');
  });
});
