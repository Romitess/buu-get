import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExamBlockedSeatsService } from './exam-blocked-seats.service';
import { ExamBlockedSeat } from './entities/exam-blocked-seat.entity';

jest.mock('./entities/exam-blocked-seat.entity', () => ({
  ExamBlockedSeat: class ExamBlockedSeat {},
}));

type TxRepo = {
  find: jest.Mock;
  softRemove: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

type MockRepo = {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  softRemove: jest.Mock;
  manager: { transaction: jest.Mock };
};

const createMockRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  softRemove: jest.fn(),
  manager: { transaction: jest.fn() },
});

describe('ExamBlockedSeatsService', () => {
  let service: ExamBlockedSeatsService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamBlockedSeatsService,
        {
          provide: getRepositoryToken(ExamBlockedSeat),
          useFactory: createMockRepo,
        },
      ],
    }).compile();

    service = module.get(ExamBlockedSeatsService);
    repo = module.get(getRepositoryToken(ExamBlockedSeat));
  });

  describe('replaceForSession', () => {
    it('should soft-remove previous rows then save new overrides (BLOCK-U-001)', async () => {
      // Arrange
      const txRepo: TxRepo = {
        find: jest.fn().mockResolvedValue([
          { BLOCK_ID: 1, SS_ID: 11 },
          { BLOCK_ID: 2, SS_ID: 11 },
        ]),
        softRemove: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockImplementation((payload: unknown) => payload),
        save: jest
          .fn()
          .mockResolvedValue([{ BLOCK_ID: 3, SS_ID: 11, LS_ID: 100 }]),
      };

      repo.manager.transaction.mockImplementation(
        async (
          work: (manager: {
            getRepository: (t: unknown) => TxRepo;
          }) => Promise<unknown>,
        ) =>
          work({
            getRepository: () => txRepo,
          }),
      );

      // Act
      const result = await service.replaceForSession(11, [
        { LS_ID: 100, BLOCK_STATUS: 1 },
      ]);

      // Assert
      expect(txRepo.softRemove).toHaveBeenCalledWith([
        { BLOCK_ID: 1, SS_ID: 11 },
        { BLOCK_ID: 2, SS_ID: 11 },
      ]);
      expect(txRepo.create).toHaveBeenCalledWith([
        { SS_ID: 11, LS_ID: 100, BLOCK_STATUS: 1 },
      ]);
      expect(result).toEqual([{ BLOCK_ID: 3, SS_ID: 11, LS_ID: 100 }]);
    });

    it('should clear all existing overrides and return empty when seats is empty (BLOCK-U-002)', async () => {
      // Arrange
      const txRepo: TxRepo = {
        find: jest.fn().mockResolvedValue([{ BLOCK_ID: 10, SS_ID: 8 }]),
        softRemove: jest.fn().mockResolvedValue(undefined),
        create: jest.fn(),
        save: jest.fn(),
      };

      repo.manager.transaction.mockImplementation(
        async (
          work: (manager: {
            getRepository: (t: unknown) => TxRepo;
          }) => Promise<unknown>,
        ) =>
          work({
            getRepository: () => txRepo,
          }),
      );

      // Act
      const result = await service.replaceForSession(8, []);

      // Assert
      expect(txRepo.softRemove).toHaveBeenCalledWith([
        { BLOCK_ID: 10, SS_ID: 8 },
      ]);
      expect(txRepo.create).not.toHaveBeenCalled();
      expect(txRepo.save).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when blocked seat row is missing (BLOCK-U-003)', async () => {
      // Arrange
      repo.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findOne(404)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should query by session with expected relations when sessionId is provided (BLOCK-U-004)', async () => {
      // Arrange
      repo.find.mockResolvedValue([{ BLOCK_ID: 10, SS_ID: 22 }]);

      // Act
      const result = await service.findAll(22);

      // Assert
      expect(repo.find).toHaveBeenCalledWith({
        where: { SS_ID: 22 },
        relations: ['LOCATION_SEAT', 'SESSION'],
      });
      expect(result).toEqual([{ BLOCK_ID: 10, SS_ID: 22 }]);
    });
  });
});
