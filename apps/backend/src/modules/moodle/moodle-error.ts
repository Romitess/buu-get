/** ข้อความที่ Moodle ส่งกลับแม้ HTTP จะเป็น 200 */
export interface MoodleExceptionBody {
  exception: string;
  errorcode?: string;
  message?: string;
  debuginfo?: string;
}

/**
 * แปลง exception ของ Moodle เป็นข้อความที่บอกสาเหตุที่แก้ได้
 * message ของ invalidparameter มักเป็นประโยคกลาง ๆ ส่วนรายละเอียดอยู่ที่ debuginfo
 */
export function formatMoodleError(body: MoodleExceptionBody): string {
  const detail = (body.debuginfo ?? '').trim();
  const generic = (body.message ?? '').trim();
  const specific = detail || generic;
  if (body.errorcode === 'errorcatcontextnotvalid') {
    return `หมวดหมู่คอร์สของ Moodle ใช้ไม่ได้: ${generic} ตรวจค่า MOODLE_COURSE_CATEGORY_ID`;
  }
  const explained = explainMoodleDetail(specific);
  if (explained) {
    return explained;
  }
  const code = body.errorcode ?? 'moodle_exception';
  if (detail && detail !== generic) {
    return `${code}: ${generic} — ${detail}`.replace(/:\s*—/, ':').trim();
  }
  return `${code}: ${generic}`.trim();
}

/** Moodle ไม่พบแถวที่อ้างถึง เช่น user id ที่ถูกลบไปแล้ว */
export function isMoodleMissingRecordError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return (
    /invalidrecord(unknown)?/i.test(message) &&
    /can(?:'|’)t find data record|can not find data record/i.test(message)
  );
}

function explainMoodleDetail(detail: string): string | null {
  if (!detail) {
    return null;
  }
  const usernameExists = /^Username already exists:\s*(.*)$/i.exec(detail);
  if (usernameExists) {
    return `อีเมลนี้ถูกใช้เป็นชื่อผู้ใช้ใน Moodle แล้ว: ${usernameExists[1] ?? ''}`.trim();
  }
  const emailExists = /^Email address already exists:\s*(.*)$/i.exec(detail);
  if (emailExists) {
    return `อีเมลนี้มีอยู่ใน Moodle แล้ว: ${emailExists[1] ?? ''}`.trim();
  }
  const emailInvalid = /^Email address is invalid:\s*(.*)$/i.exec(detail);
  if (emailInvalid) {
    return `รูปแบบอีเมลไม่ถูกต้องตาม Moodle: ${emailInvalid[1] ?? ''}`.trim();
  }
  if (/invalid username/i.test(detail)) {
    return `ชื่อผู้ใช้ใน Moodle ไม่ถูกต้อง: ${detail}`;
  }
  if (/id\s*number already exists/i.test(detail)) {
    return `เลขประจำตัวนี้มีอยู่ใน Moodle แล้ว: ${detail}`;
  }
  if (/password/i.test(detail)) {
    return `รหัสผ่านไม่ผ่านนโยบายของ Moodle: ${detail}`;
  }
  return null;
}
