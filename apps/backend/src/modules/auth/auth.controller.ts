import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthService, LoginResponse, RegisterResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginBuuDto } from './dto/login-buu.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/decorators/public.decorator';
import { Audit } from 'src/modules/audit-logs/decorators/audit.decorator';
import { AuditAction } from 'src/modules/audit-logs/constants/audit-actions';
import type { AuthenticatedUser } from 'src/common/utils/authz.util';

import { Request as ExpressRequest } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Audit({
    action: AuditAction.AUTH_LOGIN,
    resourceType: 'user',
    bodyKeys: ['email'],
    resultKeys: ['user.id', 'user.email', 'user.roles'],
    resourceIdFrom: 'user.id',
  })
  @Post('login')
  @ApiOkResponse({
    schema: {
      properties: {
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            actorType: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Audit({
    action: AuditAction.AUTH_LOGIN,
    resourceType: 'person',
    bodyKeys: ['username'],
    resultKeys: ['user.psnId', 'user.email', 'user.roles'],
    resourceIdFrom: 'user.psnId',
  })
  @Post('loginBuu')
  @ApiOkResponse({
    schema: {
      properties: {
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            psnId: { type: 'string' },
            actorType: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            roles: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  async loginBuu(@Body() loginBuuDto: LoginBuuDto): Promise<LoginResponse> {
    return this.authService.loginBuu(loginBuuDto);
  }

  @Public()
  @Post('register')
  @ApiOkResponse({
    schema: {
      properties: {
        message: { type: 'string' },
        userId: { type: 'number' },
      },
    },
  })
  register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('send-otp')
  @ApiOkResponse({
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async sendOtp(
    @Body() sendOtpDto: SendOtpDto,
  ): Promise<{ success: boolean; message?: string }> {
    return this.authService.sendOtp(sendOtpDto.email);
  }

  @Public()
  @Post('verify-otp')
  @ApiOkResponse({
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ success: boolean; message?: string }> {
    return this.authService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(
    @Request()
    req: ExpressRequest & {
      user: AuthenticatedUser;
    },
  ) {
    return this.authService.getProfile(req.user);
  }
}
