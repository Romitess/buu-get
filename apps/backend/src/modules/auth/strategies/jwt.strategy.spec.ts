import { ConfigService } from '@nestjs/config';
import { RoleEnum } from '../../roles/enums/role.enum';
import { JwtPayload, JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-jwt-secret'),
    } as unknown as ConfigService;

    strategy = new JwtStrategy(configService);
  });

  describe('validate', () => {
    // AUTH-U-031
    it('should map payload fields including roles array', () => {
      // Arrange
      const payload: JwtPayload = {
        sub: 42,
        email: 'user@example.com',
        role: RoleEnum.STAFF,
        roles: [RoleEnum.STAFF, RoleEnum.ADMIN],
      };

      // Act
      const result = strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: 42,
        email: 'user@example.com',
        role: RoleEnum.STAFF,
        roles: [RoleEnum.STAFF, RoleEnum.ADMIN],
      });
    });

    // AUTH-U-032
    it('should fallback roles to [role] for legacy tokens without roles', () => {
      // Arrange
      const payload: JwtPayload = {
        sub: 7,
        email: 'legacy@example.com',
        role: RoleEnum.CANDIDATE,
      };

      // Act
      const result = strategy.validate(payload);

      // Assert
      expect(result).toEqual({
        userId: 7,
        email: 'legacy@example.com',
        role: RoleEnum.CANDIDATE,
        roles: [RoleEnum.CANDIDATE],
      });
    });
  });
});
