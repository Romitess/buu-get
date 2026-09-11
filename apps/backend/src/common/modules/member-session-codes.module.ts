import { Global, Module } from '@nestjs/common';
import { MemberSessionCodesService } from '../services/member-session-codes.service';

@Global()
@Module({
  providers: [MemberSessionCodesService],
  exports: [MemberSessionCodesService],
})
export class MemberSessionCodesModule {}
