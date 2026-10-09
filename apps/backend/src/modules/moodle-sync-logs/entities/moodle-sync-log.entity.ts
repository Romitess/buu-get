import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MoodleAction {
  CORE_COURSE_CREATE_COURSES = 'core_course_create_courses',
  CORE_COURSE_DELETE_COURSES = 'core_course_delete_courses',
  CORE_USER_CREATE_USERS = 'core_user_create_users',
  CORE_USER_UPDATE_USERS = 'core_user_update_users',
  CORE_USER_DELETE_USERS = 'core_user_delete_users',
  ENROL_MANUAL_ENROL_USERS = 'enrol_manual_enrol_users',
  GRADEREPORT_USER_GET_GRADE_ITEMS = 'gradereport_user_get_grade_items',
}

@Entity({ name: 'BUU_GET_T_MOODLE_SYNC_LOG' })
export class MoodleSyncLog {
  @PrimaryGeneratedColumn({ name: 'ML_ID', comment: 'รหัสล็อกซิงก์ Moodle' })
  ML_ID: number;

  @Column({
    name: 'USER_ID',
    type: 'int',
    nullable: true,
    comment: 'รหัสผู้ใช้ (Foreign Key) ว่างได้เมื่อผู้กระทำเป็นบุคลากร',
  })
  USER_ID: number | null;

  @Column({
    name: 'ML_ACTION',
    type: 'enum',
    enum: MoodleAction,
    comment: 'การทำงานที่ซิงก์',
  })
  ML_ACTION: MoodleAction;

  @Column({
    name: 'ML_WS_FUNCTION',
    type: 'varchar',
    length: 100,
    comment: 'ฟังก์ชันเว็บบอร์ด / เว็บเซอร์วิส Moodle',
  })
  ML_WS_FUNCTION: string;

  @Column({
    name: 'ML_REQUEST_URL',
    type: 'varchar',
    length: 255,
    comment: 'URL ที่ส่งคำขอ',
  })
  ML_REQUEST_URL: string;

  @Column({
    name: 'ML_REQUEST_PAYLOAD',
    type: 'json',
    nullable: true,
    comment: 'Payload คำขอ',
  })
  ML_REQUEST_PAYLOAD: Record<string, unknown> | null;

  @Column({
    name: 'ML_RESPONSE_BODY',
    type: 'json',
    nullable: true,
    comment: 'Body คำตอบกลับ',
  })
  ML_RESPONSE_BODY: Record<string, unknown> | null;

  @Column({
    name: 'ML_HTTP_METHOD',
    type: 'varchar',
    length: 20,
    comment: 'HTTP Method (GET, POST, etc.)',
  })
  ML_HTTP_METHOD: string;

  @Column({
    name: 'ML_HTTP_STATUS',
    type: 'int',
    nullable: true,
    comment: 'HTTP Response Status Code',
  })
  ML_HTTP_STATUS: number | null;

  @Column({
    name: 'ML_ERROR_MASSAGE',
    type: 'text',
    nullable: true,
    comment: 'รายละเอียดข้อผิดพลาด (ถ้ามี)',
  })
  ML_ERROR_MASSAGE: string | null;

  @Column({
    name: 'ML_REF_TYPE',
    type: 'varchar',
    length: 50,
    comment: 'ประเภทอ้างอิง',
  })
  ML_REF_TYPE: string;

  @Column({
    name: 'ML_REF_ID',
    type: 'int',
    comment: 'ID อ้างอิงระบบภายใน',
  })
  ML_REF_ID: number;

  @Column({
    name: 'ML_MOODLE_REF_ID',
    type: 'int',
    comment: 'ID อ้างอิงระบบ Moodle',
  })
  ML_MOODLE_REF_ID: number;

  @CreateDateColumn({
    name: 'CREATED_AT',
    type: 'timestamp',
    comment: 'เวลาที่สร้างล็อก',
  })
  CREATED_AT: Date;

  @ManyToOne(() => User, (user) => user.MOODLE_SYNC_LOGS, { nullable: true })
  @JoinColumn({ name: 'USER_ID' })
  USER: User | null;
}
