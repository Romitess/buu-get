import { BadRequestException, ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { generateCertificateCode } from 'src/common/utils/verification-code.util';
import { ExamCertificatesService } from './exam-certificates.service';
import { ExamScore } from '../exam-scores/entities/exam-score.entity';
import { ExamCertificate } from './entities/exam-certificate.entity';
import {
  ExamSession,
  ExamSessionStatus,
} from '../exam-sessions/entities/exam-session.entity';
import { CreateExamCertificateDto } from './dto/create-exam-certificate.dto';

jest.mock('./entities/exam-certificate.entity', () => ({
  ExamCertificate: class ExamCertificate {},
}));

jest.mock('../exam-scores/entities/exam-score.entity', () => ({
  ExamScore: class ExamScore {},
}));

jest.mock('../exam-sessions/entities/exam-session.entity', () => ({
  ExamSession: class ExamSession {},
  ExamSessionStatus: {
    DRAFT: 0,
    OPEN: 1,
    SEAT_ALLOCATED: 2,
    VOUCHER_SENT: 3,
    COMPLETED: 4,
    CANCELLED: 5,
  },
}));

jest.mock('src/common/utils/verification-code.util', () => ({
  generateCertificateCode: jest.fn(() => 'AUTO_GENERATED_CODE'),
}));

describe('ExamCertificatesService', () => {
  let service: ExamCertificatesService;
  let scoreFind: jest.Mock;
  let certificateCreate: jest.Mock;
  let certificateSave: jest.Mock;
  let sessionFind: jest.Mock;
  let sessionSave: jest.Mock;
  let examCertificateRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let examScoreRepository: {
    findOne: jest.Mock;
  };
  let examSessionRepository: {
    update: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let platformGatewayService: { sendEmail: jest.Mock };

  const createService = (): ExamCertificatesService =>
    new ExamCertificatesService(
      examCertificateRepository as never,
      examScoreRepository as never,
      examSessionRepository as never,
      platformGatewayService as never,
      dataSource as never,
    );

  const bulkDtoBase = {
    certIssuedAt: '2026-07-27T00:00:00+07:00',
    certExpiresAt: '2028-07-27T00:00:00+07:00',
    examName: 'BUU-GET 1/2569',
    historyUrl: 'https://example.com/#/user/exam-history',
  };

  beforeEach(() => {
    scoreFind = jest.fn();
    certificateCreate = jest
      .fn()
      .mockImplementation((payload: unknown) => payload);
    certificateSave = jest
      .fn()
      .mockImplementation((items) => Promise.resolve(items));
    sessionFind = jest.fn().mockResolvedValue([]);
    sessionSave = jest
      .fn()
      .mockImplementation((items) => Promise.resolve(items));

    examCertificateRepository = {
      create: jest.fn().mockImplementation((payload: unknown) => payload),
      save: jest
        .fn()
        .mockImplementation((entity: ExamCertificate) =>
          Promise.resolve({ ...entity, CERT_ID: 1 }),
        ),
      findOne: jest.fn(),
    };
    (generateCertificateCode as jest.Mock).mockReturnValue(
      'AUTO_GENERATED_CODE',
    );
    examScoreRepository = {
      findOne: jest.fn(),
    };
    examSessionRepository = {
      update: jest.fn().mockResolvedValue(undefined),
    };

    dataSource = {
      transaction: jest.fn(
        (callback: (manager: { getRepository: jest.Mock }) => unknown) => {
          const manager = {
            getRepository: jest.fn((entity: unknown) => {
              if (entity === ExamScore) {
                return { find: scoreFind };
              }
              if (entity === ExamCertificate) {
                return {
                  create: certificateCreate,
                  save: certificateSave,
                };
              }
              if (entity === ExamSession) {
                return {
                  find: sessionFind,
                  save: sessionSave,
                };
              }
              throw new Error(
                `Unexpected repository entity: ${String(entity)}`,
              );
            }),
          };
          return callback(manager);
        },
      ),
    };

    platformGatewayService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    service = createService();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-27T10:00:00+07:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should short-circuit bulkIssue with empty candidates (CERT-U-001)', async () => {
    // Arrange
    const dto = {
      ...bulkDtoBase,
      candidates: [],
    };

    // Act
    const result = await service.bulkIssueCertificates(dto);

    // Assert
    expect(result).toEqual({
      success: true,
      createdCount: 0,
      skippedCount: 0,
    });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('creates certificates and skips duplicates in bulk issue', async () => {
    // Arrange
    scoreFind.mockResolvedValue([
      {
        SCORES_ID: 1,
        CERTIFICATES: [],
        ENROLLMENT: {
          USER_ID: 10,
          SESSION_ID: 100,
          USER: {
            USER_EMAIL: 'student@example.com',
            PROFILE: { userTitleTh: 'นาย', userFullnameTh: 'ทดสอบ ระบบ' },
          },
        },
      },
      {
        SCORES_ID: 2,
        CERTIFICATES: [{ CERT_ID: 99 }],
        ENROLLMENT: {
          USER_ID: 20,
          SESSION_ID: 100,
          USER: {
            USER_EMAIL: 'already@example.com',
            PROFILE: { userTitleTh: 'นาง', userFullnameTh: 'มีแล้ว' },
          },
        },
      },
    ]);
    sessionFind.mockResolvedValue([
      { SS_ID: 100, SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT },
    ]);

    // Act
    const result = await service.bulkIssueCertificates({
      candidates: [
        { SCORES_ID: 1, USER_ID: 10 },
        { SCORES_ID: 2, USER_ID: 20 },
      ],
      ...bulkDtoBase,
    });

    // Assert
    expect(result).toEqual({
      success: true,
      createdCount: 1,
      skippedCount: 1,
    });
    expect(certificateSave).toHaveBeenCalledTimes(1);
    expect(certificateCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        SCORES_ID: 1,
        USER_ID: 10,
      }),
    );
    expect(sessionSave).toHaveBeenCalledWith([
      expect.objectContaining({
        SS_SESSION_STATUS: ExamSessionStatus.COMPLETED,
      }),
    ]);

    await Promise.resolve();
    expect(platformGatewayService.sendEmail).toHaveBeenCalledWith(
      'BUU-GET',
      'student@example.com',
      '[แจ้งเตือนใบรับรองผลสอบ] - BUU-GET 1/2569',
      expect.stringContaining('https://example.com/#/user/exam-history'),
    );
    expect(platformGatewayService.sendEmail).toHaveBeenCalledTimes(1);
  });

  it('should skip already-certified score without creating duplicate (CERT-U-006)', async () => {
    // Arrange
    scoreFind.mockResolvedValue([
      {
        SCORES_ID: 2,
        CERTIFICATES: [{ CERT_ID: 99 }],
        ENROLLMENT: {
          USER_ID: 20,
          SESSION_ID: 100,
          USER: {
            USER_EMAIL: 'already@example.com',
            PROFILE: { userTitleTh: 'นาง', userFullnameTh: 'มีแล้ว' },
          },
        },
      },
    ]);

    // Act
    const result = await service.bulkIssueCertificates({
      candidates: [{ SCORES_ID: 2, USER_ID: 20 }],
      ...bulkDtoBase,
    });

    // Assert
    expect(result).toEqual({
      success: true,
      createdCount: 0,
      skippedCount: 1,
    });
    expect(certificateSave).not.toHaveBeenCalled();
    expect(platformGatewayService.sendEmail).not.toHaveBeenCalled();
  });

  it('should still issue when recipient email is missing (CERT-U-008)', async () => {
    // Arrange
    scoreFind.mockResolvedValue([
      {
        SCORES_ID: 1,
        CERTIFICATES: [],
        ENROLLMENT: {
          USER_ID: 10,
          SESSION_ID: 100,
          USER: {
            USER_EMAIL: '',
            PROFILE: { userTitleTh: '', userFullnameTh: 'ไม่มีอีเมล' },
          },
        },
      },
    ]);

    // Act
    const result = await service.bulkIssueCertificates({
      candidates: [{ SCORES_ID: 1, USER_ID: 10 }],
      ...bulkDtoBase,
    });

    // Assert
    expect(result).toEqual({
      success: true,
      createdCount: 1,
      skippedCount: 0,
    });
    expect(certificateSave).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    expect(platformGatewayService.sendEmail).not.toHaveBeenCalled();
  });

  it('should keep issuance success when email send fails (CERT-U-009)', async () => {
    // Arrange
    scoreFind.mockResolvedValue([
      {
        SCORES_ID: 1,
        CERTIFICATES: [],
        ENROLLMENT: {
          USER_ID: 10,
          SESSION_ID: 100,
          USER: {
            USER_EMAIL: 'student@example.com',
            PROFILE: { userTitleTh: 'นาย', userFullnameTh: 'ทดสอบ' },
          },
        },
      },
    ]);
    platformGatewayService.sendEmail.mockRejectedValue(
      new Error('SMTP unavailable'),
    );

    // Act
    const result = await service.bulkIssueCertificates({
      candidates: [{ SCORES_ID: 1, USER_ID: 10 }],
      ...bulkDtoBase,
    });

    // Assert
    expect(result).toEqual({
      success: true,
      createdCount: 1,
      skippedCount: 0,
    });
    expect(certificateSave).toHaveBeenCalledTimes(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(platformGatewayService.sendEmail).toHaveBeenCalled();
  });

  it('should reject future Report Issue Date (CERT-U-002)', async () => {
    // Arrange
    const dto = {
      candidates: [{ SCORES_ID: 1, USER_ID: 10 }],
      ...bulkDtoBase,
      certIssuedAt: '2026-07-28T00:00:00+07:00',
    };

    // Act & Assert
    await expect(service.bulkIssueCertificates(dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should reject expiry date before issue date (CERT-U-003)', async () => {
    // Arrange
    const dto = {
      candidates: [{ SCORES_ID: 1, USER_ID: 10 }],
      ...bulkDtoBase,
      certIssuedAt: '2026-07-27T00:00:00+07:00',
      certExpiresAt: '2026-07-26T00:00:00+07:00',
    };

    // Act & Assert
    await expect(service.bulkIssueCertificates(dto)).rejects.toThrow(
      /วันที่สิ้นสุดอายุผลสอบต้องไม่มาก่อนวันที่ออกใบรับรอง/,
    );
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('should reject missing SCORES_ID in requested candidates (CERT-U-004)', async () => {
    // Arrange
    scoreFind.mockResolvedValue([
      {
        SCORES_ID: 1,
        CERTIFICATES: [],
        ENROLLMENT: {
          USER_ID: 10,
          SESSION_ID: 100,
          USER: {
            USER_EMAIL: 'student@example.com',
            PROFILE: { userTitleTh: 'นาย', userFullnameTh: 'ทดสอบ' },
          },
        },
      },
    ]);

    // Act & Assert
    await expect(
      service.bulkIssueCertificates({
        candidates: [
          { SCORES_ID: 1, USER_ID: 10 },
          { SCORES_ID: 999, USER_ID: 20 },
        ],
        ...bulkDtoBase,
      }),
    ).rejects.toThrow(/ไม่พบข้อมูลคะแนน SCORES_ID: 999/);
  });

  it('should reject USER_ID mismatch against score enrollment (CERT-U-005)', async () => {
    // Arrange
    scoreFind.mockResolvedValue([
      {
        SCORES_ID: 1,
        CERTIFICATES: [],
        ENROLLMENT: {
          USER_ID: 10,
          SESSION_ID: 100,
          USER: {
            USER_EMAIL: 'student@example.com',
            PROFILE: { userTitleTh: 'นาย', userFullnameTh: 'ทดสอบ' },
          },
        },
      },
    ]);

    // Act & Assert
    await expect(
      service.bulkIssueCertificates({
        candidates: [{ SCORES_ID: 1, USER_ID: 99 }],
        ...bulkDtoBase,
      }),
    ).rejects.toThrow(/USER_ID ไม่ตรงกับคะแนน SCORES_ID 1/);
  });

  it('should update session status to COMPLETED on create (CERT-U-007)', async () => {
    // Arrange
    const dto: CreateExamCertificateDto = {
      SCORES_ID: 1,
      USER_ID: 10,
      CERT_ISSUED_AT: '2026-07-27T00:00:00+07:00',
      CERT_EXPIRES_AT: '2028-07-27T00:00:00+07:00',
    };
    examScoreRepository.findOne.mockResolvedValue({
      SCORES_ID: 1,
      ENROLLMENT: { SESSION_ID: 100 },
    });

    // Act
    const result = await service.create(dto);

    // Assert
    expect(examCertificateRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        SCORES_ID: 1,
        USER_ID: 10,
      }),
    );
    expect(examCertificateRepository.save).toHaveBeenCalled();
    expect(examSessionRepository.update).toHaveBeenCalledWith(100, {
      SS_SESSION_STATUS: ExamSessionStatus.COMPLETED,
    });
    expect(result.CERT_ID).toBe(1);
  });

  it('should mark session COMPLETED in bulk issue path (CERT-U-007)', async () => {
    // Arrange
    scoreFind.mockResolvedValue([
      {
        SCORES_ID: 1,
        CERTIFICATES: [],
        ENROLLMENT: {
          USER_ID: 10,
          SESSION_ID: 55,
          USER: {
            USER_EMAIL: 'a@example.com',
            PROFILE: { userTitleTh: '', userFullnameTh: 'A' },
          },
        },
      },
    ]);
    sessionFind.mockResolvedValue([
      { SS_ID: 55, SS_SESSION_STATUS: ExamSessionStatus.VOUCHER_SENT },
    ]);

    // Act
    await service.bulkIssueCertificates({
      candidates: [{ SCORES_ID: 1, USER_ID: 10 }],
      ...bulkDtoBase,
    });

    // Assert
    expect(sessionSave).toHaveBeenCalledWith([
      expect.objectContaining({
        SS_ID: 55,
        SS_SESSION_STATUS: ExamSessionStatus.COMPLETED,
      }),
    ]);
  });

  it('should trim custom CERT_CODE or auto-generate when blank (CERT-U-010)', async () => {
    // Arrange
    (generateCertificateCode as jest.Mock).mockClear();
    const dtoWithCode: CreateExamCertificateDto = {
      SCORES_ID: 1,
      USER_ID: 10,
      CERT_ISSUED_AT: '2026-07-27T00:00:00+07:00',
      CERT_EXPIRES_AT: '2028-07-27T00:00:00+07:00',
      CERT_CODE: '  CUSTOM-CODE  ',
    };
    examScoreRepository.findOne.mockResolvedValue({
      SCORES_ID: 1,
      ENROLLMENT: { SESSION_ID: 100 },
    });

    // Act
    await service.create(dtoWithCode);

    // Assert
    expect(examCertificateRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        CERT_CODE: 'CUSTOM-CODE',
      }),
    );
    expect(generateCertificateCode).not.toHaveBeenCalled();

    // Arrange — blank / whitespace falls back to generator
    (generateCertificateCode as jest.Mock).mockClear();
    examCertificateRepository.create.mockClear();
    const dtoBlankCode: CreateExamCertificateDto = {
      SCORES_ID: 1,
      USER_ID: 10,
      CERT_ISSUED_AT: '2026-07-27T00:00:00+07:00',
      CERT_EXPIRES_AT: '2028-07-27T00:00:00+07:00',
      CERT_CODE: '   ',
    };

    // Act
    await service.create(dtoBlankCode);

    // Assert
    expect(generateCertificateCode).toHaveBeenCalled();
    expect(examCertificateRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        CERT_CODE: 'AUTO_GENERATED_CODE',
      }),
    );
  });

  it('should map duplicate CERT_CODE on create to ConflictException (CERT-U-012)', async () => {
    const dto: CreateExamCertificateDto = {
      SCORES_ID: 1,
      USER_ID: 10,
      CERT_ISSUED_AT: '2026-07-27T00:00:00+07:00',
      CERT_EXPIRES_AT: '2028-07-27T00:00:00+07:00',
      CERT_CODE: 'DUP-CODE',
    };
    const dupError = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error("Duplicate entry 'DUP-CODE' for key 'CERT_CODE'"), {
        code: 'ER_DUP_ENTRY',
        errno: 1062,
      }),
    );
    examCertificateRepository.save.mockRejectedValue(dupError);

    await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.create(dto)).rejects.toThrow(
      /รหัสใบรับรอง \(CERT_CODE\) ซ้ำ/,
    );
    expect(examSessionRepository.update).not.toHaveBeenCalled();
  });

  it('should map duplicate CERT_CODE on bulk issue to ConflictException (CERT-U-013)', async () => {
    scoreFind.mockResolvedValue([
      {
        SCORES_ID: 1,
        CERTIFICATES: [],
        ENROLLMENT: {
          USER_ID: 10,
          SESSION_ID: 100,
          USER: {
            USER_EMAIL: 'student@example.com',
            PROFILE: { userTitleTh: 'นาย', userFullnameTh: 'ทดสอบ' },
          },
        },
      },
    ]);
    const dupError = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(
        new Error("Duplicate entry 'AUTO_GENERATED_CODE' for key 'CERT_CODE'"),
        { code: 'ER_DUP_ENTRY', errno: 1062 },
      ),
    );
    certificateSave.mockRejectedValue(dupError);

    await expect(
      service.bulkIssueCertificates({
        candidates: [{ SCORES_ID: 1, USER_ID: 10 }],
        ...bulkDtoBase,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should reject future issue date on update (CERT-U-011)', async () => {
    // Arrange
    const futureIssuedAt = '2026-07-28T00:00:00+07:00';

    // Act & Assert
    await expect(
      service.update(1, { CERT_ISSUED_AT: futureIssuedAt }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.update(1, { CERT_ISSUED_AT: futureIssuedAt }),
    ).rejects.toThrow(
      /วันที่ออกใบรับรอง \(Report Issue Date\) ต้องไม่เป็นวันในอนาคต/,
    );
    expect(examCertificateRepository.findOne).not.toHaveBeenCalled();
    expect(examCertificateRepository.save).not.toHaveBeenCalled();
  });
});
