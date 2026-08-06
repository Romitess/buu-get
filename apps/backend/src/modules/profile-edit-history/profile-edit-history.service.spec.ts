import type { Repository } from 'typeorm';
import { In } from 'typeorm';
import { ProfileEditHistoryService } from './profile-edit-history.service';
import type { ProfileEditHistory } from './entities/profile-edit-history.entity';
import type { CreateProfileEditHistoryDto } from './dto/create-profile-edit-history.dto';

describe('ProfileEditHistoryService', () => {
  let service: ProfileEditHistoryService;
  let historyRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };

  beforeEach(() => {
    historyRepository = {
      create: jest.fn(
        (payload: Partial<ProfileEditHistory>) => payload as ProfileEditHistory,
      ),
      save: jest.fn((entity: ProfileEditHistory) =>
        Promise.resolve({
          ...entity,
          profileEditHistoryId: entity.profileEditHistoryId ?? 1,
        }),
      ),
      find: jest.fn(),
    };

    service = new ProfileEditHistoryService(
      historyRepository as unknown as Repository<ProfileEditHistory>,
    );
  });

  describe('create', () => {
    it('should persist a history row from DTO (PEH-U-001)', async () => {
      // Arrange
      const dto: CreateProfileEditHistoryDto = {
        userProfileId: 10,
        modifierId: 2,
        modifierName: 'Staff A',
        modifierRole: 'เจ้าหน้าที่',
        modifiedFields: 'เบอร์โทรศัพท์',
        oldValues: JSON.stringify({ userPhone: '0800000000' }),
        newValues: JSON.stringify({ userPhone: '0811111111' }),
      };

      // Act
      const result = await service.create(dto);

      // Assert
      expect(historyRepository.create).toHaveBeenCalledWith(dto);
      expect(historyRepository.save).toHaveBeenCalled();
      expect(result.userProfileId).toBe(10);
      expect(result.modifiedFields).toBe('เบอร์โทรศัพท์');
    });
  });

  describe('findByUserProfileId', () => {
    it('should return rows ordered by createdAt DESC (PEH-U-002)', async () => {
      // Arrange
      const rows = [
        {
          profileEditHistoryId: 3,
          userProfileId: 10,
          createdAt: new Date('2026-03-03'),
        },
        {
          profileEditHistoryId: 1,
          userProfileId: 10,
          createdAt: new Date('2026-03-01'),
        },
      ] as ProfileEditHistory[];
      historyRepository.find.mockResolvedValue(rows);

      // Act
      const result = await service.findByUserProfileId(10);

      // Assert
      expect(historyRepository.find).toHaveBeenCalledWith({
        where: { userProfileId: 10 },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(rows);
      expect(result[0].profileEditHistoryId).toBe(3);
    });
  });

  describe('findLatestImagesByProfileIds', () => {
    it('should return empty object when profileIds is empty (PEH-U-003)', async () => {
      // Arrange
      // Act
      const result = await service.findLatestImagesByProfileIds([]);

      // Assert
      expect(result).toEqual({});
      expect(historyRepository.find).not.toHaveBeenCalled();
    });

    it('should pick newest userImagePath per profile and null when missing (PEH-U-004)', async () => {
      // Arrange
      const rows = [
        {
          profileEditHistoryId: 5,
          userProfileId: 1,
          newValues: JSON.stringify({
            userImagePath: 'https://cdn/newest-1.jpg',
          }),
          createdAt: new Date('2026-04-02'),
        },
        {
          profileEditHistoryId: 4,
          userProfileId: 1,
          newValues: JSON.stringify({
            userImagePath: 'https://cdn/older-1.jpg',
          }),
          createdAt: new Date('2026-04-01'),
        },
        {
          profileEditHistoryId: 3,
          userProfileId: 2,
          newValues: JSON.stringify({ userPhone: '0811111111' }),
          createdAt: new Date('2026-04-03'),
        },
      ] as ProfileEditHistory[];
      historyRepository.find.mockResolvedValue(rows);

      // Act
      const result = await service.findLatestImagesByProfileIds([1, 2, 3]);

      // Assert
      expect(historyRepository.find).toHaveBeenCalledWith({
        where: { userProfileId: In([1, 2, 3]) },
        order: { createdAt: 'DESC' },
        select: {
          profileEditHistoryId: true,
          userProfileId: true,
          newValues: true,
          createdAt: true,
        },
      });
      expect(result).toEqual({
        1: 'https://cdn/newest-1.jpg',
        2: null,
        3: null,
      });
    });

    it('should skip malformed JSON and non-string imagePath (PEH-U-005)', async () => {
      // Arrange
      const rows = [
        {
          profileEditHistoryId: 10,
          userProfileId: 1,
          newValues: '{not-json',
          createdAt: new Date('2026-05-03'),
        },
        {
          profileEditHistoryId: 9,
          userProfileId: 1,
          newValues: JSON.stringify({ userImagePath: 12345 }),
          createdAt: new Date('2026-05-02'),
        },
        {
          profileEditHistoryId: 8,
          userProfileId: 1,
          newValues: JSON.stringify({ userImagePath: '   ' }),
          createdAt: new Date('2026-05-01'),
        },
        {
          profileEditHistoryId: 7,
          userProfileId: 2,
          newValues: null,
          createdAt: new Date('2026-05-04'),
        },
      ] as ProfileEditHistory[];
      historyRepository.find.mockResolvedValue(rows);

      // Act
      const result = await service.findLatestImagesByProfileIds([1, 2]);

      // Assert
      expect(result).toEqual({
        1: null,
        2: null,
      });
    });
  });
});
