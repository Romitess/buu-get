import { UserPhysicalStatus } from '../../modules/user-profile/enums/user-physical-status.enum';

const PHYSICAL_STATUS_TO_CODE: Record<string, number> = {
  [UserPhysicalStatus.MONK]: 1,
  [UserPhysicalStatus.DISABLED]: 2,
  [UserPhysicalStatus.PREGNANT]: 3,
  [UserPhysicalStatus.FOREIGNER]: 4,
  [UserPhysicalStatus.THAI]: 5,
  // legacy labels
  'พระภิกษุ / สามเณร': 1,
  'นักบวช / ศาสนบุคคล': 1,
  'พระภิกษุ/นักบวช': 1,
  พระสงฆ์: 1,
  ตั้งครรภ์: 3,
  ผู้พิการรณ์: 2,
  // UI / legacy numeric strings
  '0': 1,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
};

const CODE_TO_PHYSICAL_STATUS: Record<number, UserPhysicalStatus> = {
  0: UserPhysicalStatus.MONK, // legacy pre-remap
  1: UserPhysicalStatus.MONK,
  2: UserPhysicalStatus.DISABLED,
  3: UserPhysicalStatus.PREGNANT,
  4: UserPhysicalStatus.FOREIGNER,
  5: UserPhysicalStatus.THAI,
};

/** ค่าที่หมายถึงผู้ใช้เลือก "ทั่วไป" — ให้ระบบจำแนกไทย/ต่างชาติเอง */
const GENERAL_SELECTION_VALUES = new Set([
  '',
  'general',
  'ทั่วไป',
  'ไม่มีข้อมูลข้างต้น',
  '5', // legacy convenience-step
]);

export function physicalStatusToCode(
  value: string | UserPhysicalStatus | null | undefined,
): number {
  if (value === null || value === undefined) {
    return 5;
  }
  const trimmed = String(value).trim();
  if (Object.prototype.hasOwnProperty.call(PHYSICAL_STATUS_TO_CODE, trimmed)) {
    return PHYSICAL_STATUS_TO_CODE[trimmed];
  }
  return 5;
}

export function physicalStatusFromCode(
  value: number | null | undefined,
): UserPhysicalStatus {
  if (value === null || value === undefined) {
    return UserPhysicalStatus.THAI;
  }
  return CODE_TO_PHYSICAL_STATUS[value] ?? UserPhysicalStatus.THAI;
}

export function isGeneralPhysicalStatusSelection(
  value: string | null | undefined,
): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  return GENERAL_SELECTION_VALUES.has(String(value).trim());
}

/**
 * แปลงค่าจาก UI/API เป็นสถานะที่บันทึก
 * — ถ้าเลือก "ทั่วไป" จะจำแนกเป็นชาวต่างชาติ/ชาวไทยจาก passport
 */
export function resolveEnrollmentPhysicalStatus(
  input: string | null | undefined,
  hasPassport: boolean,
): UserPhysicalStatus {
  const raw = input?.trim() ?? '';

  if (isGeneralPhysicalStatusSelection(raw)) {
    return hasPassport ? UserPhysicalStatus.FOREIGNER : UserPhysicalStatus.THAI;
  }

  return physicalStatusFromCode(physicalStatusToCode(raw));
}
