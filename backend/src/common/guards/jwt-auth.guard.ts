import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard — Guard สำหรับตรวจสอบ JWT Token
 * ใช้ร่วมกับ passport-jwt strategy
 * ตัวอย่าง: @UseGuards(JwtAuthGuard)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
