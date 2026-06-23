import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';

/**
 * JWT Payload ที่จะถูกแนบไปกับทุก request หลัง verify token สำเร็จ
 */
export interface JwtPayload {
  /** User ID จากฐานข้อมูล */
  sub: number;
  /** Email ของผู้ใช้ */
  email: string;
  /** Role หลักของผู้ใช้ (ตัวแรก) — คงไว้เพื่อ backward compatibility */
  role: RoleEnum;
  /** Role ทั้งหมดที่ผู้ใช้มี (1 user มีได้หลาย role) */
  roles?: RoleEnum[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * validate() จะถูกเรียกหลังจาก token ผ่านการ verify แล้ว
   * ค่าที่ return จะถูกแนบไปใน request.user โดยอัตโนมัติ
   */
  validate(payload: JwtPayload) {
    // token เก่าที่ยังไม่มี roles → fallback เป็น [role] เพื่อความเข้ากันได้
    const roles =
      payload.roles && payload.roles.length > 0
        ? payload.roles
        : payload.role
          ? [payload.role]
          : [];

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      roles,
    };
  }
}
