import { BadRequestException } from '@nestjs/common';
import { ExamCertificatesService } from './exam-certificates.service';
import { ExamScore } from '../exam-scores/entities/exam-score.entity';
import { ExamCertificate } from './entities/exam-certificate.entity';
import {
  ExamSession,
  ExamSessionStatus,
} from '../exam-sessions/entities/exam-session.entity';

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

describe('ExamCertificatesService', () => {
  let service: ExamCertificatesService;
  let scoreFind: jest.Mock;
  let certificateCreate: jest.Mock;
  let certificateSave: jest.Mock;
  let sessionFind: jest.Mock;
  let sessionSave: jest.Mock;
  let dataSource: { transaction: jest.Mock };
  let platformGatewayService: { sendEmail: jest.Mock };

  const createService = (): ExamCertificatesService =>
    new ExamCertificatesService(
      {} as never,
      {} as never,
      {} as never,
      platformGatewayService as never,
      dataSource as never,
    );

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

  it('creates certificates and skips duplicates in bulk issue', async () => {
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

    const result = await service.bulkIssueCertificates({
      candidates: [
        { SCORES_ID: 1, USER_ID: 10 },
        { SCORES_ID: 2, USER_ID: 20 },
      ],
      certIssuedAt: '2026-07-27T00:00:00+07:00',
      certExpiresAt: '2028-07-27T00:00:00+07:00',
      examName: 'BUU-GET 1/2569',
      historyUrl: 'https://example.com/#/user/exam-history',
    });

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

  it('does not send email when user has no email address', async () => {
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

    const result = await service.bulkIssueCertificates({
      candidates: [{ SCORES_ID: 1, USER_ID: 10 }],
      certIssuedAt: '2026-07-27T00:00:00+07:00',
      certExpiresAt: '2028-07-27T00:00:00+07:00',
      examName: 'BUU-GET 1/2569',
      historyUrl: 'https://example.com/#/user/exam-history',
    });

    expect(result.createdCount).toBe(1);
    await Promise.resolve();
    expect(platformGatewayService.sendEmail).not.toHaveBeenCalled();
  });

  it('rejects future Report Issue Date', async () => {
    await expect(
      service.bulkIssueCertificates({
        candidates: [{ SCORES_ID: 1, USER_ID: 10 }],
        certIssuedAt: '2026-07-28T00:00:00+07:00',
        certExpiresAt: '2028-07-27T00:00:00+07:00',
        examName: 'BUU-GET 1/2569',
        historyUrl: 'https://example.com/#/user/exam-history',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(dataSource.transaction).not.toHaveBeenCalled();
  });
});
