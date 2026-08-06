import {
  buildAttemptMetrics,
  ScoredWindowAttempt,
} from './attempt-metrics.util';

describe('buildAttemptMetrics', () => {
  describe('empty window (RPT-U-001)', () => {
    it('should return empty repeatByYear and zero firstTime/repeat when scoredInWindow is empty', () => {
      // Arrange
      const scoredInWindow: ScoredWindowAttempt[] = [];

      // Act
      const result = buildAttemptMetrics(scoredInWindow);

      // Assert
      expect(result.repeatByYear.size).toBe(0);
      expect(result.attemptProportion).toEqual({ firstTime: 0, repeat: 0 });
    });
  });

  describe('firstTime vs repeat (RPT-U-002)', () => {
    it('should set firstTime to distinct scored users minus distinct repeat users', () => {
      // Arrange — 4 scored rows, 3 distinct users; 2 are repeat
      const scoredInWindow: ScoredWindowAttempt[] = [
        { userId: 1, year: 2025, hasPriorScore: false },
        { userId: 2, year: 2025, hasPriorScore: true },
        { userId: 3, year: 2025, hasPriorScore: false },
        { userId: 2, year: 2026, hasPriorScore: true },
      ];

      // Act
      const result = buildAttemptMetrics(scoredInWindow);

      // Assert
      expect(result.attemptProportion.repeat).toBe(1); // user 2 only
      expect(result.attemptProportion.firstTime).toBe(2); // users 1 and 3
      expect(result.attemptProportion.firstTime).toBe(
        3 - result.attemptProportion.repeat,
      );
    });
  });

  describe('repeatByYear DISTINCT (RPT-U-003)', () => {
    it('should count each repeat user once per year when multiple scored rows share year', () => {
      // Arrange — same user, two scored rows in 2025, both prior
      const scoredInWindow: ScoredWindowAttempt[] = [
        { userId: 10, year: 2025, hasPriorScore: true },
        { userId: 10, year: 2025, hasPriorScore: true },
      ];

      // Act
      const result = buildAttemptMetrics(scoredInWindow);

      // Assert
      expect(result.repeatByYear.get(2025)).toBe(1);
      expect(result.attemptProportion).toEqual({ firstTime: 0, repeat: 1 });
    });
  });

  describe('attemptProportion firstTime = total − repeat (RPT-U-009 util)', () => {
    it('should return { firstTime: 3, repeat: 2 } when total distinct scored is 5 and repeat is 2', () => {
      // Arrange
      const scoredInWindow: ScoredWindowAttempt[] = [
        { userId: 1, year: 2026, hasPriorScore: false },
        { userId: 2, year: 2026, hasPriorScore: false },
        { userId: 3, year: 2026, hasPriorScore: false },
        { userId: 4, year: 2026, hasPriorScore: true },
        { userId: 5, year: 2026, hasPriorScore: true },
      ];

      // Act
      const result = buildAttemptMetrics(scoredInWindow);

      // Assert
      expect(result.attemptProportion).toEqual({ firstTime: 3, repeat: 2 });
    });
  });
});
