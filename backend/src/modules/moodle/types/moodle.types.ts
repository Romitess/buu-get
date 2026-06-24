/** ข้อมูลอ้างอิงสำหรับบันทึก moodle_sync_log (ทุก field NOT NULL ตาม schema) */
export interface MoodleLogMeta {
  /** user ภายในระบบที่อ้างอิง (FK USER_ID) */
  userId: number;
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

export interface MoodleEnrolmentInput {
  roleid: number;
  userid: number;
  courseid: number;
}
