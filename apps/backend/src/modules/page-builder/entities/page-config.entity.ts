import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum PageSectionType {
  BANNER = 'banner',
  CARD = 'card',
  STEP = 'step',
  EXAM_RULE = 'exam_rule',
}

/** ข้อความสองภาษา (ไทย/อังกฤษ) ในก้อน JSON */
export interface LocalizedText {
  th?: string | null;
  en?: string | null;
}

/** box ของ section ประเภท banner */
export interface BannerBoxContent {
  sortOrder: number;
  imagePath: string;
  active: boolean;
}

/** box ของ section ประเภท card */
export interface CardBoxContent {
  sortOrder: number;
  title?: LocalizedText;
  subtitle?: LocalizedText;
  icon?: string | null;
  active: boolean;
}

/** box ของ section ประเภท step */
export interface StepBoxContent {
  sortOrder: number;
  title?: LocalizedText;
  description?: LocalizedText;
  active: boolean;
}

/** box ของ section ประเภท exam_rule */
export interface ExamRuleBoxContent {
  sortOrder: number;
  icon?: string | null;
  text?: LocalizedText;
  active: boolean;
}

export type BoxContent =
  BannerBoxContent | CardBoxContent | StepBoxContent | ExamRuleBoxContent;

/** หนึ่ง section พร้อม box ทั้งหมดในตัว */
export interface PageSectionContent {
  type: PageSectionType;
  icon?: string | null;
  sortOrder: number;
  title?: LocalizedText;
  active: boolean;
  boxes: BoxContent[];
}

/** โครงสร้างทั้งหมดของหน้า เก็บในคอลัมน์ PCF_CONTENT */
export interface PageContent {
  sections: PageSectionContent[];
}

@Entity('BUU_GET_T_PAGE_CONFIGS')
export class PageConfig {
  @PrimaryGeneratedColumn({ name: 'PCF_ID', comment: 'รหัสหน้า' })
  PCF_ID: number;

  @Column({
    name: 'PCF_CONTENT',
    type: 'json',
    nullable: true,
    comment: 'โครงสร้าง sections + boxes ทั้งหมดของหน้า',
  })
  PCF_CONTENT: PageContent | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไขล่าสุด' })
  UPDATED_AT: Date;

  @DeleteDateColumn({
    name: 'DELETED_AT',
    nullable: true,
    comment: 'วันที่ลบ (Soft Delete)',
  })
  DELETED_AT: Date | null;
}
