export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  FINANCE: 'finance',
  EXECUTIVE: 'executive',
  CANDIDATE: 'candidate',
  PROCTOR: 'proctor',
  REGISTRATION_OFFICER: 'registration_officer',
} as const;

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'System Administrator',
  [ROLES.STAFF]: 'Exam Operations Officer',
  [ROLES.FINANCE]: 'Finance Officer',
  [ROLES.EXECUTIVE]: 'Executive',
  [ROLES.CANDIDATE]: 'Candidate',
  [ROLES.PROCTOR]: 'Exam Proctor',
  [ROLES.REGISTRATION_OFFICER]: 'Registration Officer',
} as const;

export type RolesType = typeof ROLES;
