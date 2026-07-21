import { Test, TestingModule } from '@nestjs/testing';
import { PlatformGatewayController } from './platform-gateway.controller';
import { PlatformGatewayService } from './platform-gateway.service';

jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));

describe('PlatformGatewayController', () => {
  let controller: PlatformGatewayController;
  let platformGatewayService: jest.Mocked<
    Pick<PlatformGatewayService, 'dsPrefix'>
  >;

  beforeEach(async () => {
    platformGatewayService = {
      dsPrefix: jest.fn().mockResolvedValue({ prefix: 'DS' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlatformGatewayController],
      providers: [
        {
          provide: PlatformGatewayService,
          useValue: platformGatewayService,
        },
      ],
    }).compile();

    controller = module.get<PlatformGatewayController>(
      PlatformGatewayController,
    );
  });

  it('delegates dsPrefix to the service', async () => {
    await expect(controller.dsPrefix()).resolves.toEqual({ prefix: 'DS' });
    expect(platformGatewayService.dsPrefix).toHaveBeenCalled();
  });
});
