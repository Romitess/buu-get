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
import { MsgPerson } from '../msg-persons/entities/msg-person.entity';

type MockRepo = {
  findOne: jest.Mock;
  find: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  softRemove: jest.Mock;
  createQueryBuilder: jest.Mock;
  delete: jest.Mock;
};

const createMockRepo = (): MockRepo => ({
  findOne: jest.fn(),
  find: jest.fn(),
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
  let proctorRepo: MockRepo;
  let personRepo: MockRepo;

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
        {
          provide: getRepositoryToken(MsgPerson),
          useFactory: createMockRepo,
        },
      ],
    }).compile();

    service = module.get(ExamSessionLocationsService);
    slRepo = module.get(getRepositoryToken(ExamSessionLocation));
    locationRepo = module.get(getRepositoryToken(ExamLocation));
    sessionRepo = module.get(getRepositoryToken(ExamSession));
    proctorRepo = module.get(getRepositoryToken(ExamSessionLocationProctor));
    personRepo = module.get(getRepositoryToken(MsgPerson));
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

  describe('syncProctors', () => {
    const readyToSave = (): void => {
      locationRepo.findOne.mockResolvedValue({
        LOCATION_ID: 1,
        SEATS: [],
        LOCATION_TOTAL_ROWS: 4,
        LOCATION_TOTAL_COLS: 5,
        LOCATION_SEAT_DIRECTION: 'HORIZONTAL',
        LOCATION_SEAT_CAPACITY: 20,
      });
      sessionRepo.findOne.mockResolvedValue({
        SS_ID: 10,
        SS_START_TIME: '09:00:00',
        SS_END_TIME: '10:00:00',
        EXAM: { EXAM_DATE: '2026-10-01' },
      });
      setupNoOverlap();
      slRepo.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValue({ SL_ID: 77, LOCATION_ID: 1, SS_ID: 10 });
      slRepo.create.mockImplementation((value: unknown) => value);
      slRepo.save.mockResolvedValue({ SL_ID: 77 });
      proctorRepo.create.mockImplementation((value: unknown) => value);
      proctorRepo.save.mockResolvedValue([]);
      proctorRepo.delete.mockResolvedValue(undefined);
    };

    it('should persist PSN_IDs when all persons exist', async () => {
      readyToSave();
      personRepo.find.mockResolvedValue([{ PSN_ID: 'STAFF00001' }]);

      await service.create({
        LOCATION_ID: 1,
        SS_ID: 10,
        PROCTOR_PSN_IDS: ['STAFF00001', 'STAFF00001'],
      });

      expect(proctorRepo.delete).toHaveBeenCalledWith({ SL_ID: 77 });
      expect(proctorRepo.save).toHaveBeenCalledWith([
        { SL_ID: 77, PSN_ID: 'STAFF00001' },
      ]);
    });

    it('should reject unknown PSN_IDs', async () => {
      readyToSave();
      personRepo.find.mockResolvedValue([]);

      await expect(
        service.create({
          LOCATION_ID: 1,
          SS_ID: 10,
          PROCTOR_PSN_IDS: ['MISSING01'],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(proctorRepo.save).not.toHaveBeenCalled();
    });

    it('should clear assignments when PROCTOR_PSN_IDS is empty', async () => {
      readyToSave();

      await service.create({
        LOCATION_ID: 1,
        SS_ID: 10,
        PROCTOR_PSN_IDS: [],
      });

      expect(proctorRepo.delete).toHaveBeenCalledWith({ SL_ID: 77 });
      expect(personRepo.find).not.toHaveBeenCalled();
      expect(proctorRepo.save).not.toHaveBeenCalled();
    });

    it('should leave assignments unchanged when PROCTOR_PSN_IDS is omitted', async () => {
      readyToSave();

      await service.create({
        LOCATION_ID: 1,
        SS_ID: 10,
      });

      expect(proctorRepo.delete).not.toHaveBeenCalled();
      expect(personRepo.find).not.toHaveBeenCalled();
    });
  });
});
