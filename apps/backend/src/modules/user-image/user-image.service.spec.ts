import type { Repository } from 'typeorm';
import { UserImageService } from './user-image.service';
import type { UserImage } from './entities/user-image.entity';

describe('UserImageService', () => {
  let service: UserImageService;
  let userImageRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  beforeEach(() => {
    userImageRepository = {
      findOne: jest.fn(),
      create: jest.fn((payload: Partial<UserImage>) => payload as UserImage),
      save: jest.fn((entity: UserImage) =>
        Promise.resolve({
          ...entity,
          USER_IMAGE_ID: entity.USER_IMAGE_ID ?? 1,
        }),
      ),
    };

    service = new UserImageService(
      userImageRepository as unknown as Repository<UserImage>,
    );
  });

  describe('findByUserId', () => {
    it('should return null when no image row exists (IMG-U-001)', async () => {
      // Arrange
      userImageRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.findByUserId(42);

      // Assert
      expect(userImageRepository.findOne).toHaveBeenCalledWith({
        where: { USER_ID: 42 },
      });
      expect(result).toBeNull();
    });
  });

  describe('upsertByUserId', () => {
    it('should create a new row when none exists (IMG-U-002)', async () => {
      // Arrange
      const url = 'https://cdn.example/new.jpg';
      userImageRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.upsertByUserId(7, url);

      // Assert
      expect(userImageRepository.create).toHaveBeenCalledWith({
        USER_ID: 7,
        USER_IMAGE_URL: url,
      });
      expect(userImageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          USER_ID: 7,
          USER_IMAGE_URL: url,
        }),
      );
      expect(result.USER_ID).toBe(7);
      expect(result.USER_IMAGE_URL).toBe(url);
    });

    it('should update URL on existing row keeping same id (IMG-U-003)', async () => {
      // Arrange
      const existing = {
        USER_IMAGE_ID: 99,
        USER_ID: 7,
        USER_IMAGE_URL: 'https://cdn.example/old.jpg',
      } as UserImage;
      const newUrl = 'https://cdn.example/updated.jpg';
      userImageRepository.findOne.mockResolvedValue(existing);

      // Act
      const result = await service.upsertByUserId(7, newUrl);

      // Assert
      expect(userImageRepository.create).not.toHaveBeenCalled();
      expect(userImageRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          USER_IMAGE_ID: 99,
          USER_ID: 7,
          USER_IMAGE_URL: newUrl,
        }),
      );
      expect(result.USER_IMAGE_ID).toBe(99);
      expect(result.USER_IMAGE_URL).toBe(newUrl);
    });
  });
});
