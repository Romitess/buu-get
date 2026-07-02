import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from 'src/decorators/public.decorator';

/**
 * JwtAuthGuard — Guard สำหรับตรวจสอบ JWT Token
 * ใช้ร่วมกับ passport-jwt strategy
 * ตัวอย่าง: @UseGuards(JwtAuthGuard)
 *
 * รองรับ @Public(): ถ้า handler/controller ทำเครื่องหมาย @Public() จะข้ามการตรวจ token
 * ทำให้สามารถนำไปใช้เป็น global guard (APP_GUARD) โดยใช้ @Public() เป็น allowlist ได้
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}
