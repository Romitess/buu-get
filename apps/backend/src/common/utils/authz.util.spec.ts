import { ForbiddenException } from '@nestjs/common';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { ENROLLMENT_ADMIN_ROLES } from '../constants/role-groups';
import {
  assertSelfOrRoles,
  getEffectiveRoles,
  resolveActiveRole,
  userHasAnyRole,
  type AuthenticatedUser,
} from './authz.util';

describe('authz.util', () => {
  const superAdminUser: AuthenticatedUser = {
    userId: 1,
    email: 'super@buu.ac.th',
    role: RoleEnum.SUPER_ADMIN,
    roles: [RoleEnum.SUPER_ADMIN],
  };

  const adminUser: AuthenticatedUser = {
    userId: 2,
    email: 'admin@buu.ac.th',
    role: RoleEnum.ADMIN,
    roles: [RoleEnum.ADMIN],
  };

  const candidateUser: AuthenticatedUser = {
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
        assertSelfOrRoles(user, user.userId, ENROLLMENT_ADMIN_ROLES),
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
});
