import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PlatformGatewayService } from './platform-gateway.service';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

describe('PlatformGatewayService', () => {
  let service: PlatformGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformGatewayService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: CACHE_MANAGER,
          useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<PlatformGatewayService>(PlatformGatewayService);
  });

  it('instantiates with config and cache dependencies', () => {
    expect(service).toBeDefined();
  });
});
