import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { ACTIVE_ROLE_HEADER } from '../constants/role-switch.constants';
import { AuthenticatedUser } from '../utils/authz.util';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  const createContext = (
    user: {
      userId?: number;
      email?: string;
      role?: RoleEnum | string;
      roles?: Array<RoleEnum | string>;
      activeRole?: RoleEnum;
    },
    headers: Record<string, string | string[] | undefined> = {},
  ) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user, headers }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ROLES-U-009
  it('allows access when no roles are required', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(
      guard.canActivate(
        createContext({
          userId: 1,
          email: 'a@b.com',
          role: RoleEnum.CANDIDATE,
        }),
      ),
    ).toBe(true);
  });

  // ROLES-U-010
  it('allows access when user has a required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.ADMIN,
    ]);
    expect(
      guard.canActivate(
        createContext({
          userId: 1,
          email: 'admin@b.com',
          role: RoleEnum.ADMIN,
          roles: [RoleEnum.ADMIN],
        }),
      ),
    ).toBe(true);
  });

  // ROLES-U-011
  it('denies access when user lacks required role', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.ADMIN,
    ]);
    expect(() =>
      guard.canActivate(
        createContext({
          userId: 2,
          email: 'user@b.com',
          role: RoleEnum.CANDIDATE,
          roles: [RoleEnum.CANDIDATE],
        }),
      ),
    ).toThrow(ForbiddenException);
  });

  // ROLES-U-012
  it('should throw ForbiddenException when user has no roles assigned', () => {
    // Arrange
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.ADMIN,
    ]);

    // Act / Assert
    expect(() =>
      guard.canActivate(
        createContext({
          userId: 3,
          email: 'norole@b.com',
        }),
      ),
    ).toThrow(ForbiddenException);

    try {
      guard.canActivate(createContext({ userId: 3, email: 'norole@b.com' }));
    } catch (err) {
      expect(err).toBeInstanceOf(ForbiddenException);
      expect((err as ForbiddenException).message).toBe(
        'Access denied: No role assigned',
      );
    }
  });

  // ROLES-U-013
  it('should prefer roles[] over single role when both are present', () => {
    // Arrange — single role is candidate, but roles[] has admin
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.ADMIN,
    ]);

    // Act
    const allowed = guard.canActivate(
      createContext({
        userId: 4,
        email: 'multi@b.com',
        role: RoleEnum.CANDIDATE,
        roles: [RoleEnum.ADMIN],
      }),
    );

    // Assert
    expect(allowed).toBe(true);
  });

  // ROLES-U-013 (negative: empty roles[] falls through to single role)
  it('should fall back to single role when roles[] is empty', () => {
    // Arrange
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.STAFF,
    ]);

    // Act
    const allowed = guard.canActivate(
      createContext({
        userId: 5,
        email: 'empty-roles@b.com',
        role: RoleEnum.STAFF,
        roles: [],
      }),
    );

    // Assert
    expect(allowed).toBe(true);
  });

  // ROLES-U-014
  it('should allow access using fallback single role when roles[] is absent', () => {
    // Arrange
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.FINANCE,
    ]);

    // Act
    const allowed = guard.canActivate(
      createContext({
        userId: 6,
        email: 'legacy@b.com',
        role: RoleEnum.FINANCE,
      }),
    );

    // Assert
    expect(allowed).toBe(true);
  });

  // ROLES-U-015
  it('should normalize role case and hyphen/underscore/space when matching', () => {
    // Arrange
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.REGISTRATION_OFFICER,
    ]);

    // Act
    const allowed = guard.canActivate(
      createContext({
        userId: 7,
        email: 'norm@b.com',
        role: 'Registration-Officer',
      }),
    );

    // Assert — 'Registration-Officer' → registrationofficer matches registration_officer
    expect(allowed).toBe(true);
  });

  // ROLES-U-015
  it('should normalize mixed-case admin role string when matching', () => {
    // Arrange
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.ADMIN,
    ]);

    // Act
    const allowed = guard.canActivate(
      createContext({
        userId: 8,
        email: 'AdminUser@b.com',
        roles: ['Admin'],
      }),
    );

    // Assert
    expect(allowed).toBe(true);
  });

  it('allows super_admin with X-Active-Role acting as registration_officer', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.REGISTRATION_OFFICER,
    ]);

    const user: AuthenticatedUser = {
      userId: 9,
      email: 'super@b.com',
      role: RoleEnum.SUPER_ADMIN,
      roles: [RoleEnum.SUPER_ADMIN],
    };

    const allowed = guard.canActivate(
      createContext(user, {
        [ACTIVE_ROLE_HEADER]: RoleEnum.REGISTRATION_OFFICER,
      }),
    );

    expect(allowed).toBe(true);
    expect(user.activeRole).toBe(RoleEnum.REGISTRATION_OFFICER);
  });

  it('ignores invalid X-Active-Role header but super_admin bypass still passes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.REGISTRATION_OFFICER,
    ]);

    const user: AuthenticatedUser = {
      userId: 10,
      email: 'super@b.com',
      role: RoleEnum.SUPER_ADMIN,
      roles: [RoleEnum.SUPER_ADMIN],
    };

    const allowed = guard.canActivate(
      createContext(user, { [ACTIVE_ROLE_HEADER]: 'not_a_real_role' }),
    );

    expect(allowed).toBe(true);
    expect(user.activeRole).toBeUndefined();
  });

  it('allows admin with valid X-Active-Role for registration_officer routes', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      RoleEnum.REGISTRATION_OFFICER,
    ]);

    const user: AuthenticatedUser = {
      userId: 11,
      email: 'admin@b.com',
      role: RoleEnum.ADMIN,
      roles: [RoleEnum.ADMIN],
    };

    const allowed = guard.canActivate(
      createContext(user, {
        [ACTIVE_ROLE_HEADER]: RoleEnum.REGISTRATION_OFFICER,
      }),
    );

    expect(allowed).toBe(true);
    expect(user.activeRole).toBe(RoleEnum.REGISTRATION_OFFICER);
  });
});
