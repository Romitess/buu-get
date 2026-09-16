import { describe, expect, it } from 'vitest';
import { ROLES } from 'src/constants/roles';
import {
  canAccessRoomCheckInPage,
  isRoomCheckInRoute,
} from 'src/utils/room-check-in-access';

describe('room-check-in-access', () => {
  it('blocks administrators from the room check-in page', () => {
    expect(canAccessRoomCheckInPage(ROLES.ADMIN)).toBe(false);
    expect(canAccessRoomCheckInPage(ROLES.SUPER_ADMIN)).toBe(false);
  });

  it('allows operational roles to open room check-in', () => {
    expect(canAccessRoomCheckInPage(ROLES.PROCTOR)).toBe(true);
    expect(canAccessRoomCheckInPage(ROLES.STAFF)).toBe(true);
    expect(canAccessRoomCheckInPage(ROLES.REGISTRATION_OFFICER)).toBe(true);
    expect(canAccessRoomCheckInPage(ROLES.EXAM_OPERATIONS_OFFICER)).toBe(true);
  });

  it('identifies room check-in routes', () => {
    expect(isRoomCheckInRoute('admin-check-in-rooms')).toBe(true);
    expect(isRoomCheckInRoute('admin-room-check-in-scanner')).toBe(true);
    expect(isRoomCheckInRoute('admin-exam-management')).toBe(false);
  });
});
