import { Module } from '@nestjs/common';
import { ThaidController } from './thaid.controller';
import { ThaidIdentityController } from './thaid-identity.controller';
import { ThaidService } from './thaid.service';

@Module({
  controllers: [ThaidController, ThaidIdentityController],
  providers: [ThaidService],
})
export class ThaidModule {}
