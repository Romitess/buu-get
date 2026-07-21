import { doExamTimeRangesOverlap } from './exam-schedule.util';

describe('doExamTimeRangesOverlap', () => {
  it('returns true when ranges overlap partially', () => {
    expect(
      doExamTimeRangesOverlap('08:00:00', '10:00:00', '09:00:00', '11:00:00'),
    ).toBe(true);
  });

  it('returns false when ranges are adjacent but not overlapping', () => {
    expect(
      doExamTimeRangesOverlap('08:00:00', '10:00:00', '10:00:00', '12:00:00'),
    ).toBe(false);
  });

  it('returns false when ranges are completely separate', () => {
    expect(
      doExamTimeRangesOverlap('08:00:00', '09:00:00', '10:00:00', '11:00:00'),
    ).toBe(false);
  });

  it('returns false when any time is missing', () => {
    expect(
      doExamTimeRangesOverlap('08:00:00', null, '09:00:00', '11:00:00'),
    ).toBe(false);
  });
});
