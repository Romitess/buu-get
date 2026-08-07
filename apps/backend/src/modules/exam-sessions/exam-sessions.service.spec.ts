import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExamSessionsService } from './exam-sessions.service';
import { ExamSession } from './entities/exam-session.entity';

type MockRepo = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  merge: jest.Mock;
  softRemove: jest.Mock;
};

const createMockRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  merge: jest.fn(),
  softRemove: jest.fn(),
});

describe('ExamSessionsService', () => {
  let service: ExamSessionsService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamSessionsService,
        {
          provide: getRepositoryToken(ExamSession),
          useFactory: createMockRepo,
        },
      ],
    }).compile();

    service = module.get(ExamSessionsService);
    repo = module.get(getRepositoryToken(ExamSession));
  });

  describe('create', () => {
    it('should create then return hydrated session from findOne (SES-U-001)', async () => {
      // Arrange
      repo.create.mockReturnValue({ EXAM_ID: 2, SS_START_TIME: '09:00:00' });
      repo.save.mockResolvedValue({ SS_ID: 44 });
      const hydrated = { SS_ID: 44, EXAM: { EXAM_ID: 2 } } as ExamSession;
      repo.findOne.mockResolvedValue(hydrated);

      // Act
      const result = await service.create({
        EXAM_ID: 2,
        SS_START_TIME: '09:00:00',
        SS_END_TIME: '10:00:00',
      });

      // Assert
      expect(repo.create).toHaveBeenCalledWith({
        EXAM_ID: 2,
        SS_START_TIME: '09:00:00',
        SS_END_TIME: '10:00:00',
      });
      expect(repo.save).toHaveBeenCalledWith({
        EXAM_ID: 2,
        SS_START_TIME: '09:00:00',
      });
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { SS_ID: 44 },
        relations: [
          'EXAM',
          'SESSION_LOCATIONS',
          'SESSION_LOCATIONS.LOCATION',
          'SESSION_LOCATIONS.LOCATION.SEATS',
        ],
      });
      expect(result).toBe(hydrated);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when session is missing (SES-U-002)', async () => {
      // Arrange
      repo.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findOne(404)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should softRemove after checking session existence (SES-U-003)', async () => {
      // Arrange
      const existing = { SS_ID: 12 } as ExamSession;
      repo.findOne.mockResolvedValue(existing);

      // Act
      await service.remove(12);

      // Assert
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { SS_ID: 12 },
        relations: ['EXAM', 'SESSION_LOCATIONS', 'SESSION_LOCATIONS.LOCATION'],
      });
      expect(repo.softRemove).toHaveBeenCalledWith(existing);
    });
  });
});
