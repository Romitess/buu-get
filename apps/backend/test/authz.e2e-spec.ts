import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { RoleEnum } from '../src/modules/roles/enums/role.enum';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';

class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{
      user: {
        userId: number;
        email: string;
        role: RoleEnum;
        roles: RoleEnum[];
      };
    }>();
    req.user = {
      userId: 99,
      email: 'candidate@example.com',
      role: RoleEnum.CANDIDATE,
      roles: [RoleEnum.CANDIDATE],
    };
    return true;
  }
}

describe('Authz (e2e)', () => {
  let app: INestApplication;

  const usersService = {
    findAll: jest.fn().mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: usersService },
        RolesGuard,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalGuards(new MockJwtAuthGuard(), moduleRef.get(RolesGuard));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('denies candidate access to admin user list', async () => {
    await request(app.getHttpServer()).get('/users').expect(403);
  });
});
