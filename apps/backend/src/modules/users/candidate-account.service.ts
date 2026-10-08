import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  buildPaginatedResponse,
  PaginatedResponse,
} from 'src/common/dto/paginated-response.dto';
import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
} from 'src/common/dto/pagination-query.dto';
import { ExamCertificate } from '../exam-certificates/entities/exam-certificate.entity';
import { ExamEnrollment } from '../exam-enrollments/entities/exam-enrollment.entity';
import { ExamEnrollmentAuditLog } from '../enrollment-audit/entities/exam-enrollment-audit-log.entity';
import { ExamScore } from '../exam-scores/entities/exam-score.entity';
import { ExamScoreLine } from '../exam-scores/entities/exam-score-line.entity';
import { ExamVoucher } from '../exam-vouchers/entities/exam-voucher.entity';
import { MoodleSyncService } from '../moodle/moodle-sync.service';
import { MoodleUserUpdateInput } from '../moodle/types/moodle.types';
import { NotificationRecipient } from '../notifications/entities/notification-recipient.entity';
import { ProfileEditHistory } from '../profile-edit-history/entities/profile-edit-history.entity';
import { Receipt } from '../receipts/entities/receipt.entity';
import { RoleEnum } from '../roles/enums/role.enum';
import { parseThaidBirthdate } from '../thaid/thaid-jwt';
import { TransactionProfile } from '../transaction-profiles/entities/transaction-profile.entity';
import { TransactionRef } from '../transaction-refs/entities/transaction-ref.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { UserImage } from '../user-image/entities/user-image.entity';
import { UserProfile } from '../user-profile/entities/user-profile.entity';
import { CandidateAccountResponseDto } from './dto/candidate-account-response.dto';
import { UpdateCandidateAccountDto } from './dto/update-candidate-account.dto';
import { UsersQueryDto } from './dto/users-query.dto';
import { User } from './entities/user.entity';

@Injectable()
export class CandidateAccountService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly moodleSyncService: MoodleSyncService,
  ) {}

  async findCandidates(
    query: UsersQueryDto = {},
  ): Promise<PaginatedResponse<CandidateAccountResponseDto>> {
    const page = query.page ?? PAGINATION_DEFAULT_PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.PROFILE', 'profile')
      .innerJoin('user.ROLES_ID', 'role', 'role.ROLE_NAME = :role', {
        role: RoleEnum.CANDIDATE,
      });

    const search = query.search?.trim();
    if (search) {
      const searchPattern = `%${search}%`;
      const searchLower = `%${search.toLowerCase()}%`;
      queryBuilder.andWhere(
        `(user.USER_NATIONAL_ID LIKE :searchPattern
          OR user.USER_PASSPORT_NO LIKE :searchPattern
          OR LOWER(user.USER_EMAIL) LIKE :searchLower
          OR LOWER(profile.userFullnameTh) LIKE :searchLower
          OR LOWER(profile.userFullnameEn) LIKE :searchLower)`,
        { searchPattern, searchLower },
      );
    }

    const [users, total] = await queryBuilder
      .orderBy('user.CREATED_AT', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return buildPaginatedResponse(
      users.map((user) => this.toResponse(user)),
      total,
      page,
      limit,
    );
  }

  async updateCandidate(
    userId: number,
    dto: UpdateCandidateAccountDto,
  ): Promise<CandidateAccountResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { USER_ID: userId },
      relations: ['PROFILE'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.PROFILE?.userRegisteredViaThaid) {
      throw new BadRequestException(
        'บัญชีที่สมัครผ่าน ThaiD แก้ไขจากหน้านี้ไม่ได้',
      );
    }

    const nextEmail = dto.email?.trim().toLowerCase();
    if (nextEmail && nextEmail !== user.USER_EMAIL.toLowerCase()) {
      const duplicateEmail = await this.usersRepository.findOne({
        where: { USER_EMAIL: nextEmail },
        withDeleted: true,
      });
      if (duplicateEmail && duplicateEmail.USER_ID !== userId) {
        throw new ConflictException('อีเมลนี้ถูกใช้งานแล้ว');
      }
    }

    const nextNationalId = dto.userNationalId?.trim();
    if (nextNationalId && nextNationalId !== (user.USER_NATIONAL_ID ?? '')) {
      const duplicateId = await this.usersRepository.findOne({
        where: { USER_NATIONAL_ID: nextNationalId },
        withDeleted: true,
      });
      if (duplicateId && duplicateId.USER_ID !== userId) {
        throw new ConflictException('เลขบัตรประชาชนนี้ถูกใช้งานแล้ว');
      }
    }

    const moodlePatch = this.buildMoodlePatch(user, dto, nextEmail);
    if (user.USER_MOODLE_ID != null && this.hasMoodlePatch(moodlePatch)) {
      try {
        await this.moodleSyncService.updateUser(
          user.USER_MOODLE_ID,
          moodlePatch,
          {
            userId: user.USER_ID,
            refType: 'user',
            refId: user.USER_ID,
            moodleRefId: user.USER_MOODLE_ID,
          },
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Moodle update failed';
        throw new BadRequestException(message);
      }
    }

    await this.dataSource.transaction(async (manager) => {
      if (nextEmail && nextEmail !== user.USER_EMAIL.toLowerCase()) {
        await manager.update(
          User,
          { USER_ID: userId },
          { USER_EMAIL: nextEmail },
        );
      }
      if (dto.userNationalId !== undefined) {
        await manager.update(
          User,
          { USER_ID: userId },
          { USER_NATIONAL_ID: nextNationalId || null },
        );
      }

      const profilePatch = this.profilePatch(dto);
      let profile = await manager.findOne(UserProfile, {
        where: { userId },
      });
      if (!profile) {
        profile = manager.create(UserProfile, {
          userId,
          userRegisteredViaThaid: false,
          userThaidSynced: false,
        });
      }
      Object.assign(profile, profilePatch);
      await manager.save(UserProfile, profile);
    });

    const updated = await this.usersRepository.findOne({
      where: { USER_ID: userId },
      relations: ['PROFILE'],
    });
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return this.toResponse(updated);
  }

  /**
   * ลบผู้ใช้ใน Moodle ก่อน แล้ว soft-delete ประวัติและบัญชีในธุรกรรมเดียว
   * ถ้า Moodle ล้มเหลว จะไม่แตะข้อมูลในระบบ
   */
  async purgeCandidate(userId: number): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { USER_ID: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.USER_MOODLE_ID != null) {
      await this.moodleSyncService.deleteUsers([user.USER_MOODLE_ID], {
        userId: user.USER_ID,
        refType: 'user',
        refId: user.USER_ID,
        moodleRefId: user.USER_MOODLE_ID,
      });
    }

    await this.dataSource.transaction(async (manager) => {
      const enrollments = await manager.find(ExamEnrollment, {
        where: { USER_ID: userId },
        select: ['ERM_ID'],
      });
      const ermIds = enrollments.map((enrollment) => enrollment.ERM_ID);
      if (ermIds.length > 0) {
        const scores = await manager.find(ExamScore, {
          where: { ERM_ID: In(ermIds) },
          select: ['SCORES_ID'],
        });
        const scoreIds = scores.map((score) => score.SCORES_ID);
        if (scoreIds.length > 0) {
          await manager.softDelete(ExamScoreLine, {
            SCORES_ID: In(scoreIds),
          });
          await manager.softDelete(ExamScore, { SCORES_ID: In(scoreIds) });
        }
        await manager.softDelete(ExamVoucher, { ERM_ID: In(ermIds) });
        const transactions = await manager.find(Transaction, {
          where: { ERM_ID: In(ermIds) },
          select: ['TRANX_ID'],
        });
        const transactionIds = transactions.map(
          (transaction) => transaction.TRANX_ID,
        );
        if (transactionIds.length > 0) {
          await manager.softDelete(Receipt, {
            TRANX_ID: In(transactionIds),
          });
          await manager.softDelete(TransactionRef, {
            TRANX_ID: In(transactionIds),
          });
          await manager.softDelete(TransactionProfile, {
            TRANX_ID: In(transactionIds),
          });
          await manager.softDelete(Transaction, {
            TRANX_ID: In(transactionIds),
          });
        }
        await manager.softDelete(ExamEnrollment, { ERM_ID: In(ermIds) });
      }

      await manager.delete(ExamEnrollmentAuditLog, { USER_ID: userId });
      await manager.softDelete(ExamCertificate, { USER_ID: userId });

      const profile = await manager.findOne(UserProfile, {
        where: { userId },
      });
      if (profile) {
        await manager.softDelete(ProfileEditHistory, {
          userProfileId: profile.userProfileId,
        });
        await manager.softDelete(UserProfile, {
          userProfileId: profile.userProfileId,
        });
      }

      await manager.delete(UserImage, { USER_ID: userId });
      await manager.softDelete(NotificationRecipient, { USER_ID: userId });
      await manager.softDelete(User, { USER_ID: userId });
    });
  }

  private buildMoodlePatch(
    user: User,
    dto: UpdateCandidateAccountDto,
    nextEmail: string | undefined,
  ): MoodleUserUpdateInput {
    const profile = user.PROFILE;
    const patch: MoodleUserUpdateInput = {};
    const nextTh = dto.userFullnameTh ?? profile?.userFullnameTh ?? '';
    const nextEn = dto.userFullnameEn ?? profile?.userFullnameEn ?? '';
    const currentTh = profile?.userFullnameTh ?? '';
    const currentEn = profile?.userFullnameEn ?? '';
    if (nextTh !== currentTh || nextEn !== currentEn) {
      const derived = deriveMoodleName(
        nextEn || nextTh,
        nextEmail ?? user.USER_EMAIL,
      );
      patch.firstname = derived.firstname;
      patch.lastname = derived.lastname;
    }
    if (nextEmail && nextEmail !== user.USER_EMAIL.toLowerCase()) {
      patch.email = nextEmail;
      patch.username = nextEmail;
    }
    const nextNationalId = dto.userNationalId?.trim();
    if (nextNationalId && nextNationalId !== (user.USER_NATIONAL_ID ?? '')) {
      patch.idnumber = nextNationalId;
    }
    return patch;
  }

  private hasMoodlePatch(patch: MoodleUserUpdateInput): boolean {
    return Object.keys(patch).length > 0;
  }

  private profilePatch(dto: UpdateCandidateAccountDto): Partial<UserProfile> {
    const patch: Partial<UserProfile> = {};
    if (dto.userTitleTh !== undefined) patch.userTitleTh = dto.userTitleTh;
    if (dto.userFullnameTh !== undefined) {
      patch.userFullnameTh = dto.userFullnameTh;
    }
    if (dto.userTitleEn !== undefined) patch.userTitleEn = dto.userTitleEn;
    if (dto.userFullnameEn !== undefined) {
      patch.userFullnameEn = dto.userFullnameEn;
    }
    if (dto.userDateOfBirth !== undefined) {
      patch.userDateOfBirth = parseThaidBirthdate(dto.userDateOfBirth);
    }
    if (dto.userPhone !== undefined) patch.userPhone = dto.userPhone;
    if (dto.userEducation !== undefined)
      patch.userEducation = dto.userEducation;
    if (dto.userFaculty !== undefined) patch.userFaculty = dto.userFaculty;
    if (dto.userInstitution !== undefined) {
      patch.userInstitution = dto.userInstitution;
    }
    if (dto.userCountry !== undefined) patch.userCountry = dto.userCountry;
    if (dto.userAddress !== undefined) patch.userAddress = dto.userAddress;
    if (dto.userRemark !== undefined) patch.userRemark = dto.userRemark;
    return patch;
  }

  private toResponse(user: User): CandidateAccountResponseDto {
    const profile = user.PROFILE;
    return {
      userId: user.USER_ID,
      userCode: user.USER_CODE,
      email: user.USER_EMAIL,
      nationalId: user.USER_NATIONAL_ID,
      passportNo: user.USER_PASSPORT_NO,
      titleTh: profile?.userTitleTh ?? null,
      fullNameTh: profile?.userFullnameTh ?? null,
      titleEn: profile?.userTitleEn ?? null,
      fullNameEn: profile?.userFullnameEn ?? null,
      dateOfBirth: formatBirthdate(profile?.userDateOfBirth ?? null),
      phone: profile?.userPhone ?? null,
      education: profile?.userEducation ?? null,
      faculty: profile?.userFaculty ?? null,
      institution: profile?.userInstitution ?? null,
      country: profile?.userCountry ?? null,
      address: profile?.userAddress ?? null,
      remark: profile?.userRemark ?? null,
      registeredViaThaid: profile?.userRegisteredViaThaid === true,
      moodleId: user.USER_MOODLE_ID,
    };
  }
}

function deriveMoodleName(
  fullName: string,
  email: string,
): { firstname: string; lastname: string } {
  const source = fullName.trim();
  if (source) {
    const parts = source.split(/\s+/);
    if (parts.length >= 2) {
      const lastname = parts.slice(1).join(' ');
      return {
        firstname: parts[0] ?? source,
        lastname,
      };
    }
    return { firstname: source, lastname: source };
  }
  const local = email.split('@')[0] || 'user';
  return { firstname: local, lastname: local };
}

function formatBirthdate(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
