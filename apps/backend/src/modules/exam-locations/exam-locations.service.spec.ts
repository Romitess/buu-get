import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExamLocationsService } from './exam-locations.service';
import { ExamLocation, SeatDirection } from './entities/exam-location.entity';

jest.mock('./entities/exam-location.entity', () => ({
  ExamLocation: class ExamLocation {},
  SeatDirection: {
    HORIZONTAL: 'HORIZONTAL',
    VERTICAL: 'VERTICAL',
  },
}));

type TxManager = {
  create: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
};

type MockRepo = {
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  merge: jest.Mock;
  softRemove: jest.Mock;
  createQueryBuilder: jest.Mock;
  manager: { transaction: jest.Mock };
};

const createMockRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  merge: jest.fn(),
  softRemove: jest.fn(),
  createQueryBuilder: jest.fn(),
  manager: { transaction: jest.fn() },
});

describe('ExamLocationsService', () => {
  let service: ExamLocationsService;
  let repo: MockRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamLocationsService,
        {
          provide: getRepositoryToken(ExamLocation),
          useFactory: createMockRepo,
        },
      ],
    }).compile();

    service = module.get(ExamLocationsService);
    repo = module.get(getRepositoryToken(ExamLocation));
  });

  describe('create', () => {
    it('should normalize aisle aliases into sorted LOCATION_AISLE_AFTER_COL (LOC-U-002)', async () => {
      // Arrange
      repo.create.mockImplementation(
        (payload: Record<string, unknown>) => payload,
      );
      repo.save.mockResolvedValue({
        LOCATION_ID: 5,
        LOCATION_SEAT_DIRECTION: SeatDirection.HORIZONTAL,
        LOCATION_AISLE_AFTER_COL: [
          { type: 'row', index: 2 },
          { type: 'column', index: 1 },
          { type: 'row', index: 1 },
          { type: 'column', index: 3 },
        ],
      });

      // Act
      const result = await service.create({
        LOCATION_NAME: 'Room B',
        AISLE_AFTER_ROWS: [2, 1],
        AISLE_AFTER_COLS: [3, 1],
        SEAT_DIRECTION: SeatDirection.HORIZONTAL,
      });

      // Assert
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          LOCATION_SEAT_DIRECTION: SeatDirection.HORIZONTAL,
          LOCATION_AISLE_AFTER_COL: [
            { type: 'row', index: 1 },
            { type: 'row', index: 2 },
            { type: 'column', index: 1 },
            { type: 'column', index: 3 },
          ],
        }),
      );
      expect(result.AISLE_AFTER_ROWS).toEqual([1, 2]);
      expect(result.AISLE_AFTER_COLS).toEqual([1, 3]);
    });
  });

  describe('createWithSeats', () => {
    it('should generate rows*cols seats with direction-based labels (LOC-U-001)', async () => {
      // Arrange
      const execute = jest.fn().mockResolvedValue(undefined);
      const txManager: TxManager = {
        create: jest.fn().mockReturnValue({
          LOCATION_NAME: 'Room A',
          LOCATION_TOTAL_ROWS: 2,
          LOCATION_TOTAL_COLS: 2,
          LOCATION_SEAT_DIRECTION: SeatDirection.HORIZONTAL,
        }),
        save: jest.fn().mockResolvedValue({
          LOCATION_ID: 77,
          LOCATION_TOTAL_ROWS: 2,
          LOCATION_TOTAL_COLS: 2,
          LOCATION_SEAT_DIRECTION: SeatDirection.HORIZONTAL,
        }),
        createQueryBuilder: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnThis(),
          into: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          execute,
        }),
      };

      repo.manager.transaction.mockImplementation(
        async (work: (manager: TxManager) => Promise<unknown>) =>
          work(txManager),
      );

      // Act
      const result = await service.createWithSeats({
        LOCATION_NAME: 'Room A',
        LOCATION_TOTAL_ROWS: 2,
        LOCATION_TOTAL_COLS: 2,
        LOCATION_SEAT_DIRECTION: SeatDirection.HORIZONTAL,
      });

      // Assert
      const valuesCall = (
        txManager.createQueryBuilder.mock.results[0]?.value.values as jest.Mock
      ).mock.calls[0][0] as Array<{ LS_SEAT_LABEL: string }>;
      expect(valuesCall.map((seat) => seat.LS_SEAT_LABEL)).toEqual([
        'A1',
        'A2',
        'B1',
        'B2',
      ]);
      expect(result).toEqual({ locationId: 77, seatCount: 4 });
      expect(execute).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should expose legacy response aliases from stored aisle positions (LOC-U-003)', async () => {
      // Arrange
      repo.findOne.mockResolvedValue({
        LOCATION_ID: 15,
        LOCATION_SEAT_DIRECTION: SeatDirection.VERTICAL,
        LOCATION_AISLE_AFTER_COL: [
          { type: 'column', index: 4 },
          { type: 'row', index: 3 },
          2,
        ],
      });

      // Act
      const result = await service.findOne(15);

      // Assert
      expect(result.SEAT_DIRECTION).toBe(SeatDirection.VERTICAL);
      expect(result.AISLE_AFTER_ROWS).toEqual([3]);
      expect(result.AISLE_AFTER_COLS).toEqual([2, 4]);
    });

    it('should throw NotFoundException on unknown location ID (LOC-U-004)', async () => {
      // Arrange
      repo.findOne.mockResolvedValue(null);

      // Act / Assert
      await expect(service.findOne(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should paginate locations and keep includeSeats as a follow-up load', async () => {
      const qb = {
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([
          [
            {
              LOCATION_ID: 1,
              LOCATION_NAME: 'Room A',
              LOCATION_SEAT_DIRECTION: SeatDirection.HORIZONTAL,
              LOCATION_AISLE_AFTER_COL: [],
            },
          ],
          1,
        ]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);
      repo.find.mockResolvedValue([
        {
          LOCATION_ID: 1,
          LOCATION_NAME: 'Room A',
          LOCATION_SEAT_DIRECTION: SeatDirection.HORIZONTAL,
          LOCATION_AISLE_AFTER_COL: [],
          SEATS: [],
        },
      ]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        includeSeats: true,
        search: 'Room',
      });

      expect(qb.andWhere).toHaveBeenCalled();
      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['SEATS'],
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });
});
