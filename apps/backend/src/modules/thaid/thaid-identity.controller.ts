import {
  All,
  Body,
  Controller,
  Get,
  Post,
  Redirect,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from 'src/decorators/public.decorator';
import { ThaidSessionDto } from './dto/thaid-session.dto';
import { ThaidService } from './thaid.service';
import {
  IdentityCallbackRedirect,
  IdentityCallbackSource,
  ThaidSessionResponse,
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
  @Get('thaid/login')
  @Redirect()
  @ApiOperation({
    summary: 'เริ่มเข้าสู่ระบบด้วย ThaID',
    description: 'เปลี่ยนเส้นทางไปหน้ายืนยันตัวตนของกรมการปกครอง',
  })
  beginLogin(): Promise<IdentityCallbackRedirect> {
    return this.thaidService.beginIdentity('login');
  }

  @Public()
  @Get('thaid/register')
  @Redirect()
  @ApiOperation({
    summary: 'เริ่มสมัครสมาชิกด้วย ThaID',
    description: 'เปลี่ยนเส้นทางไปหน้ายืนยันตัวตนของกรมการปกครอง',
  })
  beginRegister(): Promise<IdentityCallbackRedirect> {
    return this.thaidService.beginIdentity('register');
  }

  @Public()
  @Post('thaid/session')
  @ApiOperation({
    summary: 'แลกตั๋วครั้งเดียวเป็นเซสชันหรือข้อมูลพรีฟิลล์',
  })
  exchangeSession(@Body() dto: ThaidSessionDto): Promise<ThaidSessionResponse> {
    return this.thaidService.exchangeSession(dto.ticket);
  }

  @Public()
  @All('sandbox/callback')
  @Redirect()
  @ApiOperation({
    summary: 'ThaiD sandbox identity callback (public)',
    description:
      'รับ redirect จากแอป ThaiD [Sandbox] หลัง Entity ยืนยันการให้ข้อมูล แล้วแลก code เป็นผลยืนยัน\n\nลงทะเบียน Callback URL: https://buu-get-dev.buu.ac.th/api/sandbox/callback',
  })
  sandboxCallback(@Req() req: Request): Promise<IdentityCallbackRedirect> {
    return this.redirectCallback(req, 'sandbox');
  }

  @Public()
  @All('thaid/callback')
  @Redirect()
  @ApiOperation({
    summary: 'ThaiD identity callback (public)',
    description:
      'รับ redirect จากแอป ThaiD หลัง Entity ยืนยันการให้ข้อมูล แล้วแลก code เป็นผลยืนยัน\n\nลงทะเบียน Callback URL: https://buu-get.buu.ac.th/api/thaid/callback',
  })
  thaidCallback(@Req() req: Request): Promise<IdentityCallbackRedirect> {
    return this.redirectCallback(req, 'thaid');
  }

  private redirectCallback(
    req: Request,
    source: IdentityCallbackSource,
  ): Promise<IdentityCallbackRedirect> {
    return this.thaidService.completeIdentityCallback(
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
