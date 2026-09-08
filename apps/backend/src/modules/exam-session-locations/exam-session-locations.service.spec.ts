import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExamSessionLocationsService } from './exam-session-locations.service';
import { ExamSessionLocation } from './entities/exam-session-location.entity';
import { ExamSessionLocationProctor } from './entities/exam-session-location-proctor.entity';
import { ExamLocation } from '../exam-locations/entities/exam-location.entity';
import { ExamSession } from '../exam-sessions/entities/exam-session.entity';

type MockRepo = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  softRemove: jest.Mock;
  createQueryBuilder: jest.Mock;
  delete: jest.Mock;
};

const createMockRepo = (): MockRepo => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
  createQueryBuilder: jest.fn(),
  delete: jest.fn(),
});

describe('ExamSessionLocationsService', () => {
  let service: ExamSessionLocationsService;
  let slRepo: MockRepo;
  let locationRepo: MockRepo;
  let sessionRepo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamSessionLocationsService,
        {
          provide: getRepositoryToken(ExamSessionLocation),
          useFactory: createMockRepo,
        },
        {
          provide: getRepositoryToken(ExamLocation),
          useFactory: createMockRepo,
        },
        {
          provide: getRepositoryToken(ExamSession),
          useFactory: createMockRepo,
        },
        {
          provide: getRepositoryToken(ExamSessionLocationProctor),
          useFactory: createMockRepo,
        },
      ],
    }).compile();

    service = module.get(ExamSessionLocationsService);
    slRepo = module.get(getRepositoryToken(ExamSessionLocation));
    locationRepo = module.get(getRepositoryToken(ExamLocation));
    sessionRepo = module.get(getRepositoryToken(ExamSession));
  });

  const setupNoOverlap = (): void => {
    const qb = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    slRepo.createQueryBuilder.mockReturnValue(qb);
  };

  describe('create', () => {
    it('should reject when location is missing (SL-U-001)', async () => {
      // Arrange
      locationRepo.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.create({ LOCATION_ID: 90, SS_ID: 1, SS_NAME: 'R1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should reject when session is missing (SL-U-002)', async () => {
      // Arrange
      locationRepo.findOne.mockResolvedValue({ LOCATION_ID: 1 });
      sessionRepo.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(
        service.create({ LOCATION_ID: 1, SS_ID: 90, SS_NAME: 'R1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should reject when session is missing exam date/time metadata (SL-U-003)', async () => {
      // Arrange
      locationRepo.findOne.mockResolvedValue({ LOCATION_ID: 1 });
      sessionRepo.findOne.mockResolvedValue({
        SS_ID: 10,
        SS_START_TIME: '',
        SS_END_TIME: '11:00:00',
        EXAM: { EXAM_DATE: '2026-10-01' },
      });

      // Act / Assert
      await expect(
        service.create({ LOCATION_ID: 1, SS_ID: 10, SS_NAME: 'R1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject duplicate session-location pair (SL-U-004)', async () => {
      // Arrange
      locationRepo.findOne.mockResolvedValue({ LOCATION_ID: 1 });
      sessionRepo.findOne.mockResolvedValue({
        SS_ID: 10,
        SS_START_TIME: '09:00:00',
        SS_END_TIME: '10:00:00',
        EXAM: { EXAM_DATE: '2026-10-01' },
      });
      setupNoOverlap();
      slRepo.findOne.mockResolvedValue({
        SL_ID: 500,
        LOCATION_ID: 1,
        SS_ID: 10,
      });

      // Act / Assert
      await expect(
        service.create({ LOCATION_ID: 1, SS_ID: 10, SS_NAME: 'Main' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should reject when room timeslot overlaps another session (SL-U-005)', async () => {
      // Arrange
      locationRepo.findOne.mockResolvedValue({ LOCATION_ID: 1 });
      sessionRepo.findOne.mockResolvedValue({
        SS_ID: 10,
        SS_START_TIME: '09:15:00',
        SS_END_TIME: '10:00:00',
        EXAM: { EXAM_DATE: '2026-10-01' },
      });
      const qb = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            SESSION: { SS_START_TIME: '09:00:00', SS_END_TIME: '09:30:00' },
          },
        ]),
      };
      slRepo.createQueryBuilder.mockReturnValue(qb);

      // Act / Assert
      await expect(
        service.create({ LOCATION_ID: 1, SS_ID: 10, SS_NAME: 'Main' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
