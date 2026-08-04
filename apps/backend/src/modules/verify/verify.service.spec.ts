import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { VerifyService } from './verify.service';
import { ExamCertificate } from '../exam-certificates/entities/exam-certificate.entity';
import { Receipt, ReceiptStatus } from '../receipts/entities/receipt.entity';

describe('VerifyService', () => {
  let service: VerifyService;
  let certificateRepository: jest.Mocked<
    Pick<Repository<ExamCertificate>, 'findOne'>
  >;
  let receiptRepository: jest.Mocked<Pick<Repository<Receipt>, 'findOne'>>;

  beforeEach(() => {
    certificateRepository = { findOne: jest.fn() };
    receiptRepository = { findOne: jest.fn() };
    service = new VerifyService(
      certificateRepository as unknown as Repository<ExamCertificate>,
      receiptRepository as unknown as Repository<Receipt>,
    );
  });

  it('throws when certificate is not found', async () => {
    certificateRepository.findOne.mockResolvedValue(null);

    await expect(service.verifyCertificate('CERT-MISSING')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns expired certificate details', async () => {
    certificateRepository.findOne.mockResolvedValue({
      CERT_ID: 1,
      CERT_CODE: 'CERT-ABC',
      CERT_ISSUED_AT: new Date('2024-01-01T00:00:00.000Z'),
      CERT_EXPIRES_AT: new Date('2024-06-01T00:00:00.000Z'),
      DELETED_AT: null,
      SCORE: {
        SC_LANG_USE_SCORE: 30,
        SC_READING_SCORE: 35,
        SC_TOTAL_SCORE: 65,
        SC_BAND_LEVEL: 'B1',
        ENROLLMENT: {
          ERM_TEST_TAKER: 'TT000001',
          SESSION: {
            EXAM: {
              EXAM_ROUND: 'Round 1',
              EXAM_DATE: '2024-05-01',
            },
          },
        },
      },
      USER: {
        USER_CODE: 'U0000001',
        USER_EMAIL: 'test@example.com',
        USER_NATIONAL_ID: '1234567890123',
        USER_PASSPORT_NO: null,
        PROFILE: {
          userFullnameEn: 'Test User',
          userFullnameTh: null,
        },
      },
    } as ExamCertificate);

    const result = await service.verifyCertificate('CERT-ABC');

    expect(result.status).toBe('expired');
    expect(result.holder.nationalIdMasked).toBe('12345****0123');
    expect(result.scores.total).toBe(65);
    expect(result.scores.bandLevel).toBe('B1');
  });

  it('throws when receipt is unissued', async () => {
    receiptRepository.findOne.mockResolvedValue({
      RC_ID: 10,
      RC_VERIFY_CODE: 'RCP-ABC',
      RC_STATUS: ReceiptStatus.UNISSUED,
      DELETED_AT: null,
    } as Receipt);

    await expect(service.verifyReceipt('RCP-ABC')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns voided receipt with limited payment details', async () => {
    receiptRepository.findOne.mockResolvedValue({
      RC_ID: 10,
      RC_VERIFY_CODE: 'RCP-VOID',
      RC_STATUS: ReceiptStatus.VOIDED,
      RC_NAME: 'Void User',
      RC_TAX_ID: '1234567890123',
      RC_ADDRESS: 'Some Address',
      RC_ISSUED_AT: null,
      CREATED_AT: new Date('2025-01-01T00:00:00.000Z'),
      DELETED_AT: null,
      TRANSACTION: {
        TRANX_AMOUNT: 500,
        TRANX_PAID_AT: new Date('2025-01-02T00:00:00.000Z'),
        ENROLLMENT: {
          SESSION: {
            EXAM: {
              EXAM_ROUND: 'Round 2',
              EXAM_DATE: '2025-02-01',
            },
          },
        },
      },
    } as Receipt);

    const result = await service.verifyReceipt('RCP-VOID');

    expect(result.status).toBe('voided');
    expect(result.payment.amount).toBeNull();
    expect(result.payee.address).toBeNull();
    expect(result.receiptNo).toBe('RC2025-00010');
  });
});
