import { AuthService, LoginResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { UserProfileService } from '../user-profile/user-profile.service';
import { DataSource } from 'typeorm';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    const mockUsersService = {} as UsersService;
    const mockUserProfileService = {} as UserProfileService;
    const mockDataSource = {} as DataSource;
    service = new AuthService(
      mockUsersService,
      mockUserProfileService,
      mockDataSource,
    );
  });

  it('returns a placeholder access token for a valid login payload', () => {
    const loginDto: LoginDto = {
      email: 'student@example.com',
      password: 'password1234',
    };

    const response: LoginResponse = service.login(loginDto);

    expect(response.accessToken).toBe('replace-with-jwt-implementation');
  });
});
