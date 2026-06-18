/**
 * Role enum สำหรับการแบ่งบทบาทผู้ใช้ในระบบ BUU-GET
 * ใช้เป็น string enum เพื่อให้ตรงกับค่าที่เก็บในฐานข้อมูล
 */
export enum RoleEnum {
  /** ผู้สมัครลงทะเบียน / ผู้สมัครสอบ */
  CANDIDATE = 'candidate',

  /** เจ้าหน้าที่สถาบันภาษา */
  STAFF = 'staff',

  /** เจ้าหน้าที่การเงิน */
  FINANCE = 'finance',

  /** กรรมการคุมสอบ */
  PROCTOR = 'proctor',

  /** ผู้บริหาร */
  EXECUTIVE = 'executive',

  /** เจ้าหน้าที่รับสมัคร */
  REGISTRATION_OFFICER = 'registration_officer',

  /** เจ้าหน้าที่จัดสอบ */
  EXAM_OPERATIONS_OFFICER = 'exam_operations_officer',

  /** ผู้ดูแลระบบ */
  ADMIN = 'admin',
}
