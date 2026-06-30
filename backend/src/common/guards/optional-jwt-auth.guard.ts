import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * OptionalJwtAuthGuard — ตรวจ JWT แบบไม่บังคับ
 *
 * ถ้ามี token ที่ถูกต้อง → แนบ req.user ให้ (ดึง userId ได้)
 * ถ้าไม่มี token / token ไม่ถูกต้อง → ปล่อยผ่าน (req.user = undefined) ไม่ throw
 *
 * ใช้กับ endpoint ที่รองรับทั้งผู้ใช้ที่ login และไม่ login
 * (เช่น upload รูปที่บาง category ต้องผูก userId บาง category ไม่ต้อง)
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
