import { All, Controller, NotFoundException, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { EnvironmentVariables } from 'src/config/env.validation';
import { Public } from 'src/decorators/public.decorator';
import { ThaidService } from './thaid.service';
import { ExternalCallbackResult } from './types/thaid.types';
import { toRecord } from './thaid.utils';

@ApiTags('ThaiD')
@Controller('bank')
export class ThaidController {
  constructor(
    private readonly thaidService: ThaidService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  private assertStubCallbacksAllowed(): void {
    const nodeEnv = this.configService.get('NODE_ENV', { infer: true });
    if (nodeEnv === 'production') {
      throw new NotFoundException();
    }
  }

  @Public()
  @All('approval')
  @ApiOperation({
    summary: 'ThaiD approval callback (public)',
    description:
      'รับ callback จากธนาคารก่อนชำระเงิน — รองรับทุก HTTP method และ payload shape ชั่วคราวจนกว่าจะได้ spec จริง (disabled in production)',
  })
  approval(@Req() req: Request): ExternalCallbackResult {
    this.assertStubCallbacksAllowed();
    return this.thaidService.handleCallback('approval', {
      body: toRecord(req.body),
      query: toRecord(req.query),
    });
  }

  @Public()
  @All('payment')
  @ApiOperation({
    summary: 'ThaiD payment callback (public)',
    description:
      'รับ callback จากธนาคารหลังชำระเงิน — รองรับทุก HTTP method และ payload shape ชั่วคราวจนกว่าจะได้ spec จริง (disabled in production)',
  })
  payment(@Req() req: Request): ExternalCallbackResult {
    this.assertStubCallbacksAllowed();
    return this.thaidService.handleCallback('payment', {
      body: toRecord(req.body),
      query: toRecord(req.query),
    });
  }
}
