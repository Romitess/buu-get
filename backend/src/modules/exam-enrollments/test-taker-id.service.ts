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

      const enrollmentWithoutEnglishName = allEligibleEnrollments.find(
        (enrollment) => !enrollment.USER?.PROFILE?.userFullnameEn?.trim(),
      );
      if (enrollmentWithoutEnglishName) {
        throw new BadRequestException(
          `English name is required for enrollment ${enrollmentWithoutEnglishName.ERM_ID}`,
        );
      }

      const sortedEnrollments = allEligibleEnrollments.sort((left, right) => {
        const leftName = left.USER.PROFILE.userFullnameEn?.trim() ?? '';
        const rightName = right.USER.PROFILE.userFullnameEn?.trim() ?? '';
        const nameComparison = leftName.localeCompare(rightName, 'en', {
          sensitivity: 'base',
        });
        return nameComparison || left.ERM_ID - right.ERM_ID;
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
      const enrollmentsToSave = selectedForExam.filter(
        (enrollment) => !enrollment.ERM_TEST_TAKER,
      );
      const assignedCodeOwners = new Map(
        allEligibleEnrollments
          .filter((enrollment) => Boolean(enrollment.ERM_TEST_TAKER))
          .map((enrollment) => [
            enrollment.ERM_TEST_TAKER as string,
            enrollment.ERM_ID,
          ]),
      );

      for (const enrollment of enrollmentsToSave) {
        const sequence = sequenceByErmId.get(enrollment.ERM_ID);
        if (!sequence) {
          throw new BadRequestException(
            `Enrollment ${enrollment.ERM_ID} is not eligible for a test taker ID`,
          );
        }

        const testTakerId = `${codePrefix}${this.getApplicantType(enrollment)}${sequence
          .toString()
          .padStart(3, '0')}`;
        const existingOwner = assignedCodeOwners.get(testTakerId);
        if (existingOwner && existingOwner !== enrollment.ERM_ID) {
          throw new BadRequestException(
            `Test taker ID ${testTakerId} is already assigned to enrollment ${existingOwner}`,
          );
        }

        enrollment.ERM_TEST_TAKER = testTakerId;
        assignedCodeOwners.set(testTakerId, enrollment.ERM_ID);
      }

      if (enrollmentsToSave.length > 0) {
        await manager.getRepository(ExamEnrollment).save(enrollmentsToSave);
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
