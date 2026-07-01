import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, Not } from 'typeorm';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfile } from './entities/user-profile.entity';
import { ProfileEditHistoryService } from '../profile-edit-history/profile-edit-history.service';
import {
  ExamEnrollment,
  ExamVerifyStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { User } from '../users/entities/user.entity';
import { UserImage } from '../user-image/entities/user-image.entity';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly historyService: ProfileEditHistoryService,
  ) {}

  async create(
    createUserProfileDto: CreateUserProfileDto,
    manager?: EntityManager,
  ): Promise<UserProfile> {
    const repo = manager
      ? manager.getRepository(UserProfile)
      : this.userProfileRepository;
    const userProfile = repo.create(createUserProfileDto);
    return await repo.save(userProfile);
  }

  async findAll(): Promise<UserProfile[]> {
    return await this.userProfileRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<UserProfile> {
    const userProfile = await this.userProfileRepository.findOne({
      where: { userProfileId: id },
      relations: ['user', 'user.IMAGE'],
    });

    if (!userProfile) {
      throw new NotFoundException(`UserProfile #${id} not found`);
    }

    return userProfile;
  }
  async findByUserId(userId: number): Promise<UserProfile> {
    let userProfile = await this.userProfileRepository.findOne({
      where: { userId },
      relations: ['user', 'user.IMAGE'],
    });

    if (!userProfile) {
      // Check if user exists first to make sure it is a valid user ID
      const userExists = await this.userProfileRepository.manager.findOne(
        User,
        {
          where: { USER_ID: userId },
        },
      );
      if (!userExists) {
        throw new NotFoundException(
          `UserProfile for user #${userId} not found`,
        );
      }

      // Automatically create a blank profile for the existing user
      const newProfile = this.userProfileRepository.create({
        userId,
      });
      await this.userProfileRepository.save(newProfile);

      // Fetch the newly created profile with relations
      userProfile = await this.userProfileRepository.findOne({
        where: { userId },
        relations: ['user', 'user.IMAGE'],
      });

      if (!userProfile) {
        throw new NotFoundException(
          `UserProfile for user #${userId} not found`,
        );
      }
    }

    return userProfile;
  }

  async update(
    id: number,
    updateUserProfileDto: UpdateUserProfileDto,
    modifier?: {
      modifierId: number;
      modifierName: string;
      modifierRole: string;
    },
  ): Promise<UserProfile> {
    const userProfile = await this.findOne(id);
    if (updateUserProfileDto.userAddress !== undefined) {
      updateUserProfileDto.userAddress =
        updateUserProfileDto.userAddress?.trim() || null;
    }
    const hadActiveRemark =
      userProfile.userRemark !== null &&
      userProfile.userRemark !== undefined &&
      userProfile.userRemark.trim() !== '';

    if (
      modifier &&
      (modifier.modifierRole === 'ผู้สมัครสอบ' ||
        modifier.modifierRole === 'candidate' ||
        modifier.modifierRole === 'user')
    ) {
      userProfile.userRemark = null;
      await this.userProfileRepository.manager.update(
        ExamEnrollment,
        {
          USER_ID: userProfile.userId,
          ERM_VERIFY_STATUS: ExamVerifyStatus.WAIT_FIXED,
        },
        { ERM_VERIFY_STATUS: ExamVerifyStatus.UNCHECKED },
      );
    }

    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};
    const changedFieldNames: string[] = [];

    const fieldMap: Record<string, string> = {
      userTitleTh: 'คำนำหน้าภาษาไทย',
      userFullnameTh: 'ชื่อ-นามสกุล ภาษาไทย',
      userTitleEn: 'คำนำหน้าภาษาอังกฤษ',
      userFullnameEn: 'ชื่อ-นามสกุล ภาษาอังกฤษ',
      userDateOfBirth: 'วันเกิด',
      userPhone: 'เบอร์โทรศัพท์',
      userEducation: 'ระดับการศึกษา',
      userFaculty: 'คณะ',
      userInstitution: 'ชื่อสถานศึกษา',
      userAddress: 'ที่อยู่สำหรับจัดส่งเอกสาร',
      userRemark: 'หมายเหตุ',
      userNationalId: 'เลขบัตรประจำตัวประชาชน',
      userImagePath: 'รูปถ่าย',
    };

    const profileMap = userProfile as unknown as Record<string, unknown>;
    const dtoMap = updateUserProfileDto as unknown as Record<string, unknown>;

    for (const key of Object.keys(updateUserProfileDto)) {
      if (key in fieldMap) {
        const oldValue =
          key === 'userNationalId'
            ? userProfile.user?.USER_PASSPORT_NO ||
              userProfile.user?.USER_NATIONAL_ID
            : key === 'userImagePath'
              ? userProfile.user?.IMAGE?.USER_IMAGE_URL
              : profileMap[key];
        const newValue = dtoMap[key];

        const normOld =
          oldValue === null || oldValue === undefined
            ? ''
            : typeof oldValue === 'string' ||
                typeof oldValue === 'number' ||
                typeof oldValue === 'boolean'
              ? String(oldValue).trim()
              : '';
        const normNew =
          newValue === null || newValue === undefined
            ? ''
            : typeof newValue === 'string' ||
                typeof newValue === 'number' ||
                typeof newValue === 'boolean'
              ? String(newValue).trim()
              : '';

        let isDifferent = false;
        if (key === 'userDateOfBirth' || oldValue instanceof Date) {
          if (oldValue && newValue) {
            const oldTime = new Date(
              oldValue as string | number | Date,
            ).getTime();
            const newTime = new Date(
              newValue as string | number | Date,
            ).getTime();
            isDifferent = oldTime !== newTime;
          } else {
            isDifferent = !oldValue !== !newValue;
          }
        } else {
          isDifferent = normOld !== normNew;
        }

        if (isDifferent) {
          oldValues[key] = oldValue;
          newValues[key] = newValue;
          changedFieldNames.push(fieldMap[key]);
        }
      }
    }

    if (changedFieldNames.length > 0 && modifier) {
      const isCandidate =
        modifier.modifierRole === 'ผู้สมัครสอบ' ||
        modifier.modifierRole === 'candidate' ||
        modifier.modifierRole === 'user';
      const shouldSaveHistory =
        !isCandidate ||
        hadActiveRemark ||
        updateUserProfileDto.isFromEmail === true;

      if (shouldSaveHistory) {
        await this.historyService.create({
          userProfileId: userProfile.userProfileId,
          modifierId: modifier.modifierId,
          modifierName: modifier.modifierName,
          modifierRole: modifier.modifierRole,
          modifiedFields: changedFieldNames.join(', '),
          oldValues: JSON.stringify(oldValues),
          newValues: JSON.stringify(newValues),
        });
      }
    }

    const { userNationalId, userImagePath, ...dtoRest } = updateUserProfileDto;

    if (userNationalId !== undefined) {
      const isForeigner = !!userProfile.user?.USER_PASSPORT_NO;
      const fieldToUpdate = isForeigner
        ? 'USER_PASSPORT_NO'
        : 'USER_NATIONAL_ID';

      if (userNationalId !== null && userNationalId !== '') {
        const existingUser = await this.userProfileRepository.manager.findOne(
          User,
          {
            where: {
              [fieldToUpdate]: userNationalId,
              USER_ID: Not(userProfile.userId),
            },
            withDeleted: true,
          },
        );

        if (existingUser) {
          throw new ConflictException(
            isForeigner
              ? 'หนังสือเดินทางนี้มีผู้ใช้งานแล้วในระบบ'
              : 'เลขประจำตัวประชาชนนี้มีผู้ใช้งานแล้วในระบบ',
          );
        }
      }

      await this.userProfileRepository.manager.update(
        User,
        { USER_ID: userProfile.userId },
        { [fieldToUpdate]: userNationalId || null },
      );
    }

    if (userImagePath !== undefined) {
      const userImageRepo =
        this.userProfileRepository.manager.getRepository(UserImage);
      const existingImg = await userImageRepo.findOne({
        where: { USER_ID: userProfile.userId },
      });
      if (existingImg) {
        existingImg.USER_IMAGE_URL = userImagePath || null;
        await userImageRepo.save(existingImg);
      } else {
        const newImg = userImageRepo.create({
          USER_ID: userProfile.userId,
          USER_IMAGE_URL: userImagePath || null,
        });
        await userImageRepo.save(newImg);
      }
    }

    this.userProfileRepository.merge(userProfile, dtoRest);
    return await this.userProfileRepository.save(userProfile);
  }

  async remove(id: number): Promise<void> {
    const userProfile = await this.findOne(id);
    await this.userProfileRepository.softRemove(userProfile);
  }
}
