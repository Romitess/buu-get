import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);

  const createContext = (user: {
    userId: number;
    email: string;
    role: RoleEnum;
    roles?: RoleEnum[];
  }) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
});
