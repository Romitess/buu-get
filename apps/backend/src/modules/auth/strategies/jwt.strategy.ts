import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RoleEnum } from 'src/modules/roles/enums/role.enum';
import type { AuthenticatedUser } from 'src/common/utils/authz.util';

/**
 * JWT Payload ที่จะถูกแนบไปกับทุก request หลัง verify token สำเร็จ
 * - ผู้สมัคร (legacy): sub = USER_ID (number), ไม่มี typ
 * - บุคลากร (loginBuu): typ = 'person', sub = PSN_ID (string)
 */
export interface JwtPayload {
  /** USER_ID (number) หรือ PSN_ID (string เมื่อ typ=person) */
  sub: number | string;
  /** Email ของผู้ใช้ */
  email: string;
  /** Role หลักของผู้ใช้ (ตัวแรก) — คงไว้เพื่อ backward compatibility */
  role: RoleEnum;
  /** Role ทั้งหมดที่ผู้ใช้มี (1 user มีได้หลาย role) */
  roles?: RoleEnum[];
  /** 'person' = MSG_T_PERSON; ไม่มีหรืออื่น = BUU_GET_T_USER */
  typ?: 'person';
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
  validate(payload: JwtPayload): AuthenticatedUser {
    // token เก่าที่ยังไม่มี roles → fallback เป็น [role] เพื่อความเข้ากันได้
    const roles =
      payload.roles && payload.roles.length > 0
        ? payload.roles
        : payload.role
          ? [payload.role]
          : [];

    if (payload.typ === 'person') {
      return {
        actorType: 'person',
        personId: String(payload.sub),
        email: payload.email,
        role: payload.role,
        roles,
      };
    }

    return {
      actorType: 'user',
      userId: Number(payload.sub),
      email: payload.email,
      role: payload.role,
      roles,
    };
  }
}
