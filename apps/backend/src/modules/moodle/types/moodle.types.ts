/** ข้อมูลอ้างอิงสำหรับบันทึก moodle_sync_log */
export interface MoodleLogMeta {
  /**
   * USER_ID ของผู้สมัคร บุคลากร (person) ไม่มีค่านี้
   * คอลัมน์ในล็อกจึงว่างได้
   */
  userId?: number;
  /** ประเภทอ้างอิง เช่น 'user' | 'course' | 'enrolment' | 'grade' */
  refType: string;
  /** id อ้างอิงภายในระบบ */
  refId: number;
  /** id ฝั่ง Moodle (ถ้ายังไม่รู้ตอน log จะใส่ 0) */
  moodleRefId?: number;
}

export interface MoodleCourseInput {
  fullname: string;
  shortname: string;
  categoryid: number;
  /** unix timestamp (วินาที) */
  startdate?: number;
  enddate?: number;
}

export interface MoodleCreatedCourse {
  id: number;
  shortname: string;
}

export interface MoodleUserInput {
  username: string;
  password: string;
  firstname: string;
  lastname: string;
  email: string;
  idnumber?: string;
  auth?: string;
}

export interface MoodleCreatedUser {
  id: number;
  username: string;
}

/** ฟิลด์ที่ส่งให้ core_user_update_users นอกจาก id */
export interface MoodleUserUpdateInput {
  firstname?: string;
  lastname?: string;
  email?: string;
  username?: string;
  idnumber?: string;
}

export interface MoodleEnrolmentInput {
  roleid: number;
  userid: number;
  courseid: number;
}
