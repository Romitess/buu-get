import { getPublicAppUrl } from '../../config/resolve-app-public-url';

/**
 * ข้อมูลอย่างเป็นทางการของมหาวิทยาลัยบูรพา
 * ใช้สำหรับใบเสร็จ / ใบรับรอง / เอกสารประกอบ
 */
export interface UniversityInfo {
  /** ชื่อมหาวิทยาลัย (TH) */
  nameTH: string;
  /** ชื่อมหาวิทยาลัย (EN) */
  nameEN: string;
  /** ที่อยู่ (TH) */
  addressTH: string;
  /** ที่อยู่ (EN) */
  addressEN: string;
  /** เลขประจำตัวผู้เสียภาษีอากร */
  taxId: string;
  /** URL สำหรับ Verify ใบเสร็จ/เอกสาร */
  receiptVerifyUrl: string;
}

const appPublicUrl = getPublicAppUrl();

export const buuInfo: UniversityInfo = {
  nameTH: 'มหาวิทยาลัยบูรพา',
  nameEN: 'BURAPHA UNIVERSITY',
  addressTH: '169 ถนนลงหาดบางแสน ตำบลแสนสุข อำเภอเมือง จังหวัดชลบุรี 20131',
  addressEN: '169 Longhad Bangsaen Road, Saensuk mueang, ChonBuri 20130',
  taxId: '0994000033100',
  receiptVerifyUrl: `${appPublicUrl.replace(/\/$/, '')}/#/verify`,
};
