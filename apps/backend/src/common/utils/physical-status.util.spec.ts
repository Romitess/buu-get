import { UserPhysicalStatus } from '../../modules/user-profile/enums/user-physical-status.enum';
import {
  physicalStatusFromCode,
  physicalStatusToCode,
  resolveEnrollmentPhysicalStatus,
} from './physical-status.util';

describe('physical-status.util', () => {
  it('maps enum labels to codes 1–5', () => {
    expect(physicalStatusToCode(UserPhysicalStatus.MONK)).toBe(1);
    expect(physicalStatusToCode(UserPhysicalStatus.DISABLED)).toBe(2);
    expect(physicalStatusToCode(UserPhysicalStatus.PREGNANT)).toBe(3);
    expect(physicalStatusToCode(UserPhysicalStatus.FOREIGNER)).toBe(4);
    expect(physicalStatusToCode(UserPhysicalStatus.THAI)).toBe(5);
  });

  it('maps codes back to enum labels', () => {
    expect(physicalStatusFromCode(1)).toBe(UserPhysicalStatus.MONK);
    expect(physicalStatusFromCode(4)).toBe(UserPhysicalStatus.FOREIGNER);
    expect(physicalStatusFromCode(5)).toBe(UserPhysicalStatus.THAI);
    expect(physicalStatusFromCode(0)).toBe(UserPhysicalStatus.MONK);
  });

  it('classifies general selection by passport', () => {
    expect(resolveEnrollmentPhysicalStatus('general', false)).toBe(
      UserPhysicalStatus.THAI,
    );
    expect(resolveEnrollmentPhysicalStatus('ทั่วไป', true)).toBe(
      UserPhysicalStatus.FOREIGNER,
    );
    expect(resolveEnrollmentPhysicalStatus('ไม่มีข้อมูลข้างต้น', false)).toBe(
      UserPhysicalStatus.THAI,
    );
    expect(resolveEnrollmentPhysicalStatus('5', true)).toBe(
      UserPhysicalStatus.FOREIGNER,
    );
  });

  it('keeps explicit statuses', () => {
    expect(resolveEnrollmentPhysicalStatus('1', false)).toBe(
      UserPhysicalStatus.MONK,
    );
    expect(resolveEnrollmentPhysicalStatus('ชาวไทย', true)).toBe(
      UserPhysicalStatus.THAI,
    );
    expect(resolveEnrollmentPhysicalStatus('ชาวต่างชาติ', false)).toBe(
      UserPhysicalStatus.FOREIGNER,
    );
  });
});
