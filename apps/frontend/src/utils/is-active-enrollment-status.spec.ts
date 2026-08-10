import { describe, expect, it } from 'vitest';
import { ENROLLMENT_STATUS } from 'src/constants/exam';
import { isActiveEnrollmentStatus } from './is-active-enrollment-status';

describe('isActiveEnrollmentStatus', () => {
  it('treats unpaid/paid/seat statuses as active', () => {
    expect(isActiveEnrollmentStatus(ENROLLMENT_STATUS.UNPAID)).toBe(true);
    expect(isActiveEnrollmentStatus(ENROLLMENT_STATUS.PAID)).toBe(true);
    expect(isActiveEnrollmentStatus(ENROLLMENT_STATUS.SEAT_ASSIGNED)).toBe(true);
    expect(isActiveEnrollmentStatus(ENROLLMENT_STATUS.SEAT_PUBLISHED)).toBe(true);
  });

  it('treats cancelled and attended as inactive for re-registration', () => {
    expect(isActiveEnrollmentStatus(ENROLLMENT_STATUS.CANCELLED)).toBe(false);
    expect(isActiveEnrollmentStatus(ENROLLMENT_STATUS.ATTENDED)).toBe(false);
  });

  it('coerces string statuses from API', () => {
    expect(isActiveEnrollmentStatus('0')).toBe(true);
    expect(isActiveEnrollmentStatus('5')).toBe(false);
    expect(isActiveEnrollmentStatus('1')).toBe(true);
  });

  it('rejects null/undefined/NaN', () => {
    expect(isActiveEnrollmentStatus(null)).toBe(false);
    expect(isActiveEnrollmentStatus(undefined)).toBe(false);
    expect(isActiveEnrollmentStatus('x')).toBe(false);
  });
});
