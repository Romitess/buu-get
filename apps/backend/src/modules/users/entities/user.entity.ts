import { Exclude } from 'class-transformer';
import { Role } from 'src/modules/roles/entities/role.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BankReconcile } from '../../bank-reconciles/entities/bank-reconcile.entity';
import { ExamCertificate } from '../../exam-certificates/entities/exam-certificate.entity';
import { VoidedReceipt } from '../../voided-receipts/entities/voided-receipt.entity';
import { UserProfile } from '../../user-profile/entities/user-profile.entity';
import { UserImage } from '../../user-image/entities/user-image.entity';
import { MoodleSyncLog } from '../../moodle-sync-logs/entities/moodle-sync-log.entity';

@Entity({ name: 'BUU_GET_T_USER' })
export class User {
  @PrimaryGeneratedColumn({ name: 'USER_ID', comment: 'รหัสผู้สมัคร' })
  USER_ID: number;

  @Column({
    name: 'USER_CODE',
    type: 'varchar',
    length: 10,
    unique: true,
    nullable: true,
    comment: 'รหัสสมาชิก {ปีงบ พ.ศ. 4}{1 ไทย/2 ต่างชาติ}{รัน 5 หลัก}',
  })
  USER_CODE: string | null;

  @Column({
    name: 'USER_NATIONAL_ID',
    type: 'varchar',
    length: 13,
    unique: true,
    nullable: true,
    comment: 'หมายเลขบัตรประชาชน 13 หลัก',
  })
  USER_NATIONAL_ID: string | null;

  @Column({
    name: 'USER_PASSPORT_NO',
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
    comment: 'หมายเลขหนังสือเดินทาง',
  })
  USER_PASSPORT_NO: string | null;

  @Column({
    name: 'USER_EMAIL',
    type: 'varchar',
    length: 255,
    unique: true,
    comment: 'อีเมลของผู้ใช้',
  })
  USER_EMAIL: string;

  @Exclude()
  @Column({
    name: 'USER_PASSWORD',
    type: 'varchar',
    length: 255,
    comment: 'รหัสผ่านเข้ารหัส',
  })
  USER_PASSWORD: string;

  @Column({
    name: 'USER_STATUS',
    type: 'varchar',
    length: 20,
    comment: 'สถานะผู้ใช้ (ACTIVE, INACTIVE, BLOCKED)',
  })
  USER_STATUS: string;

  @Column({
    name: 'USER_MOODLE_ID',
    type: 'int',
    nullable: true,
    unique: true,
    comment: 'รหัสผู้ใช้ฝั่ง Moodle',
  })
  USER_MOODLE_ID: number | null;

  @CreateDateColumn({
    name: 'CREATED_AT',
    comment: 'วันที่สร้างบัญชี',
  })
  CREATED_AT: Date;

  @UpdateDateColumn({
    name: 'UPDATED_AT',
    comment: 'วันที่แก้ไขล่าสุด',
  })
  UPDATED_AT: Date;

  @DeleteDateColumn({
    name: 'DELETED_AT',
    nullable: true,
    comment: 'วันที่ลบ',
  })
  DELETED_AT: Date | null;

  @ManyToMany(() => Role, (role) => role.USER_ID)
  @JoinTable({
    name: 'USER_ROLES',
    joinColumn: {
      name: 'bUUGETTUSERUSERID',
      referencedColumnName: 'USER_ID',
    },
    inverseJoinColumn: {
      name: 'bUUGETTROLEROLEID',
      referencedColumnName: 'ROLE_ID',
    },
  })
  ROLES_ID: Role[];

  @OneToMany(() => BankReconcile, (reconcile) => reconcile.USER)
  BANK_RECONCILES: BankReconcile[];

  @OneToMany(() => ExamCertificate, (certificate) => certificate.USER)
  CERTIFICATES: ExamCertificate[];

  @OneToMany(() => VoidedReceipt, (voidedReceipt) => voidedReceipt.USER)
  VOIDED_RECEIPTS: VoidedReceipt[];

  @OneToOne(() => UserProfile, (profile) => profile.user)
  PROFILE: UserProfile;

  @OneToOne(() => UserImage, (image) => image.USER)
  IMAGE: UserImage;

  @OneToMany(() => MoodleSyncLog, (log) => log.USER)
  MOODLE_SYNC_LOGS: MoodleSyncLog[];
}
