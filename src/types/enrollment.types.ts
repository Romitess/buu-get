export interface BackendUserProfile {
  userProfileId: number;
  userId: number;
  userTitleTh: string | null;
  userFullnameTh: string | null;
  userTitleEn: string | null;
  userFullnameEn: string | null;
  userDateOfBirth: string | null;
  userPhone: string | null;
  userEducation: string | null;
  userFaculty: string | null;
  userInstitution: string | null;
  userAddress: string | null;
  userRemark: string | null;
  userImagePath?: string | null;
}

export interface BackendUser {
  USER_ID: number;
  USER_NATIONAL_ID: string | null;
  USER_PASSPORT_NO: string | null;
  USER_EMAIL: string;
  USER_IMAGE?: string | null;
  IMAGE?: { USER_IMAGE_URL: string } | null;
  PROFILE?: BackendUserProfile | null;
}

export interface BackendSessionDetail {
  SS_ID: number;
  EXAM_ID: number;
  SS_START_TIME: string;
  SS_END_TIME: string;
  SS_CAPACITY: number;
  EXAM?: {
    EXAM_ID: number;
    EXAM_NAME: string;
    EXAM_DATE: string;
    EXAM_FEE?: number;
  };
  LOCATION?: {
    LOCATION_ID: number;
    LOCATION_NAME: string;
    LOCATION_ROOM_NO: string;
    LOCATION_TOTAL_ROWS?: number;
    LOCATION_TOTAL_COLS?: number;
    LOCATION_IS_SPLIT?: number;
    SEATS?: {
      LS_ID: number;
      LS_ROW_NO: number;
      LS_COL_NO: number;
      LS_SEAT_LABEL: string | null;
      LS_SEAT_STATUS: number;
    }[];
  };
}

export enum ExamAttendStatus {
  MISSING = 0,
  INTIME = 1,
  LATE = 2,
}

export interface BackendAttendance {
  ATTEND_ID: number;
  ERM_ID: number;
  ATTEND_CHECK_IN_TIME: string | null;
  ATTEND_STATUS: ExamAttendStatus;
}

export interface BackendEnrollmentDetail {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
  SL_ID?: number | null;
  LS_ID: number | null;
  ERM_STATUS: number;
  ERM_VERIFY_STATUS: number;
  ERM_AT: string | null;
  CREATED_AT: string;
  UPDATED_AT: string;
  DELETED_AT: string | null;
  ERM_PHYSICAL_STATUS?: string | null;
  USER: BackendUser;
  SESSION: BackendSessionDetail;
  ATTENDANCES?: BackendAttendance[];
  LOCATION_SEAT?: {
    LS_ID: number;
    LS_SEAT_LABEL: string | null;
    LS_ROW_NO?: number;
    LS_COL_NO?: number;
  } | null;
  SESSION_LOCATION?: {
    SL_ID: number;
    LOCATION_ID: number;
  } | null;
}

export interface EnrollmentTableRow {
  index: number;
  ermId: number;
  nationalId: string;
  titleTh: string;
  fullnameTh: string;
  paymentStatus: number;
  verifyStatus: number;
  sessionId: number;
  userProfileId: number;
  remark: string;
}

export interface AttendanceTableRow {
  index: number;
  ermId: number;
  nationalId: string;
  titleTh: string;
  fullnameTh: string;
  seatNumber: string;
  attendanceStatus: ExamAttendStatus;
  checkInTime: string | null;
  sessionId: number;
}

export enum EnrollmentStatus {
  UNPAID = 0,
  PAID = 1,
  SEAT_ASSIGNED = 2,
  SEAT_PUBLISHED = 3,
  ATTENDED = 4,
  CANCELLED = 5,
}

export enum VerifyStatus {
  UNCHECKED = 0,
  PASS = 1,
  WAIT_FIXED = 2,
  CANCELLED = 3,
}

export const PAYMENT_STATUS_LABELS: Record<number, string> = {
  [EnrollmentStatus.UNPAID]: 'ค้างชำระ',
  [EnrollmentStatus.PAID]: 'ชำระเงินแล้ว',
  [EnrollmentStatus.SEAT_ASSIGNED]: 'ชำระเงินแล้ว',
  [EnrollmentStatus.SEAT_PUBLISHED]: 'ชำระเงินแล้ว',
  [EnrollmentStatus.ATTENDED]: 'ชำระเงินแล้ว',
  [EnrollmentStatus.CANCELLED]: 'ยกเลิก',
};

export const VERIFY_STATUS_LABELS: Record<number, string> = {
  [VerifyStatus.UNCHECKED]: 'รอการตรวจสอบ',
  [VerifyStatus.PASS]: 'ผ่าน',
  [VerifyStatus.WAIT_FIXED]: 'รอการแก้ไข',
  [VerifyStatus.CANCELLED]: 'ยกเลิก',
};
