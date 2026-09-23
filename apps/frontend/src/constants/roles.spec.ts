import { describe, expect, it } from 'vitest';
import { ROLES, resolveSwitchableRoles } from 'src/constants/roles';

describe('resolveSwitchableRoles', () => {
  it('includes every role an admin actually holds, plus the admin preview catalog', () => {
    expect(
      resolveSwitchableRoles([ROLES.ADMIN, ROLES.FINANCE, ROLES.PROCTOR, ROLES.STAFF]),
    ).toEqual([
      ROLES.ADMIN,
      ROLES.REGISTRATION_OFFICER,
      ROLES.EXAM_OPERATIONS_OFFICER,
      ROLES.STAFF,
      ROLES.FINANCE,
      ROLES.PROCTOR,
    ]);
  });

  it('includes super_admin when that account holds it', () => {
    const roles = resolveSwitchableRoles([ROLES.SUPER_ADMIN, ROLES.EXECUTIVE]);
    expect(roles[0]).toBe(ROLES.SUPER_ADMIN);
    expect(roles).toContain(ROLES.EXECUTIVE);
    expect(roles).toContain(ROLES.PROCTOR);
    expect(roles).toContain(ROLES.CANDIDATE);
  });

  it('returns no switch options when the user is not admin or super_admin', () => {
    expect(resolveSwitchableRoles([ROLES.FINANCE, ROLES.PROCTOR])).toEqual([]);
  });
});
