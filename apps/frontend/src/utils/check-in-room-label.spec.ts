import { describe, expect, it } from 'vitest';
import { buildExamRoomDisplay, normalizeExamRoomNo } from 'src/utils/check-in-room-label';

describe('normalizeExamRoomNo', () => {
  it('strips a duplicated Thai room prefix', () => {
    expect(normalizeExamRoomNo('ห้อง111')).toBe('111');
    expect(normalizeExamRoomNo('ห้อง 111')).toBe('111');
  });

  it('strips an English room prefix', () => {
    expect(normalizeExamRoomNo('Room A1')).toBe('A1');
  });

  it('keeps a room number without a prefix', () => {
    expect(normalizeExamRoomNo('111')).toBe('111');
  });

  it('returns empty for missing values', () => {
    expect(normalizeExamRoomNo(null)).toBe('');
    expect(normalizeExamRoomNo(undefined)).toBe('');
    expect(normalizeExamRoomNo('')).toBe('');
  });
});

describe('buildExamRoomDisplay', () => {
  const formatRoom = (roomNo: string): string => `ห้อง ${roomNo}`;
  const formatFloor = (floor: number): string => `ชั้น ${floor}`;

  it('puts the room number first and building second', () => {
    expect(
      buildExamRoomDisplay(
        { locationName: 'สำนักคอม', roomNo: 'ห้อง111', floorNo: 1 },
        formatRoom,
        formatFloor,
      ),
    ).toEqual({
      title: 'ห้อง 111',
      subtitle: 'สำนักคอม · ชั้น 1',
    });
  });

  it('falls back to the building name when room number is missing', () => {
    expect(
      buildExamRoomDisplay(
        { locationName: 'สำนักคอม', roomNo: null, floorNo: 2 },
        formatRoom,
        formatFloor,
      ),
    ).toEqual({
      title: 'สำนักคอม',
      subtitle: 'ชั้น 2',
    });
  });
});
