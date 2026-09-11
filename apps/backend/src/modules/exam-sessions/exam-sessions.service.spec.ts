import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { MemberSessionCodesService } from 'src/common/services/member-session-codes.service';
import { Exam } from '../exam/entities/exam.entity';
import { ExamSessionsService } from './exam-sessions.service';
import { ExamSession } from './entities/exam-session.entity';

type MockRepo = {
  create: jest.Mock;
  save: jest.Mock;
  findOne: jest.Mock;
  update: jest.Mock;
  merge: jest.Mock;
  softRemove: jest.Mock;
};

const createMockRepo = (): MockRepo => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  merge: jest.fn(),
  softRemove: jest.fn(),
});

describe('ExamSessionsService', () => {
  let service: ExamSessionsService;
  let repo: MockRepo;
  let examRepo: MockRepo;
  let codesService: { allocateSessionCode: jest.Mock };

  beforeEach(async () => {
    repo = createMockRepo();
    examRepo = createMockRepo();
    codesService = {
      allocateSessionCode: jest.fn().mockResolvedValue('12026001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamSessionsService,
        {
          provide: getRepositoryToken(ExamSession),
          useValue: repo,
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(
              async (
                cb: (manager: {
                  getRepository: (entity: unknown) => MockRepo;
                }) => unknown,
              ) =>
                cb({
                  getRepository: (entity: unknown) =>
                    entity === Exam ? examRepo : repo,
                }),
            ),
          },
        },
        {
          provide: MemberSessionCodesService,
          useValue: codesService,
        },
      ],
    }).compile();

    service = module.get(ExamSessionsService);
  });

  describe('create', () => {
    it('should create then allocate SESSION_CODE (SES-U-001)', async () => {
      // Arrange
      examRepo.findOne.mockResolvedValue({
        EXAM_ID: 2,
        EXAM_TYPE: 'รอบทั่วไป',
        EXAM_FISCAL_YEAR: '2026',
      });
      repo.create.mockReturnValue({ EXAM_ID: 2, SS_START_TIME: '09:00:00' });
      repo.save.mockResolvedValue({
        SS_ID: 44,
        EXAM_ID: 2,
        CREATED_AT: new Date('2026-09-09T00:00:00Z'),
      });
      const hydrated = {
        SS_ID: 44,
        SESSION_CODE: '12026001',
        EXAM: { EXAM_ID: 2 },
      } as ExamSession;
      repo.findOne.mockResolvedValue(hydrated);

      // Act
      const result = await service.create({
        EXAM_ID: 2,
        SS_START_TIME: '09:00:00',
        SS_END_TIME: '10:00:00',
      });

      // Assert
      expect(codesService.allocateSessionCode).toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith(
        { SS_ID: 44 },
        { SESSION_CODE: '12026001' },
      );
      expect(result).toBe(hydrated);
    });

    it('should throw when exam is missing', async () => {
      examRepo.findOne.mockResolvedValue(null);
      await expect(
        service.create({ EXAM_ID: 999, SS_START_TIME: '09:00:00' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when missing', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne(1)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
