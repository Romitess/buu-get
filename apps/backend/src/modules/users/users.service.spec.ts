import type { DataSource, Repository } from 'typeorm';

jest.mock('./dto/user-response.dto', () => ({
  UserResponseDto: {
    fromEntity: jest.fn(),
  },
}));

jest.mock('./entities/user.entity', () => ({
  User: class User {},
}));

jest.mock('../roles/entities/role.entity', () => ({
  Role: class Role {},
}));

jest.mock('../user-profile/user-profile.service', () => ({
  UserProfileService: class UserProfileService {},
}));

import { UsersService } from './users.service';
import type { User } from './entities/user.entity';
import type { Role } from '../roles/entities/role.entity';
import type { UserProfileService } from '../user-profile/user-profile.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService(
      {} as Repository<User>,
      {} as Repository<Role>,
      {} as UserProfileService,
      {} as DataSource,
    );
  });

  describe('generateUserCode', () => {
    it('uses the Thai Buddhist year as the two-digit prefix', () => {
      const code = service.generateUserCode(
        1,
        new Date('2026-01-01T00:00:00+07:00'),
      );

      expect(code).toBe('69000001');
    });

    it('pads the user id to six digits', () => {
      const code = service.generateUserCode(
        123,
        new Date('2026-01-01T00:00:00+07:00'),
      );

      expect(code).toBe('69000123');
    });
  });
});
