import { All, Controller, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { ThaidService } from './thaid.service';
import {
  ExternalCallbackQuery,
  ExternalCallbackResult,
} from './types/thaid.types';

function toRecord(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value };
}

@ApiTags('ThaiD')
@Controller()
export class ThaidController {
  constructor(private readonly thaidService: ThaidService) {}

  @Public()
  @All('approval')
  @ApiOperation({
    summary: 'ThaiD approval callback (public)',
    description:
      'รับ callback จากธนาคารก่อนชำระเงิน — รองรับทุก HTTP method และ payload shape ชั่วคราวจนกว่าจะได้ spec จริง',
  })
  approval(@Req() req: Request): ExternalCallbackResult {
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
      'รับ callback จากธนาคารหลังชำระเงิน — รองรับทุก HTTP method และ payload shape ชั่วคราวจนกว่าจะได้ spec จริง',
  })
  payment(@Req() req: Request): ExternalCallbackResult {
    return this.thaidService.handleCallback('payment', {
      body: toRecord(req.body),
      query: toRecord(req.query),
    });
  }
}
