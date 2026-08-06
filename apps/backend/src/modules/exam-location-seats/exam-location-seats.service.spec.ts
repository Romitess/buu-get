import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExamLocationSeatsService } from './exam-location-seats.service';
import {
  ExamLocationSeat,
  LocationSeatStatus,
} from './entities/exam-location-seat.entity';
import {
  ExamLocation,
  SeatDirection,
} from '../exam-locations/entities/exam-location.entity';

jest.mock('./entities/exam-location-seat.entity', () => ({
  ExamLocationSeat: class ExamLocationSeat {},
  LocationSeatStatus: { AVAILABLE: 0, BROKEN: 1, BLOCKED: 2 },
}));

jest.mock('../exam-locations/entities/exam-location.entity', () => ({
  ExamLocation: class ExamLocation {},
  SeatDirection: {
    HORIZONTAL: 'HORIZONTAL',
    VERTICAL: 'VERTICAL',
  },
}));

type MockRepo = {
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  softRemove: jest.Mock;
  find: jest.Mock;
  update: jest.Mock;
  manager: { transaction: jest.Mock };
};

const createMockRepo = (): MockRepo => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  manager: { transaction: jest.fn() },
});

describe('ExamLocationSeatsService', () => {
  let service: ExamLocationSeatsService;
  let seatRepo: MockRepo;
  let locationRepo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamLocationSeatsService,
        {
          provide: getRepositoryToken(ExamLocationSeat),
          useFactory: createMockRepo,
        },
        {
          provide: getRepositoryToken(ExamLocation),
          useFactory: createMockRepo,
        },
      ],
    }).compile();

    service = module.get(ExamLocationSeatsService);
    seatRepo = module.get(getRepositoryToken(ExamLocationSeat));
    locationRepo = module.get(getRepositoryToken(ExamLocation));
  });

  describe('create', () => {
    it('should reject duplicate row/col in same location (SEAT-U-001)', async () => {
      // Arrange
      locationRepo.findOne.mockResolvedValue({ LOCATION_ID: 1 });
      seatRepo.findOne
        .mockResolvedValueOnce({
          LS_ID: 1,
          LOCATION_ID: 1,
          LS_ROW_NO: 1,
          LS_COL_NO: 1,
        })
        .mockResolvedValueOnce(null);

      // Act / Assert
      await expect(
        service.create({
          LOCATION_ID: 1,
          LS_ROW_NO: 1,
          LS_COL_NO: 1,
          LS_SEAT_LABEL: 'A1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('should reject duplicate seat label in same location (SEAT-U-002)', async () => {
      // Arrange
      locationRepo.findOne.mockResolvedValue({ LOCATION_ID: 1 });
      seatRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
        LS_ID: 2,
        LOCATION_ID: 1,
        LS_SEAT_LABEL: 'A1',
      });

      // Act / Assert
      await expect(
        service.create({
          LOCATION_ID: 1,
          LS_ROW_NO: 1,
          LS_COL_NO: 2,
          LS_SEAT_LABEL: 'A1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('generateSeats', () => {
    it('should require rows/cols configured on location (SEAT-U-003)', async () => {
      // Arrange
      locationRepo.findOne.mockResolvedValue({
        LOCATION_ID: 1,
        LOCATION_TOTAL_ROWS: null,
        LOCATION_TOTAL_COLS: 3,
      });

      // Act / Assert
      await expect(service.generateSeats(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should block shrinking when assigned seats would be removed (SEAT-U-005)', async () => {
      // Arrange
      locationRepo.findOne.mockResolvedValue({
        LOCATION_ID: 1,
        LOCATION_TOTAL_ROWS: 1,
        LOCATION_TOTAL_COLS: 1,
        LOCATION_SEAT_DIRECTION: SeatDirection.HORIZONTAL,
      });

      const txSeatRepo = {
        find: jest.fn().mockResolvedValue([
          {
            LS_ID: 1,
            LOCATION_ID: 1,
            LS_ROW_NO: 2,
            LS_COL_NO: 1,
            LS_SEAT_LABEL: 'B1',
            LS_SEAT_STATUS: LocationSeatStatus.AVAILABLE,
            DELETED_AT: null,
          },
        ]),
        update: jest.fn().mockResolvedValue(undefined),
        softRemove: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        create: jest.fn(),
      };

      const enrollmentQb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([{ LS_ID: 1 }]),
      };

      const txManager = {
        getRepository: jest.fn((entity: unknown) => {
          if (entity === ExamLocationSeat) {
            return txSeatRepo;
          }
          return {
            createQueryBuilder: jest.fn().mockReturnValue(enrollmentQb),
          };
        }),
      };

      seatRepo.manager.transaction.mockImplementation(
        async (
          work: (manager: typeof txManager) => Promise<ExamLocationSeat[]>,
        ) => work(txManager),
      );

      // Act / Assert
      await expect(service.generateSeats(1)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(txSeatRepo.softRemove).not.toHaveBeenCalled();
    });

    it('should apply explicit seatStatuses mapping over brokenSeats fallback (SEAT-U-004)', async () => {
      // Arrange
      locationRepo.findOne.mockResolvedValue({
        LOCATION_ID: 2,
        LOCATION_TOTAL_ROWS: 1,
        LOCATION_TOTAL_COLS: 2,
        LOCATION_SEAT_DIRECTION: SeatDirection.HORIZONTAL,
      });

      const txSeatRepo = {
        find: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue(undefined),
        softRemove: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockImplementation((payload: unknown) => payload),
      };

      const txManager = {
        getRepository: jest.fn(() => txSeatRepo),
      };

      seatRepo.manager.transaction.mockImplementation(
        async (
          work: (manager: typeof txManager) => Promise<ExamLocationSeat[]>,
        ) => work(txManager),
      );

      txSeatRepo.find.mockResolvedValueOnce([]).mockResolvedValueOnce([
        {
          LS_ID: 1,
          LOCATION_ID: 2,
          LS_ROW_NO: 1,
          LS_COL_NO: 1,
          LS_SEAT_LABEL: 'A1',
          LS_SEAT_STATUS: LocationSeatStatus.BLOCKED,
        },
        {
          LS_ID: 2,
          LOCATION_ID: 2,
          LS_ROW_NO: 1,
          LS_COL_NO: 2,
          LS_SEAT_LABEL: 'A2',
          LS_SEAT_STATUS: LocationSeatStatus.BROKEN,
        },
      ]);

      // Act
      await service.generateSeats(2, ['A1'], {
        A1: LocationSeatStatus.AVAILABLE,
      });

      // Assert
      expect(txSeatRepo.create).toHaveBeenCalledWith([
        {
          LOCATION_ID: 2,
          LS_ROW_NO: 1,
          LS_COL_NO: 1,
          LS_SEAT_LABEL: 'A1',
          LS_SORT_ORDER: 1,
          LS_SEAT_STATUS: LocationSeatStatus.AVAILABLE,
        },
        {
          LOCATION_ID: 2,
          LS_ROW_NO: 1,
          LS_COL_NO: 2,
          LS_SEAT_LABEL: 'A2',
          LS_SORT_ORDER: 2,
          LS_SEAT_STATUS: LocationSeatStatus.AVAILABLE,
        },
      ]);
    });

    it('should soft-remove out-of-range seats when no active assignments (SEAT-U-006)', async () => {
      // Arrange
      locationRepo.findOne.mockResolvedValue({
        LOCATION_ID: 3,
        LOCATION_TOTAL_ROWS: 1,
        LOCATION_TOTAL_COLS: 1,
        LOCATION_SEAT_DIRECTION: SeatDirection.HORIZONTAL,
      });

      const txSeatRepo = {
        find: jest
          .fn()
          .mockResolvedValueOnce([
            {
              LS_ID: 31,
              LOCATION_ID: 3,
              LS_ROW_NO: 2,
              LS_COL_NO: 1,
              LS_SEAT_LABEL: 'B1',
              LS_SEAT_STATUS: LocationSeatStatus.AVAILABLE,
              DELETED_AT: null,
            },
          ])
          .mockResolvedValueOnce([
            {
              LS_ID: 40,
              LOCATION_ID: 3,
              LS_ROW_NO: 1,
              LS_COL_NO: 1,
              LS_SEAT_LABEL: 'A1',
              LS_SORT_ORDER: 1,
              LS_SEAT_STATUS: LocationSeatStatus.AVAILABLE,
            },
          ]),
        update: jest.fn().mockResolvedValue(undefined),
        softRemove: jest.fn().mockResolvedValue(undefined),
        save: jest.fn().mockResolvedValue(undefined),
        create: jest.fn().mockImplementation((payload: unknown) => payload),
      };

      const enrollmentQb = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };

      const txManager = {
        getRepository: jest.fn((entity: unknown) => {
          if (entity === ExamLocationSeat) {
            return txSeatRepo;
          }
          return {
            createQueryBuilder: jest.fn().mockReturnValue(enrollmentQb),
          };
        }),
      };

      seatRepo.manager.transaction.mockImplementation(
        async (
          work: (manager: typeof txManager) => Promise<ExamLocationSeat[]>,
        ) => work(txManager),
      );

      // Act
      await service.generateSeats(3);

      // Assert
      expect(txSeatRepo.softRemove).toHaveBeenCalledWith([
        expect.objectContaining({ LS_ID: 31, LS_SEAT_LABEL: '__TMP_31' }),
      ]);
    });
  });
});
