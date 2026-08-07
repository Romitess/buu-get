import { describe, expect, it } from 'vitest';
import { buildCertificateScoreLines } from './use-score-rubric-helpers';

describe('buildCertificateScoreLines', () => {
  it('maps LINES when present', () => {
    const lines = buildCertificateScoreLines({
      LINES: [
        {
          SCL_NAME_TH: 'อ่าน',
          SCL_NAME_EN: 'Reading',
          SCL_MAX_SCORE: 50,
          SCL_SORT_ORDER: 2,
          SCL_SCORE: 40,
        },
        {
          SCL_NAME_TH: 'คำศัพท์',
          SCL_NAME_EN: 'Vocabulary & Grammar',
          SCL_MAX_SCORE: 50,
          SCL_SORT_ORDER: 1,
          SCL_SCORE: 35,
        },
      ],
      SC_LANG_USE_SCORE: 0,
      SC_READING_SCORE: 0,
    });

    expect(lines).toEqual([
      {
        nameTh: 'คำศัพท์',
        nameEn: 'Vocabulary & Grammar',
        score: 35,
        maxScore: 50,
        sortOrder: 1,
      },
      {
        nameTh: 'อ่าน',
        nameEn: 'Reading',
        score: 40,
        maxScore: 50,
        sortOrder: 2,
      },
    ]);
  });

  it('falls back to SC_* columns when LINES are absent', () => {
    const lines = buildCertificateScoreLines({
      SC_LANG_USE_SCORE: 42,
      SC_READING_SCORE: 38,
    });

    expect(lines).toEqual([
      {
        nameTh: 'คำศัพท์และไวยากรณ์',
        nameEn: 'Vocabulary & Grammar',
        score: 42,
        maxScore: 50,
        sortOrder: 1,
      },
      {
        nameTh: 'ทักษะการอ่าน',
        nameEn: 'Reading',
        score: 38,
        maxScore: 50,
        sortOrder: 2,
      },
    ]);
  });

  it('coerces missing SC_* fields to zero (slim history payload)', () => {
    const lines = buildCertificateScoreLines({});

    expect(lines.map((line) => line.score)).toEqual([0, 0]);
  });
});
