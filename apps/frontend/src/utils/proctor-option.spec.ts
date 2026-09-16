import { describe, expect, it } from 'vitest';
import {
  formatMsgPersonName,
  mergeProctorOptions,
  resolveProctorSavePayload,
  toProctorOption,
} from 'src/utils/proctor-option';
import type { MsgPerson } from 'src/types/msg-person';

const person = (overrides: Partial<MsgPerson> = {}): MsgPerson => ({
  PSN_ID: 'STAFF00001',
  PRF_NAMETH: 'นาย',
  PRF_NAMEEN: null,
  PSN_FNAMETH: 'สมชาย',
  PSN_FNAMEEN: null,
  PSN_LNAMETH: 'ใจดี',
  PSN_LNAMEEN: null,
  PSN_EMAIL_BUU: 'somchai@buu.ac.th',
  PSN_IDCARD: '1100700000001',
  PSN_RETIRE: 'N',
  PSN_TECHNIQUE: null,
  PSN_USERNAME: 'somchai',
  ...overrides,
});

describe('proctor-option', () => {
  it('formats Thai title and name', () => {
    expect(formatMsgPersonName(person())).toBe('นาย สมชาย ใจดี');
  });

  it('maps a person to a searchable option without showing the national id', () => {
    const option = toProctorOption(person());
    expect(option).toEqual({
      label: 'นาย สมชาย ใจดี',
      value: 'STAFF00001',
      psnId: 'STAFF00001',
      caption: 'somchai@buu.ac.th',
    });
    expect(JSON.stringify(option)).not.toContain('1100700000001');
  });

  it('splits selected PSN_IDs from free-typed names when saving', () => {
    const options = [toProctorOption(person())];
    expect(resolveProctorSavePayload(['STAFF00001', 'อ.วิชัย'], options)).toEqual({
      labels: ['นาย สมชาย ใจดี', 'อ.วิชัย'],
      psnIds: ['STAFF00001'],
    });
  });

  it('keeps previously selected options when merging search results', () => {
    const selected = toProctorOption(person());
    const incoming = toProctorOption(person({ PSN_ID: 'STAFF00002', PSN_FNAMETH: 'สมหญิง' }));
    const merged = mergeProctorOptions([selected], [incoming]);
    expect(merged.map((option) => option.psnId)).toEqual(['STAFF00001', 'STAFF00002']);
  });
});
