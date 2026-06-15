import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('BUU_GET_T_PROFILE_EDIT_HISTORY')
export class ProfileEditHistory {
  @PrimaryGeneratedColumn({
    name: 'PROFILE_EDIT_HISTORY_ID',
    comment: 'รหัสประวัติการแก้ไข',
  })
  profileEditHistoryId: number;

  @Column({ name: 'USER_PROFILE_ID', type: 'int', comment: 'รหัสโปรไฟล์ (FK)' })
  userProfileId: number;

  @Column({
    name: 'MODIFIER_ID',
    type: 'int',
    comment: 'ผู้ดำเนินการแก้ไข (FK)',
  })
  modifierId: number;

  @Column({
    name: 'MODIFIER_NAME',
    type: 'varchar',
    length: 200,
    comment: 'ชื่อผู้ดำเนินการแก้ไข',
  })
  modifierName: string;

  @Column({
    name: 'MODIFIER_ROLE',
    type: 'varchar',
    length: 100,
    comment: 'สถานะ/บทบาทผู้แก้ไข (เช่น เจ้าหน้าที่, ผู้สมัครสอบ)',
  })
  modifierRole: string;

  @Column({
    name: 'MODIFIED_FIELDS',
    type: 'varchar',
    length: 500,
    comment: 'ส่วนที่แก้ไข (เช่น ที่อยู่สำหรับจัดส่งเอกสาร)',
  })
  modifiedFields: string;

  @Column({
    name: 'OLD_VALUES',
    type: 'text',
    nullable: true,
    comment: 'ค่าเดิม (JSON)',
  })
  oldValues: string | null;

  @Column({
    name: 'NEW_VALUES',
    type: 'text',
    nullable: true,
    comment: 'ค่าใหม่ (JSON)',
  })
  newValues: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไขล่าสุด' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', nullable: true, comment: 'วันที่ลบ' })
  deletedAt: Date | null;
}
