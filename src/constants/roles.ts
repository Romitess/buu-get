export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  FINANCE: 'finance',
  EXECUTIVE: 'executive',
  CANDIDATE: 'candidate',
  PROCTOR: 'proctor',
} as const;

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'System Administrator',
  [ROLES.STAFF]: 'Exam Opening Officer',
  [ROLES.FINANCE]: 'Finance Officer',
  [ROLES.EXECUTIVE]: 'Executive',
  [ROLES.CANDIDATE]: 'Candidate',
  [ROLES.PROCTOR]: 'Exam Proctor',
} as const;

export type RolesType = typeof ROLES;
