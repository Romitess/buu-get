import { Test, TestingModule } from '@nestjs/testing';
import { PlatformGatewayController } from './platform-gateway.controller';
import { PlatformGatewayService } from './platform-gateway.service';

describe('PlatformGatewayController', () => {
  let controller: PlatformGatewayController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformGatewayController],
      providers: [PlatformGatewayService],
    }).compile();

    controller = module.get<PlatformGatewayController>(
      PlatformGatewayController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
