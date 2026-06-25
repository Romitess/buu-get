import { BadRequestException, Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from './entities/exam-enrollment.entity';
import { Exam } from '../exam/entities/exam.entity';
import { UserPhysicalStatus } from '../user-profile/entities/user-profile.entity';

const MAX_TEST_TAKER_SEQUENCE = 999;

@Injectable()
export class TestTakerIdService {
  async assign(manager: EntityManager, enrollmentIds: number[]): Promise<void> {
    if (enrollmentIds.length === 0) return;

    const selectedEnrollments = await manager
      .getRepository(ExamEnrollment)
      .find({
        where: { ERM_ID: In(enrollmentIds) },
        relations: ['SESSION', 'SESSION.EXAM', 'USER', 'USER.PROFILE'],
      });
    const enrollmentsByExam = new Map<number, ExamEnrollment[]>();

    for (const enrollment of selectedEnrollments) {
      const examId = enrollment.SESSION?.EXAM_ID;
      if (!examId || !enrollment.SESSION.EXAM) {
        throw new BadRequestException(
          `Exam data is missing for enrollment ${enrollment.ERM_ID}`,
        );
      }

      const examEnrollments = enrollmentsByExam.get(examId) ?? [];
      examEnrollments.push(enrollment);
      enrollmentsByExam.set(examId, examEnrollments);
    }

    for (const [examId, selectedForExam] of enrollmentsByExam) {
      const allEligibleEnrollments = await manager
        .getRepository(ExamEnrollment)
        .createQueryBuilder('enrollment')
        .setLock('pessimistic_write')
        .innerJoinAndSelect('enrollment.SESSION', 'session')
        .innerJoinAndSelect('session.EXAM', 'exam')
        .innerJoinAndSelect('enrollment.USER', 'user')
        .leftJoinAndSelect('user.PROFILE', 'profile')
        .where('session.EXAM_ID = :examId', { examId })
        .andWhere('enrollment.ERM_STATUS IN (:...statuses)', {
          statuses: [
            ExamEnrollmentStatus.SEAT_ASSIGNED,
            ExamEnrollmentStatus.SEAT_PUBLISHED,
          ],
        })
        .getMany();

      const sortedEnrollments = allEligibleEnrollments.sort((left, right) => {
        return this.compareByExamSchedule(left, right);
      });

      if (sortedEnrollments.length > MAX_TEST_TAKER_SEQUENCE) {
        throw new BadRequestException(
          `Exam ${examId} has more than ${MAX_TEST_TAKER_SEQUENCE} eligible test takers`,
        );
      }

      const sequenceByErmId = new Map(
        sortedEnrollments.map((enrollment, index) => [
          enrollment.ERM_ID,
          index + 1,
        ]),
      );
      const exam = selectedForExam[0]?.SESSION.EXAM;
      if (!exam) {
        throw new BadRequestException(`Exam ${examId} not found`);
      }

      const codePrefix = this.buildPrefix(exam);
      for (const enrollment of allEligibleEnrollments) {
        const sequence = sequenceByErmId.get(enrollment.ERM_ID);
        if (!sequence) {
          throw new BadRequestException(
            `Enrollment ${enrollment.ERM_ID} is not eligible for a test taker ID`,
          );
        }

        const testTakerId = `${codePrefix}${this.getApplicantType(enrollment)}${sequence
          .toString()
          .padStart(3, '0')}`;
        enrollment.ERM_TEST_TAKER = testTakerId;
      }

      if (allEligibleEnrollments.length > 0) {
        await manager
          .getRepository(ExamEnrollment)
          .save(allEligibleEnrollments);
      }
    }
  }

  private buildPrefix(exam: Exam): string {
    if (!exam.EXAM_DATE) {
      throw new BadRequestException(
        `EXAM_DATE is required to generate a test taker ID for exam ${exam.EXAM_ID}`,
      );
    }

    const examDate = new Date(`${exam.EXAM_DATE}T00:00:00Z`);
    if (Number.isNaN(examDate.getTime())) {
      throw new BadRequestException(
        `Invalid EXAM_DATE for exam ${exam.EXAM_ID}`,
      );
    }

    const buddhistExamYear = examDate.getUTCFullYear() + 543;
    const examYearCode = buddhistExamYear.toString().slice(-2);
    const examTypeCode = this.getExamTypeCode(exam.EXAM_FORMAT, exam.EXAM_TYPE);
    const examSequenceCode = this.getExamRoundCode(exam);

    return `${examYearCode}${examTypeCode}${examSequenceCode}`;
  }

  private compareByExamSchedule(
    left: ExamEnrollment,
    right: ExamEnrollment,
  ): number {
    const leftStartTime = left.SESSION?.SS_START_TIME;
    const rightStartTime = right.SESSION?.SS_START_TIME;
    if (!leftStartTime || !rightStartTime) {
      throw new BadRequestException(
        `Session start time is required to create a test taker ID for enrollment ${!leftStartTime ? left.ERM_ID : right.ERM_ID}`,
      );
    }

    const leftSessionLocationId = left.SL_ID;
    const rightSessionLocationId = right.SL_ID;
    if (!leftSessionLocationId || !rightSessionLocationId) {
      throw new BadRequestException(
        `Session location is required to create a test taker ID for enrollment ${!leftSessionLocationId ? left.ERM_ID : right.ERM_ID}`,
      );
    }

    if (!left.ERM_SEAT_LABEL || !right.ERM_SEAT_LABEL) {
      throw new BadRequestException(
        `Seat label is required to create a test taker ID for enrollment ${!left.ERM_SEAT_LABEL ? left.ERM_ID : right.ERM_ID}`,
      );
    }

    return (
      leftStartTime.localeCompare(rightStartTime) ||
      leftSessionLocationId - rightSessionLocationId ||
      this.compareEnrollmentsBySeat(left, right) ||
      left.ERM_ID - right.ERM_ID
    );
  }

  private compareEnrollmentsBySeat(
    left: ExamEnrollment,
    right: ExamEnrollment,
  ): number {
    if (left.ERM_SORT_ORDER !== null && right.ERM_SORT_ORDER !== null) {
      if (left.ERM_SORT_ORDER !== right.ERM_SORT_ORDER) {
        return left.ERM_SORT_ORDER - right.ERM_SORT_ORDER;
      }
    }
    const leftPosition = this.parseSeatLabel(left.ERM_SEAT_LABEL);
    const rightPosition = this.parseSeatLabel(right.ERM_SEAT_LABEL);

    if (leftPosition && rightPosition) {
      return (
        leftPosition.letterOrder - rightPosition.letterOrder ||
        leftPosition.numberOrder - rightPosition.numberOrder
      );
    }
    if (leftPosition) return -1;
    if (rightPosition) return 1;

    return (left.ERM_SEAT_LABEL ?? '').localeCompare(
      right.ERM_SEAT_LABEL ?? '',
    );
  }

  private parseSeatLabel(
    label: string | null | undefined,
  ): { letterOrder: number; numberOrder: number } | null {
    const match = label
      ?.trim()
      .toUpperCase()
      .match(/^([A-Z]+)(\d+)$/u);
    if (!match?.[1] || !match[2]) return null;

    const letterOrder = match[1].split('').reduce((total, letter) => {
      return total * 26 + (letter.charCodeAt(0) - 64);
    }, 0);
    const numberOrder = Number(match[2]);

    return Number.isInteger(numberOrder) ? { letterOrder, numberOrder } : null;
  }

  private getExamRoundCode(exam: Exam): string {
    const examRound = exam.EXAM_ROUND?.trim();
    if (!examRound) {
      throw new BadRequestException(
        `EXAM_ROUND is required to generate a test taker ID for exam ${exam.EXAM_ID}`,
      );
    }

    const roundMatch = examRound.match(/^(\d+)/u);
    if (!roundMatch?.[1]) {
      throw new BadRequestException(
        `Invalid EXAM_ROUND '${examRound}' for exam ${exam.EXAM_ID}`,
      );
    }

    const roundNumber = Number(roundMatch[1]);
    if (!Number.isInteger(roundNumber) || roundNumber < 1 || roundNumber > 99) {
      throw new BadRequestException(
        `EXAM_ROUND must start with a number from 1 to 99 for exam ${exam.EXAM_ID}`,
      );
    }

    return roundNumber.toString().padStart(2, '0');
  }

  private getExamTypeCode(examFormat: string, examType: string): number {
    const normalizedFormat = examFormat?.trim().toLowerCase();
    const normalizedType = examType?.trim().toLowerCase();
    const isPaper =
      normalizedFormat === 'กระดาษ' || normalizedFormat === 'paper';
    const isComputer =
      normalizedFormat === 'คอมพิวเตอร์' || normalizedFormat === 'computer';
    const isGeneral =
      normalizedType === 'รอบทั่วไป' || normalizedType === 'general';
    const isSpecial =
      normalizedType === 'รอบพิเศษ' || normalizedType === 'special';

    if ((!isPaper && !isComputer) || (!isGeneral && !isSpecial)) {
      throw new BadRequestException(
        `Unsupported exam format or type: ${examFormat}/${examType}`,
      );
    }

    if (isPaper) return isGeneral ? 1 : 2;
    return isGeneral ? 3 : 4;
  }

  private getApplicantType(enrollment: ExamEnrollment): number {
    const physicalStatus = enrollment.ERM_PHYSICAL_STATUS;
    if (
      physicalStatus === UserPhysicalStatus.MONK ||
      physicalStatus === UserPhysicalStatus.RELIGIOUS
    ) {
      return 1;
    }
    if (
      physicalStatus === UserPhysicalStatus.DISABLED ||
      physicalStatus === UserPhysicalStatus.DISABLED_TYPO
    ) {
      return 2;
    }
    if (enrollment.USER?.USER_PASSPORT_NO) return 3;
    if (enrollment.USER?.USER_NATIONAL_ID) return 4;

    throw new BadRequestException(
      `National ID or passport is required for enrollment ${enrollment.ERM_ID}`,
    );
  }
}
