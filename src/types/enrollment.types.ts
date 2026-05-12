/** Backend UserProfile shape (nested inside User) */
export interface BackendUserProfile {
  userProfileId: number;
  userId: number;
  userTitleTh: string | null;
  userFullnameTh: string | null;
  userTitleEn: string | null;
  userFullnameEn: string | null;
}

/** Backend User shape (nested inside Enrollment) */
export interface BackendUser {
  USER_ID: number;
  USER_NATIONAL_ID: string | null;
  USER_PASSPORT_NO: string | null;
  USER_EMAIL: string;
  PROFILE?: BackendUserProfile | null;
}

/** Backend Session shape (nested inside Enrollment) */
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
  };
  LOCATION?: {
    LOCATION_ID: number;
    LOCATION_NAME: string;
    LOCATION_ROOM_NO: string;
  };
}

/** Full enrollment response from GET /exam-enrollments/exam/:examId */
export interface BackendEnrollmentDetail {
  ERM_ID: number;
  USER_ID: number;
  SESSION_ID: number;
  ERM_SEAT_NUMBER: string | null;
  ERM_STATUS: number;
  ERM_VERIFY_STATUS: number;
  ERM_AT: string | null;
  CREATED_AT: string;
  UPDATED_AT: string;
  DELETED_AT: string | null;
  USER: BackendUser;
  SESSION: BackendSessionDetail;
}

/** Row data for the registrants table */
export interface EnrollmentTableRow {
  index: number;
  ermId: number;
  nationalId: string;
  titleTh: string;
  fullnameTh: string;
  paymentStatus: number;
  verifyStatus: number;
}

/** Enrollment status enum (mirrors backend) */
export enum EnrollmentStatus {
  UNPAID = 0,
  PAID = 1,
  SEAT_ASSIGNED = 2,
  ATTENDED = 3,
  CANCELLED = 4,
}

/** Verify status enum (mirrors backend) */
export enum VerifyStatus {
  UNCHECKED = 0,
  PASS = 1,
  WAIT_FIXED = 2,
  CANCELLED = 3,
}

/** Label mapping for payment status */
export const PAYMENT_STATUS_LABELS: Record<number, string> = {
  [EnrollmentStatus.UNPAID]: 'ค้างชำระ',
  [EnrollmentStatus.PAID]: 'ชำระเงินแล้ว',
  [EnrollmentStatus.SEAT_ASSIGNED]: 'ชำระเงินแล้ว',
  [EnrollmentStatus.ATTENDED]: 'ชำระเงินแล้ว',
  [EnrollmentStatus.CANCELLED]: 'ยกเลิก',
};

/** Label mapping for verify status */
export const VERIFY_STATUS_LABELS: Record<number, string> = {
  [VerifyStatus.UNCHECKED]: 'รอการตรวจสอบ',
  [VerifyStatus.PASS]: 'ผ่าน',
  [VerifyStatus.WAIT_FIXED]: 'รอการแก้ไข',
  [VerifyStatus.CANCELLED]: 'ยกเลิก',
};
