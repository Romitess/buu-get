import { All, Controller, Redirect, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { ThaidService } from './thaid.service';
import {
  IdentityCallbackRedirect,
  IdentityCallbackSource,
} from './types/thaid.types';
import { toRecord } from './thaid.utils';

@ApiTags('ThaiD')
@Controller()
export class ThaidIdentityController {
  constructor(
    private readonly thaidService: ThaidService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @All('sandbox/callback')
  @Redirect()
  @ApiOperation({
    summary: 'ThaiD sandbox identity callback (public)',
    description:
      'รับ redirect จากแอป ThaiD [Sandbox] หลัง Entity ยืนยันการให้ข้อมูล แล้วพาไปหน้าแสดงผล\n\nลงทะเบียน Callback URL: https://buu-get-dev.buu.ac.th/api/sandbox/callback',
  })
  sandboxCallback(@Req() req: Request): IdentityCallbackRedirect {
    return this.redirectCallback(req, 'sandbox');
  }

  @Public()
  @All('thaid/callback')
  @Redirect()
  @ApiOperation({
    summary: 'ThaiD identity callback (public)',
    description:
      'รับ redirect จากแอป ThaiD หลัง Entity ยืนยันการให้ข้อมูล แล้วพาไปหน้าแสดงผล\n\nลงทะเบียน Callback URL: https://buu-get.buu.ac.th/api/thaid/callback',
  })
  thaidCallback(@Req() req: Request): IdentityCallbackRedirect {
    return this.redirectCallback(req, 'thaid');
  }

  private redirectCallback(
    req: Request,
    source: IdentityCallbackSource,
  ): IdentityCallbackRedirect {
    return this.thaidService.buildIdentityCallbackRedirect(
      source,
      {
        ...toRecord(req.body),
        ...toRecord(req.query),
      },
      this.resolveFrontendOrigin(),
    );
  }

  private resolveFrontendOrigin(): string | undefined {
    const configured = this.configService.get<string>('FRONTEND_URL');
    const trimmed = configured?.trim();
    if (!trimmed) {
      return undefined;
    }
    return trimmed.replace(/\/$/, '');
  }
}
