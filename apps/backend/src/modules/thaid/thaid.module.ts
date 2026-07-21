import { Module } from '@nestjs/common';
import { ThaidController } from './thaid.controller';
import { ThaidService } from './thaid.service';

@Module({
  controllers: [ThaidController],
  providers: [ThaidService],
})
export class ThaidModule {}
