import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { PlatformGatewayService } from './platform-gateway.service';
import { PlatformGatewayController } from './platform-gateway.controller';

@Global()
@Module({
  imports: [CacheModule.register()],
  controllers: [PlatformGatewayController],
  providers: [PlatformGatewayService],
  exports: [PlatformGatewayService],
})
export class PlatformGatewayModule {}
