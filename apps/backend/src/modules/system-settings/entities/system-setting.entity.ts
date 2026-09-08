import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('SYS_T_SYSTEM_SETTINGS')
export class SystemSetting {
  @PrimaryGeneratedColumn({ name: 'SS_ID', comment: 'รหัสการตั้งค่า' })
  SS_ID: number;

  @Index({ unique: true })
  @Column({
    name: 'SETTING_KEY',
    type: 'varchar',
    length: 100,
    comment: 'คีย์การตั้งค่า (เช่น exam.defaultFeeThb)',
  })
  SETTING_KEY: string;

  @Column({
    name: 'SETTING_GROUP',
    type: 'varchar',
    length: 50,
    comment: 'กลุ่ม (exam/payment/certificate/org/email)',
  })
  SETTING_GROUP: string;

  @Column({
    name: 'SETTING_VALUE',
    type: 'text',
    comment: 'ค่าที่เก็บเป็นข้อความ (parse ตาม SETTING_TYPE)',
  })
  SETTING_VALUE: string;

  @Column({
    name: 'SETTING_TYPE',
    type: 'varchar',
    length: 20,
    comment: 'ชนิดข้อมูล: number | string | integer | boolean',
  })
  SETTING_TYPE: string;

  @Column({
    name: 'UPDATED_BY',
    type: 'int',
    nullable: true,
    comment: 'USER_ID ผู้แก้ไขล่าสุด',
  })
  UPDATED_BY: number | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  CREATED_AT: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไขล่าสุด' })
  UPDATED_AT: Date;
}
