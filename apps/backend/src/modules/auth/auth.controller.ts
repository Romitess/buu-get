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
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Public } from 'src/decorators/public.decorator';

import { Request as ExpressRequest } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOkResponse({
    schema: {
      properties: {
        accessToken: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number' },
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
      user: { userId: number; email: string; role: string; roles: string[] };
    },
  ) {
    return this.authService.getProfile(req.user.userId);
  }
}
