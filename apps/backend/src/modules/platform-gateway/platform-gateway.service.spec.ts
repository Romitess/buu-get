import { Test, TestingModule } from '@nestjs/testing';
import { PlatformGatewayService } from './platform-gateway.service';

describe('PlatformGatewayService', () => {
  let service: PlatformGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlatformGatewayService],
    }).compile();

    service = module.get<PlatformGatewayService>(PlatformGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
