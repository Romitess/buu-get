/**
 * Types สำหรับ Page Builder (หน้าแรกของระบบ)
 * mirror โครงสร้างจาก backend module page-builder
 */

export enum PageSectionType {
  BANNER = 'banner',
  CARD = 'card',
  STEP = 'step',
  EXAM_RULE = 'exam_rule',
}

/** ข้อความสองภาษา (ไทย/อังกฤษ) */
export interface LocalizedText {
  th?: string | null;
  en?: string | null;
}

export interface BannerBoxContent {
  sortOrder: number;
  imagePath: string;
  active: boolean;
}

export interface CardBoxContent {
  sortOrder: number;
  title?: LocalizedText;
  subtitle?: LocalizedText;
  icon?: string | null;
  active: boolean;
}

export interface StepBoxContent {
  sortOrder: number;
  title?: LocalizedText;
  description?: LocalizedText;
  active: boolean;
}

export interface ExamRuleBoxContent {
  sortOrder: number;
  icon?: string | null;
  text?: LocalizedText;
  active: boolean;
}

/**
 * รูปแบบ box สำหรับ editor ของ section ที่เป็น "หัวข้อ + เนื้อหา"
 * (รูปแบบการทดสอบ → card, ขั้นตอนการสมัครสอบ → step)
 * composable เป็นผู้ map ฟิลด์ content ไปเป็น subtitle/description ตอนบันทึก
 */
export interface ContentBoxContent {
  sortOrder: number;
  title: LocalizedText;
  content: LocalizedText;
  active: boolean;
}

export type BoxContent = BannerBoxContent | CardBoxContent | StepBoxContent | ExamRuleBoxContent;

export interface PageSectionContent {
  type: PageSectionType;
  icon?: string | null;
  sortOrder: number;
  title?: LocalizedText;
  active: boolean;
  boxes: BoxContent[];
}

export interface PageContent {
  sections: PageSectionContent[];
}

/** state ของ section ใน editor (แยกตามชนิด box ที่ถืออยู่) */
export interface EditorSection<T> {
  type: PageSectionType;
  title: LocalizedText;
  active: boolean;
  boxes: T[];
}

/** payload ที่ backend คืนกลับ (GET /page-builder/homepage) */
export interface PageConfigResponse {
  PCF_ID: number;
  PCF_CONTENT: PageContent | null;
  CREATED_AT?: string;
  UPDATED_AT?: string;
}
