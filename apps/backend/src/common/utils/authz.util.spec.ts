import { ForbiddenException } from '@nestjs/common';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { ENROLLMENT_ADMIN_ROLES } from '../constants/role-groups';
import {
  assertSelfOrRoles,
  getEffectiveRoles,
  requirePersonId,
  requireUserId,
  resolveActiveRole,
  userHasAnyRole,
  type AuthenticatedUser,
} from './authz.util';

describe('authz.util', () => {
  const superAdminUser: AuthenticatedUser = {
    actorType: 'user',
    userId: 1,
    email: 'super@buu.ac.th',
    role: RoleEnum.SUPER_ADMIN,
    roles: [RoleEnum.SUPER_ADMIN],
  };

  const adminUser: AuthenticatedUser = {
    actorType: 'user',
    userId: 2,
    email: 'admin@buu.ac.th',
    role: RoleEnum.ADMIN,
    roles: [RoleEnum.ADMIN],
  };

  const candidateUser: AuthenticatedUser = {
    actorType: 'user',
    userId: 3,
    email: 'candidate@buu.ac.th',
    role: RoleEnum.CANDIDATE,
    roles: [RoleEnum.CANDIDATE],
  };

  describe('resolveActiveRole', () => {
    it('returns active role for super_admin with valid header', () => {
      expect(
        resolveActiveRole(superAdminUser, RoleEnum.REGISTRATION_OFFICER),
      ).toBe(RoleEnum.REGISTRATION_OFFICER);
    });

    it('returns active role for admin with valid header', () => {
      expect(
        resolveActiveRole(adminUser, RoleEnum.EXAM_OPERATIONS_OFFICER),
      ).toBe(RoleEnum.EXAM_OPERATIONS_OFFICER);
    });

    it('allows admin to switch back to admin view', () => {
      expect(resolveActiveRole(adminUser, RoleEnum.ADMIN)).toBe(RoleEnum.ADMIN);
    });

    it('ignores header for non-privileged users', () => {
      expect(
        resolveActiveRole(candidateUser, RoleEnum.REGISTRATION_OFFICER),
      ).toBeUndefined();
    });

    it('ignores invalid header for super_admin', () => {
      expect(resolveActiveRole(superAdminUser, 'invalid_role')).toBeUndefined();
    });

    it('ignores super_admin in switch list for admin user', () => {
      expect(resolveActiveRole(adminUser, RoleEnum.FINANCE)).toBeUndefined();
    });

    it('allows admin to switch to roles they actually hold outside the preview catalog', () => {
      const user: AuthenticatedUser = {
        ...adminUser,
        roles: [RoleEnum.ADMIN, RoleEnum.FINANCE, RoleEnum.PROCTOR],
      };
      expect(resolveActiveRole(user, RoleEnum.FINANCE)).toBe(RoleEnum.FINANCE);
      expect(resolveActiveRole(user, RoleEnum.PROCTOR)).toBe(RoleEnum.PROCTOR);
    });

    it('allows super_admin to switch back to their own role', () => {
      expect(resolveActiveRole(superAdminUser, RoleEnum.SUPER_ADMIN)).toBe(
        RoleEnum.SUPER_ADMIN,
      );
    });
  });

  describe('getEffectiveRoles', () => {
    it('merges active role into real JWT roles', () => {
      const user: AuthenticatedUser = {
        ...superAdminUser,
        activeRole: RoleEnum.REGISTRATION_OFFICER,
      };
      expect(getEffectiveRoles(user)).toEqual([
        RoleEnum.SUPER_ADMIN,
        RoleEnum.REGISTRATION_OFFICER,
      ]);
    });
  });

  describe('userHasAnyRole', () => {
    it('allows super_admin acting as registration_officer for staff roles', () => {
      const user: AuthenticatedUser = {
        ...superAdminUser,
        activeRole: RoleEnum.REGISTRATION_OFFICER,
      };
      expect(userHasAnyRole(user, ENROLLMENT_ADMIN_ROLES)).toBe(true);
    });

    it('denies super_admin acting as candidate for staff-only roles', () => {
      const user: AuthenticatedUser = {
        ...superAdminUser,
        activeRole: RoleEnum.CANDIDATE,
      };
      expect(userHasAnyRole(user, ENROLLMENT_ADMIN_ROLES)).toBe(false);
    });
  });

  describe('assertSelfOrRoles', () => {
    it('allows self access regardless of active role', () => {
      const user: AuthenticatedUser = {
        ...superAdminUser,
        activeRole: RoleEnum.CANDIDATE,
      };
      expect(() =>
        assertSelfOrRoles(user, user.userId!, ENROLLMENT_ADMIN_ROLES),
      ).not.toThrow();
    });

    it('throws when active role lacks permission and not self', () => {
      const user: AuthenticatedUser = {
        ...superAdminUser,
        activeRole: RoleEnum.CANDIDATE,
      };
      expect(() =>
        assertSelfOrRoles(user, 999, ENROLLMENT_ADMIN_ROLES),
      ).toThrow(ForbiddenException);
    });
  });

  describe('requireUserId', () => {
    it('returns numeric userId for candidate/user tokens', () => {
      expect(requireUserId(candidateUser)).toBe(3);
    });

    it('throws when person token has no userId', () => {
      const person: AuthenticatedUser = {
        actorType: 'person',
        personId: 'DEMOSTAFF2',
        email: 'staff02@go.buu.ac.th',
        role: RoleEnum.STAFF,
        roles: [RoleEnum.STAFF],
      };
      expect(() => requireUserId(person)).toThrow(ForbiddenException);
    });
  });

  describe('requirePersonId', () => {
    it('returns PSN_ID for person tokens', () => {
      const person: AuthenticatedUser = {
        actorType: 'person',
        personId: 'DEMOSTAFF2',
        email: 'staff02@go.buu.ac.th',
        role: RoleEnum.STAFF,
        roles: [RoleEnum.STAFF],
      };
      expect(requirePersonId(person)).toBe('DEMOSTAFF2');
    });

    it('throws when user token has no personId', () => {
      expect(() => requirePersonId(candidateUser)).toThrow(ForbiddenException);
    });
  });
});
