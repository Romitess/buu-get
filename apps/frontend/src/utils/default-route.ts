import { ROLES } from 'src/constants/roles';
import type { UserRole } from 'src/types/user';

export interface DefaultRouteLocation {
  name: string;
}

export const getDefaultRouteForRole = (role: UserRole | null | undefined): DefaultRouteLocation => {
  if (role === ROLES.CANDIDATE) {
    return { name: 'exam-schedule' };
  }

  if (
    role === ROLES.ADMIN ||
    role === ROLES.STAFF ||
    role === ROLES.REGISTRATION_OFFICER ||
    role === ROLES.EXAM_OPERATIONS_OFFICER
  ) {
    return { name: 'admin-exam-management' };
  }

  if (role === ROLES.FINANCE) {
    return { name: 'admin-payment-import' };
  }

  if (role === ROLES.PROCTOR) {
    return { name: 'admin-check-in-rooms' };
  }

  return { name: 'admin-dashboard' };
};
