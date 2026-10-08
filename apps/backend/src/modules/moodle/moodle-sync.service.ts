import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EntityManager } from 'typeorm';
import { MoodleClientService } from './moodle-client.service';
import { MoodleAction } from '../moodle-sync-logs/entities/moodle-sync-log.entity';
import {
  MoodleCourseInput,
  MoodleCreatedCourse,
  MoodleCreatedUser,
  MoodleEnrolmentInput,
  MoodleLogMeta,
  MoodleUserInput,
  MoodleUserUpdateInput,
} from './types/moodle.types';

const DEFAULT_STUDENT_ROLEID = 5;
const DEFAULT_COURSE_CATEGORY_ID = 1;

/**
 * High-level Moodle sync — เรียก WS function ของระบบ แล้วคืน id ที่ map ได้
 */
@Injectable()
export class MoodleSyncService {
  constructor(
    private readonly client: MoodleClientService,
    private readonly configService: ConfigService,
  ) {}

  get studentRoleId(): number {
    return (
      this.configService.get<number>('MOODLE_STUDENT_ROLEID') ??
      DEFAULT_STUDENT_ROLEID
    );
  }

  get courseCategoryId(): number {
    return (
      this.configService.get<number>('MOODLE_COURSE_CATEGORY_ID') ??
      DEFAULT_COURSE_CATEGORY_ID
    );
  }

  /** core_course_create_courses → คืน Moodle course id */
  async createCourse(
    input: MoodleCourseInput,
    meta: MoodleLogMeta,
  ): Promise<number> {
    const data = await this.client.call<MoodleCreatedCourse[]>(
      MoodleAction.CORE_COURSE_CREATE_COURSES,
      { courses: [input] },
      meta,
    );
    const id = data?.[0]?.id;
    if (!id) {
      throw new Error('Moodle ไม่ได้คืน course id');
    }
    return id;
  }

  /** core_user_create_users → คืน Moodle user id */
  async createUser(
    input: MoodleUserInput,
    meta: MoodleLogMeta,
    manager?: EntityManager,
  ): Promise<number> {
    const data = await this.client.call<MoodleCreatedUser[]>(
      MoodleAction.CORE_USER_CREATE_USERS,
      { users: [{ auth: 'manual', ...input }] },
      meta,
      manager,
    );
    const id = data?.[0]?.id;
    if (!id) {
      throw new Error('Moodle ไม่ได้คืน user id');
    }
    return id;
  }

  /** core_user_update_users → อัปเดตผู้ใช้ใน Moodle; Moodle ไม่คืน response body */
  async updateUser(
    moodleUserId: number,
    input: MoodleUserUpdateInput,
    meta: MoodleLogMeta,
  ): Promise<void> {
    await this.client.call<null>(
      MoodleAction.CORE_USER_UPDATE_USERS,
      { users: [{ id: moodleUserId, ...input }] },
      meta,
    );
  }

  /** core_user_delete_users → ลบผู้ใช้ใน Moodle (batch); Moodle ไม่คืน response body */
  async deleteUsers(
    userIds: number[],
    meta: MoodleLogMeta,
    manager?: EntityManager,
  ): Promise<void> {
    if (userIds.length === 0) {
      return;
    }
    await this.client.call<null>(
      MoodleAction.CORE_USER_DELETE_USERS,
      { userids: userIds },
      meta,
      manager,
    );
  }

  /** enrol_manual_enrol_users → ลงทะเบียนผู้ใช้เข้าคอร์ส (batch); Moodle คืน null */
  async enrolUsers(
    enrolments: MoodleEnrolmentInput[],
    meta: MoodleLogMeta,
  ): Promise<void> {
    if (enrolments.length === 0) {
      return;
    }
    await this.client.call<null>(
      MoodleAction.ENROL_MANUAL_ENROL_USERS,
      { enrolments },
      meta,
    );
  }

  /** gradereport_user_get_grade_items → ดึงคะแนนของผู้ใช้ในคอร์ส (read-only) */
  async getUserGradeItems(
    courseid: number,
    userid: number,
    meta: MoodleLogMeta,
  ): Promise<Record<string, unknown>> {
    return this.client.call<Record<string, unknown>>(
      MoodleAction.GRADEREPORT_USER_GET_GRADE_ITEMS,
      { courseid, userid },
      meta,
    );
  }
}
