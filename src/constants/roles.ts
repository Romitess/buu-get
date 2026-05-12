export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  FINANCE: 'finance',
  EXECUTIVE: 'executive',
  CANDIDATE: 'candidate',
} as const;

export type RolesType = typeof ROLES;
