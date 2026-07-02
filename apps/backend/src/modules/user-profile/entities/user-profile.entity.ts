import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum UserPhysicalStatus {
  MONK = 'พระภิกษุ / สามเณร',
  RELIGIOUS = 'นักบวช / ศาสนบุคคล',
  DISABLED = 'บุคคลทุพพลภาพ',
  PREGNANT = 'ผู้ตั้งครรภ์',
  DISABLED_TYPO = 'ผู้พิการรณ์',
  GENERAL = 'ทั่วไป',
}

@Entity('BUU_GET_T_USER_PROFILE')
export class UserProfile {
  @PrimaryGeneratedColumn({ name: 'USER_PROFILE_ID' })
  userProfileId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'USER_ID' })
  user: User;

  @Column({ name: 'USER_ID', type: 'int', comment: 'รหัสผู้ใช้' })
  userId: number;

  @Column({
    name: 'USER_TITLE_TH',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'คำนำหน้าชื่อภาษาไทย',
  })
  userTitleTh: string | null;

  @Column({
    name: 'USER_FULLNAME_TH',
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'ชื่อ-นามสกุล ภาษาไทย',
  })
  userFullnameTh: string | null;

  @Column({
    name: 'USER_TITLE_EN',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'คำนำหน้าชื่อภาษาอังกฤษ',
  })
  userTitleEn: string | null;

  @Column({
    name: 'USER_FULLNAME_EN',
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'ชื่อ-นามสกุล ภาษาอังกฤษ',
  })
  userFullnameEn: string | null;

  @Column({
    name: 'USER_DATE_OF_BIRTH',
    type: 'date',
    nullable: true,
    comment: 'วันเกิด',
  })
  userDateOfBirth: Date | null;

  @Column({
    name: 'USER_PHONE',
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'เบอร์โทรศัพท์',
  })
  userPhone: string | null;

  @Column({
    name: 'USER_EDUCATION',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ระดับการศึกษา',
  })
  userEducation: string | null;

  @Column({
    name: 'USER_FACULTY',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'คณะ',
  })
  userFaculty: string | null;

  @Column({
    name: 'USER_INSTITUTION',
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'ชื่อสถานศึกษา',
  })
  userInstitution: string | null;

  @Column({
    name: 'USER_COUNTRY',
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ประเทศ',
  })
  userCountry: string | null;

  @Column({
    name: 'USER_ADDRESS',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'ที่อยู่',
  })
  userAddress: string | null;

  @Column({
    name: 'USER_THAID_SYNCED',
    type: 'boolean',
    default: false,
    comment: 'วันที่ซิงค์กับTHAID',
  })
  userThaidSynced: boolean;

  @Column({
    name: 'USER_REMARK',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'หมายเหตุถึงผู้สมัคร/แจ้งแก้ไขข้อมูล',
  })
  userRemark: string | null;

  @CreateDateColumn({ name: 'CREATED_AT', comment: 'วันที่สร้าง' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT', comment: 'วันที่แก้ไข' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'DELETED_AT', nullable: true, comment: 'วันที่ลบ' })
  deletedAt: Date | null;
}
