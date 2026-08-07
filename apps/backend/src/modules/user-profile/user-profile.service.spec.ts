import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { UserProfileService } from './user-profile.service';
import { UserProfile } from './entities/user-profile.entity';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import type { ProfileEditHistoryService } from '../profile-edit-history/profile-edit-history.service';
import {
  ExamEnrollment,
  ExamVerifyStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';
import { User } from '../users/entities/user.entity';
import { UserImage } from '../user-image/entities/user-image.entity';

describe('UserProfileService', () => {
  let service: UserProfileService;
  let userProfileRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    merge: jest.Mock;
    softRemove: jest.Mock;
    manager: {
      findOne: jest.Mock;
      update: jest.Mock;
      getRepository: jest.Mock;
    };
  };
  let userImageRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let historyService: {
    create: jest.Mock;
  };

  const buildProfile = (
    overrides: {
      userProfileId?: number;
      userId?: number;
      userFullnameTh?: string | null;
      userPhone?: string | null;
      userAddress?: string | null;
      userRemark?: string | null;
      user?: {
        USER_ID?: number;
        USER_NATIONAL_ID?: string | null;
        USER_PASSPORT_NO?: string | null;
        IMAGE?: UserImage | null;
      };
    } = {},
  ): UserProfile => {
    const { user: userOverrides, ...rest } = overrides;
    return {
      userProfileId: 1,
      userId: 10,
      userTitleTh: null,
      userFullnameTh: 'ชื่อเดิม',
      userTitleEn: null,
      userFullnameEn: null,
      userDateOfBirth: null,
      userPhone: '0800000000',
      userEducation: null,
      userFaculty: null,
      userInstitution: null,
      userCountry: null,
      userAddress: 'ที่อยู่เดิม',
      userThaidSynced: false,
      userRemark: null,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      deletedAt: null,
      user: {
        USER_ID: 10,
        USER_NATIONAL_ID: '1234567890123',
        USER_PASSPORT_NO: null,
        IMAGE: null,
        ...userOverrides,
      } as User,
      ...rest,
    };
  };

  beforeEach(() => {
    userImageRepo = {
      findOne: jest.fn(),
      create: jest.fn((payload: Partial<UserImage>) => payload as UserImage),
      save: jest.fn((entity: UserImage) =>
        Promise.resolve({
          ...entity,
          USER_IMAGE_ID: entity.USER_IMAGE_ID ?? 1,
        }),
      ),
    };

    userProfileRepository = {
      findOne: jest.fn(),
      create: jest.fn(
        (payload: Partial<UserProfile>) => payload as UserProfile,
      ),
      save: jest.fn((entity: UserProfile) => Promise.resolve(entity)),
      merge: jest.fn((entity: UserProfile, dto: Partial<UserProfile>) =>
        Object.assign(entity, dto),
      ),
      softRemove: jest.fn(),
      manager: {
        findOne: jest.fn(),
        update: jest.fn().mockResolvedValue({ affected: 1 }),
        getRepository: jest.fn().mockReturnValue(userImageRepo),
      },
    };

    historyService = {
      create: jest.fn().mockResolvedValue({ profileEditHistoryId: 1 }),
    };

    service = new UserProfileService(
      userProfileRepository as unknown as Repository<UserProfile>,
      historyService as unknown as ProfileEditHistoryService,
    );
  });

  describe('findOne', () => {
    it('should throw NotFoundException when profile id is missing (PROF-U-001)', async () => {
      // Arrange
      userProfileRepository.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'UserProfile #999 not found',
      );
      expect(userProfileRepository.findOne).toHaveBeenCalledWith({
        where: { userProfileId: 999 },
        relations: ['user', 'user.IMAGE'],
      });
    });
  });

  describe('findByUserId', () => {
    it('should return existing profile with user and IMAGE relations (PROF-U-002)', async () => {
      // Arrange
      const profile = buildProfile({
        user: {
          IMAGE: {
            USER_IMAGE_ID: 5,
            USER_ID: 10,
            USER_IMAGE_URL: 'https://cdn/photo.jpg',
          } as UserImage,
        },
      });
      userProfileRepository.findOne.mockResolvedValue(profile);

      // Act
      const result = await service.findByUserId(10);

      // Assert
      expect(userProfileRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 10 },
        relations: ['user', 'user.IMAGE'],
      });
      expect(result).toEqual(profile);
      expect(result.user.IMAGE?.USER_IMAGE_URL).toBe('https://cdn/photo.jpg');
      expect(userProfileRepository.create).not.toHaveBeenCalled();
    });

    it('should auto-create blank profile when user exists without profile (PROF-U-003)', async () => {
      // Arrange
      const createdBlank = { userId: 10 } as UserProfile;
      const loaded = buildProfile();
      userProfileRepository.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(loaded);
      userProfileRepository.manager.findOne.mockResolvedValue({
        USER_ID: 10,
      });
      userProfileRepository.create.mockReturnValue(createdBlank);
      userProfileRepository.save.mockResolvedValue(createdBlank);

      // Act
      const result = await service.findByUserId(10);

      // Assert
      expect(userProfileRepository.manager.findOne).toHaveBeenCalledWith(User, {
        where: { USER_ID: 10 },
      });
      expect(userProfileRepository.create).toHaveBeenCalledWith({ userId: 10 });
      expect(userProfileRepository.save).toHaveBeenCalledWith(createdBlank);
      expect(userProfileRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { userId: 10 },
        relations: ['user', 'user.IMAGE'],
      });
      expect(result).toEqual(loaded);
    });

    it('should throw NotFoundException when user row does not exist (PROF-U-004)', async () => {
      // Arrange
      userProfileRepository.findOne.mockResolvedValue(null);
      userProfileRepository.manager.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findByUserId(404)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByUserId(404)).rejects.toThrow(
        'UserProfile for user #404 not found',
      );
      expect(userProfileRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const candidateModifier = {
      modifierId: 10,
      modifierName: 'ผู้สมัคร',
      modifierRole: 'candidate',
    };

    const staffModifier = {
      modifierId: 2,
      modifierName: 'เจ้าหน้าที่',
      modifierRole: 'เจ้าหน้าที่',
    };

    it('should clear remark and WAIT_FIXED→UNCHECKED when candidate updates (PROF-U-005)', async () => {
      // Arrange
      const profile = buildProfile({
        userRemark: 'กรุณาแก้ที่อยู่',
      });
      userProfileRepository.findOne.mockResolvedValue(profile);
      const dto: UpdateUserProfileDto = { userPhone: '0811111111' };

      // Act
      await service.update(1, dto, candidateModifier);

      // Assert
      expect(profile.userRemark).toBeNull();
      expect(userProfileRepository.manager.update).toHaveBeenCalledWith(
        ExamEnrollment,
        {
          USER_ID: 10,
          ERM_VERIFY_STATUS: ExamVerifyStatus.WAIT_FIXED,
        },
        { ERM_VERIFY_STATUS: ExamVerifyStatus.UNCHECKED },
      );
    });

    it('should keep remark and skip enrollment bulk update for staff (PROF-U-006)', async () => {
      // Arrange
      const profile = buildProfile({
        userRemark: 'หมายเหตุค้างอยู่',
      });
      userProfileRepository.findOne.mockResolvedValue(profile);
      const dto: UpdateUserProfileDto = { userPhone: '0811111111' };

      // Act
      await service.update(1, dto, staffModifier);

      // Assert
      expect(profile.userRemark).toBe('หมายเหตุค้างอยู่');
      expect(userProfileRepository.manager.update).not.toHaveBeenCalledWith(
        ExamEnrollment,
        expect.anything(),
        expect.anything(),
      );
    });

    it('should call historyService.create for staff field change (PROF-U-007)', async () => {
      // Arrange
      const profile = buildProfile({ userRemark: null });
      userProfileRepository.findOne.mockResolvedValue(profile);
      const dto: UpdateUserProfileDto = { userFullnameTh: 'ชื่อใหม่' };

      // Act
      await service.update(1, dto, staffModifier);

      // Assert
      expect(historyService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userProfileId: 1,
          modifierId: 2,
          modifierName: 'เจ้าหน้าที่',
          modifierRole: 'เจ้าหน้าที่',
          modifiedFields: 'ชื่อ-นามสกุล ภาษาไทย',
        }),
      );
    });

    it('should skip history for candidate without remark or email flag (PROF-U-008)', async () => {
      // Arrange
      const profile = buildProfile({ userRemark: null });
      userProfileRepository.findOne.mockResolvedValue(profile);
      const dto: UpdateUserProfileDto = { userFullnameTh: 'ชื่อใหม่' };

      // Act
      await service.update(1, dto, candidateModifier);

      // Assert
      expect(historyService.create).not.toHaveBeenCalled();
    });

    it('should save history for candidate when hadActiveRemark (PROF-U-009)', async () => {
      // Arrange
      const profile = buildProfile({
        userRemark: 'ต้องแก้ข้อมูล',
      });
      userProfileRepository.findOne.mockResolvedValue(profile);
      const dto: UpdateUserProfileDto = { userFullnameTh: 'ชื่อใหม่' };

      // Act
      await service.update(1, dto, candidateModifier);

      // Assert
      expect(historyService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userProfileId: 1,
          modifierRole: 'candidate',
          modifiedFields: 'ชื่อ-นามสกุล ภาษาไทย',
        }),
      );
    });

    it('should save history for candidate when isFromEmail is true (PROF-U-009)', async () => {
      // Arrange
      const profile = buildProfile({ userRemark: null });
      userProfileRepository.findOne.mockResolvedValue(profile);
      const dto: UpdateUserProfileDto = {
        userFullnameTh: 'ชื่อใหม่',
        isFromEmail: true,
      };

      // Act
      await service.update(1, dto, candidateModifier);

      // Assert
      expect(historyService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userProfileId: 1,
          modifierRole: 'candidate',
        }),
      );
    });

    it('should throw ConflictException when national ID belongs to another user incl soft-deleted (PROF-U-010)', async () => {
      // Arrange
      const profile = buildProfile();
      userProfileRepository.findOne.mockResolvedValue(profile);
      userProfileRepository.manager.findOne.mockResolvedValue({
        USER_ID: 99,
        USER_NATIONAL_ID: '9999999999999',
      });
      const dto: UpdateUserProfileDto = {
        userNationalId: '9999999999999',
      };

      // Act / Assert
      await expect(service.update(1, dto, staffModifier)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update(1, dto, staffModifier)).rejects.toThrow(
        'เลขประจำตัวประชาชนนี้มีผู้ใช้งานแล้วในระบบ',
      );
      expect(userProfileRepository.manager.findOne).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          withDeleted: true,
        }),
      );
    });

    it('should create UserImage when userImagePath given and none exists (PROF-U-011)', async () => {
      // Arrange
      const profile = buildProfile();
      userProfileRepository.findOne.mockResolvedValue(profile);
      userImageRepo.findOne.mockResolvedValue(null);
      const path = 'https://cdn/new-photo.jpg';
      const dto: UpdateUserProfileDto = { userImagePath: path };

      // Act
      await service.update(1, dto, staffModifier);

      // Assert
      expect(userProfileRepository.manager.getRepository).toHaveBeenCalledWith(
        UserImage,
      );
      expect(userImageRepo.create).toHaveBeenCalledWith({
        USER_ID: 10,
        USER_IMAGE_URL: path,
      });
      expect(userImageRepo.save).toHaveBeenCalled();
    });

    it('should update existing UserImage URL when userImagePath given (PROF-U-011)', async () => {
      // Arrange
      const profile = buildProfile();
      userProfileRepository.findOne.mockResolvedValue(profile);
      const existing = {
        USER_IMAGE_ID: 55,
        USER_ID: 10,
        USER_IMAGE_URL: 'https://cdn/old.jpg',
      } as UserImage;
      userImageRepo.findOne.mockResolvedValue(existing);
      const path = 'https://cdn/updated.jpg';
      const dto: UpdateUserProfileDto = { userImagePath: path };

      // Act
      await service.update(1, dto, staffModifier);

      // Assert
      expect(userImageRepo.create).not.toHaveBeenCalled();
      expect(existing.USER_IMAGE_URL).toBe(path);
      expect(userImageRepo.save).toHaveBeenCalledWith(existing);
    });
  });
});
