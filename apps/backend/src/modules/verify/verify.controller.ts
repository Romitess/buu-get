import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from 'src/decorators/public.decorator';
import { VerifyService } from './verify.service';
import type {
  VerifyCertificateResponseDto,
  VerifyReceiptResponseDto,
} from './dto/verify-response.dto';

@ApiTags('verify')
@Controller('verify')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Public()
  @Get('certificate/:code')
  @ApiOperation({
    summary: 'ตรวจสอบใบรับรอง BUU-GET ด้วยรหัส verification (public)',
  })
  @ApiOkResponse({ description: 'รายละเอียดใบรับรอง' })
  verifyCertificate(
    @Param('code') code: string,
  ): Promise<VerifyCertificateResponseDto> {
    return this.verifyService.verifyCertificate(code);
  }

  @Public()
  @Get('receipt/:code')
  @ApiOperation({
    summary: 'ตรวจสอบใบเสร็จ BUU-GET ด้วยรหัส verification (public)',
  })
  @ApiOkResponse({ description: 'รายละเอียดใบเสร็จ' })
  verifyReceipt(
    @Param('code') code: string,
  ): Promise<VerifyReceiptResponseDto> {
    return this.verifyService.verifyReceipt(code);
  }
}
