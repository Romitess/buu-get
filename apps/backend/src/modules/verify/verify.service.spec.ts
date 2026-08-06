import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { VerifyService } from './verify.service';
import { ExamCertificate } from '../exam-certificates/entities/exam-certificate.entity';
import { Receipt, ReceiptStatus } from '../receipts/entities/receipt.entity';
import { TransactionChannel } from '../transactions/entities/transaction.entity';

describe('VerifyService', () => {
  let service: VerifyService;
  let certificateRepository: jest.Mocked<
    Pick<Repository<ExamCertificate>, 'findOne'>
  >;
  let receiptRepository: jest.Mocked<Pick<Repository<Receipt>, 'findOne'>>;

  const futureDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d;
  };

  const baseCertificate = (
    overrides: Record<string, unknown> = {},
  ): ExamCertificate =>
    ({
      CERT_ID: 1,
      CERT_CODE: 'CERT-VALID',
      CERT_ISSUED_AT: new Date('2025-01-15T00:00:00.000Z'),
      CERT_EXPIRES_AT: futureDate(),
      DELETED_AT: null,
      SCORE: {
        SC_LANG_USE_SCORE: 40,
        SC_READING_SCORE: 45,
        SC_TOTAL_SCORE: 85,
        SC_BAND_LEVEL: 'B2',
        LINES: [],
        ENROLLMENT: {
          ERM_TEST_TAKER: 'TT000001',
          SESSION: {
            EXAM: {
              EXAM_ROUND: 'Round 1',
              EXAM_DATE: '2025-03-01',
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
          userFullnameTh: 'ทดสอบ',
        },
      },
      ...overrides,
    }) as unknown as ExamCertificate;

  const baseIssuedReceipt = (
    overrides: Record<string, unknown> = {},
  ): Receipt =>
    ({
      RC_ID: 42,
      RC_VERIFY_CODE: 'RCP-ISSUED',
      RC_STATUS: ReceiptStatus.ISSUED,
      RC_NAME: 'Payee Name',
      RC_TAX_ID: '1234567890123',
      RC_ADDRESS: '123 Main St',
      RC_ISSUED_AT: new Date('2025-06-10T08:00:00.000Z'),
      CREATED_AT: new Date('2025-06-01T00:00:00.000Z'),
      DELETED_AT: null,
      TRANSACTION: {
        TRANX_AMOUNT: 1500,
        TRANX_CHANNEL: TransactionChannel.QR,
        TRANX_PAID_AT: new Date('2025-06-05T12:00:00.000Z'),
        ENROLLMENT: {
          SESSION: {
            EXAM: {
              EXAM_ROUND: 'Round 3',
              EXAM_DATE: '2025-07-01',
            },
          },
        },
      },
      ...overrides,
    }) as unknown as Receipt;

  beforeEach(() => {
    certificateRepository = { findOne: jest.fn() };
    receiptRepository = { findOne: jest.fn() };
    service = new VerifyService(
      certificateRepository as unknown as Repository<ExamCertificate>,
      receiptRepository as unknown as Repository<Receipt>,
    );
  });

  describe('verifyCertificate', () => {
    // VERIFY-U-001
    it('should throw NotFoundException when certificate is not found', async () => {
      // Arrange
      certificateRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyCertificate('CERT-MISSING')).rejects.toThrow(
        NotFoundException,
      );
    });

    // VERIFY-U-002
    it('should throw NotFoundException when certificate is soft-deleted', async () => {
      // Arrange
      certificateRepository.findOne.mockResolvedValue(
        baseCertificate({ DELETED_AT: new Date('2025-01-01T00:00:00.000Z') }),
      );

      // Act & Assert
      await expect(service.verifyCertificate('CERT-DELETED')).rejects.toThrow(
        NotFoundException,
      );
    });

    // VERIFY-U-003
    it('should return valid certificate response when certificate is non-expired', async () => {
      // Arrange
      const expiresAt = futureDate();
      certificateRepository.findOne.mockResolvedValue(
        baseCertificate({
          CERT_CODE: 'CERT-ABC',
          CERT_ISSUED_AT: new Date('2025-01-15T00:00:00.000Z'),
          CERT_EXPIRES_AT: expiresAt,
        }),
      );

      // Act
      const result = await service.verifyCertificate('CERT-ABC');

      // Assert
      expect(result).toMatchObject({
        type: 'certificate',
        status: 'valid',
        verificationCode: 'CERT-ABC',
        issuedAt: '2025-01-15T00:00:00.000Z',
        expiresAt: expiresAt.toISOString(),
        holder: {
          fullName: 'Test User',
          testTakerId: 'TT000001',
          nationalIdMasked: '12345****0123',
        },
        exam: {
          round: 'Round 1',
          date: '2025-03-01',
        },
        scores: {
          vocabGrammar: 40,
          reading: 45,
          total: 85,
          bandLevel: 'B2',
          lines: [],
        },
      });
    });

    // VERIFY-U-004
    it('should return expired certificate details when CERT_EXPIRES_AT is past', async () => {
      // Arrange
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

      // Act
      const result = await service.verifyCertificate('CERT-ABC');

      // Assert
      expect(result.status).toBe('expired');
      expect(result.holder.nationalIdMasked).toBe('12345****0123');
      expect(result.scores.total).toBe(65);
      expect(result.scores.bandLevel).toBe('B1');
    });

    // VERIFY-U-005
    it('should keep status valid when CERT_EXPIRES_AT is null', async () => {
      // Arrange
      certificateRepository.findOne.mockResolvedValue(
        baseCertificate({ CERT_EXPIRES_AT: null }),
      );

      // Act
      const result = await service.verifyCertificate('CERT-VALID');

      // Assert
      expect(result.status).toBe('valid');
      expect(result.expiresAt).toBeNull();
    });

    // VERIFY-U-006
    describe('holder fullName fallback', () => {
      it('should prefer English full name when present', async () => {
        // Arrange
        certificateRepository.findOne.mockResolvedValue(
          baseCertificate({
            USER: {
              USER_CODE: 'U1',
              USER_EMAIL: 'a@b.com',
              USER_NATIONAL_ID: null,
              USER_PASSPORT_NO: null,
              PROFILE: {
                userFullnameEn: '  English Name  ',
                userFullnameTh: 'ชื่อไทย',
              },
            },
          }),
        );

        // Act
        const result = await service.verifyCertificate('CERT-VALID');

        // Assert
        expect(result.holder.fullName).toBe('English Name');
      });

      it('should fall back to Thai full name when English is empty', async () => {
        // Arrange
        certificateRepository.findOne.mockResolvedValue(
          baseCertificate({
            USER: {
              USER_CODE: 'U1',
              USER_EMAIL: 'a@b.com',
              USER_NATIONAL_ID: null,
              USER_PASSPORT_NO: null,
              PROFILE: {
                userFullnameEn: '   ',
                userFullnameTh: '  ชื่อไทย  ',
              },
            },
          }),
        );

        // Act
        const result = await service.verifyCertificate('CERT-VALID');

        // Assert
        expect(result.holder.fullName).toBe('ชื่อไทย');
      });

      it('should fall back to email when both names are empty', async () => {
        // Arrange
        certificateRepository.findOne.mockResolvedValue(
          baseCertificate({
            USER: {
              USER_CODE: 'U1',
              USER_EMAIL: 'fallback@example.com',
              USER_NATIONAL_ID: null,
              USER_PASSPORT_NO: null,
              PROFILE: {
                userFullnameEn: null,
                userFullnameTh: null,
              },
            },
          }),
        );

        // Act
        const result = await service.verifyCertificate('CERT-VALID');

        // Assert
        expect(result.holder.fullName).toBe('fallback@example.com');
      });

      it("should fall back to '-' when name and email are missing", async () => {
        // Arrange
        certificateRepository.findOne.mockResolvedValue(
          baseCertificate({
            USER: {
              USER_CODE: 'U1',
              USER_EMAIL: null,
              USER_NATIONAL_ID: null,
              USER_PASSPORT_NO: null,
              PROFILE: {
                userFullnameEn: null,
                userFullnameTh: '',
              },
            },
          }),
        );

        // Act
        const result = await service.verifyCertificate('CERT-VALID');

        // Assert
        expect(result.holder.fullName).toBe('-');
      });
    });

    // VERIFY-U-007
    describe('testTakerId fallback', () => {
      it('should use ERM_TEST_TAKER when present', async () => {
        // Arrange
        certificateRepository.findOne.mockResolvedValue(baseCertificate());

        // Act
        const result = await service.verifyCertificate('CERT-VALID');

        // Assert
        expect(result.holder.testTakerId).toBe('TT000001');
      });

      it('should fall back to USER_CODE when ERM_TEST_TAKER is missing', async () => {
        // Arrange
        certificateRepository.findOne.mockResolvedValue(
          baseCertificate({
            SCORE: {
              SC_LANG_USE_SCORE: 0,
              SC_READING_SCORE: 0,
              SC_TOTAL_SCORE: 0,
              SC_BAND_LEVEL: null,
              LINES: [],
              ENROLLMENT: {
                ERM_TEST_TAKER: null,
                SESSION: { EXAM: { EXAM_ROUND: null, EXAM_DATE: null } },
              },
            },
            USER: {
              USER_CODE: 'U9999999',
              USER_EMAIL: 'x@y.com',
              USER_NATIONAL_ID: null,
              USER_PASSPORT_NO: null,
              PROFILE: { userFullnameEn: 'X', userFullnameTh: null },
            },
          }),
        );

        // Act
        const result = await service.verifyCertificate('CERT-VALID');

        // Assert
        expect(result.holder.testTakerId).toBe('U9999999');
      });

      it("should fall back to '-' when enrollment and USER_CODE are missing", async () => {
        // Arrange
        certificateRepository.findOne.mockResolvedValue(
          baseCertificate({
            SCORE: null,
            USER: {
              USER_CODE: null,
              USER_EMAIL: 'x@y.com',
              USER_NATIONAL_ID: null,
              USER_PASSPORT_NO: null,
              PROFILE: { userFullnameEn: 'X', userFullnameTh: null },
            },
          }),
        );

        // Act
        const result = await service.verifyCertificate('CERT-VALID');

        // Assert
        expect(result.holder.testTakerId).toBe('-');
      });
    });

    // VERIFY-U-008
    describe('nationalId mask preference', () => {
      it('should prefer national ID over passport when both present', async () => {
        // Arrange
        certificateRepository.findOne.mockResolvedValue(
          baseCertificate({
            USER: {
              USER_CODE: 'U1',
              USER_EMAIL: 'a@b.com',
              USER_NATIONAL_ID: '1234567890123',
              USER_PASSPORT_NO: 'AB1234567',
              PROFILE: { userFullnameEn: 'X', userFullnameTh: null },
            },
          }),
        );

        // Act
        const result = await service.verifyCertificate('CERT-VALID');

        // Assert
        expect(result.holder.nationalIdMasked).toBe('12345****0123');
      });

      it('should mask passport when national ID is absent', async () => {
        // Arrange
        certificateRepository.findOne.mockResolvedValue(
          baseCertificate({
            USER: {
              USER_CODE: 'U1',
              USER_EMAIL: 'a@b.com',
              USER_NATIONAL_ID: null,
              USER_PASSPORT_NO: 'AB1234567',
              PROFILE: { userFullnameEn: 'X', userFullnameTh: null },
            },
          }),
        );

        // Act
        const result = await service.verifyCertificate('CERT-VALID');

        // Assert
        // maskIdentifier extracts digits from passport AB1234567 → 1234567 → 12****67
        expect(result.holder.nationalIdMasked).toBe('12****67');
      });

      it('should return null nationalIdMasked when both IDs are absent', async () => {
        // Arrange
        certificateRepository.findOne.mockResolvedValue(
          baseCertificate({
            USER: {
              USER_CODE: 'U1',
              USER_EMAIL: 'a@b.com',
              USER_NATIONAL_ID: null,
              USER_PASSPORT_NO: null,
              PROFILE: { userFullnameEn: 'X', userFullnameTh: null },
            },
          }),
        );

        // Act
        const result = await service.verifyCertificate('CERT-VALID');

        // Assert
        expect(result.holder.nationalIdMasked).toBeNull();
      });
    });

    // VERIFY-U-009
    it('should filter soft-deleted score lines then sort and map by SCL_SORT_ORDER', async () => {
      // Arrange
      certificateRepository.findOne.mockResolvedValue(
        baseCertificate({
          SCORE: {
            SC_LANG_USE_SCORE: 10,
            SC_READING_SCORE: 20,
            SC_TOTAL_SCORE: 30,
            SC_BAND_LEVEL: 'A2',
            LINES: [
              {
                SCL_NAME_TH: 'อ่าน',
                SCL_NAME_EN: 'Reading',
                SCL_SCORE: 20,
                SCL_MAX_SCORE: 50,
                SCL_SORT_ORDER: 2,
                DELETED_AT: null,
              },
              {
                SCL_NAME_TH: 'ลบแล้ว',
                SCL_NAME_EN: 'Deleted',
                SCL_SCORE: 99,
                SCL_MAX_SCORE: 100,
                SCL_SORT_ORDER: 0,
                DELETED_AT: new Date('2025-01-01T00:00:00.000Z'),
              },
              {
                SCL_NAME_TH: 'ไวยากรณ์',
                SCL_NAME_EN: 'Grammar',
                SCL_SCORE: null,
                SCL_MAX_SCORE: '40',
                SCL_SORT_ORDER: 1,
                DELETED_AT: null,
              },
            ],
            ENROLLMENT: {
              ERM_TEST_TAKER: 'TT1',
              SESSION: { EXAM: { EXAM_ROUND: 'R1', EXAM_DATE: '2025-01-01' } },
            },
          },
        }),
      );

      // Act
      const result = await service.verifyCertificate('CERT-VALID');

      // Assert
      expect(result.scores.lines).toEqual([
        {
          nameTh: 'ไวยากรณ์',
          nameEn: 'Grammar',
          score: 0,
          maxScore: 40,
          sortOrder: 1,
        },
        {
          nameTh: 'อ่าน',
          nameEn: 'Reading',
          score: 20,
          maxScore: 50,
          sortOrder: 2,
        },
      ]);
    });

    // VERIFY-U-010
    it('should return bandLevel null when SC_BAND_LEVEL is null', async () => {
      // Arrange
      certificateRepository.findOne.mockResolvedValue(
        baseCertificate({
          SCORE: {
            SC_LANG_USE_SCORE: 0,
            SC_READING_SCORE: 0,
            SC_TOTAL_SCORE: 0,
            SC_BAND_LEVEL: null,
            LINES: [],
            ENROLLMENT: {
              ERM_TEST_TAKER: 'TT1',
              SESSION: { EXAM: { EXAM_ROUND: null, EXAM_DATE: null } },
            },
          },
        }),
      );

      // Act
      const result = await service.verifyCertificate('CERT-VALID');

      // Assert
      expect(result.scores.bandLevel).toBeNull();
    });

    // VERIFY-U-011
    it('should map deprecated vocabGrammar and reading from SCORE fields', async () => {
      // Arrange
      certificateRepository.findOne.mockResolvedValue(
        baseCertificate({
          SCORE: {
            SC_LANG_USE_SCORE: '33.5',
            SC_READING_SCORE: '44',
            SC_TOTAL_SCORE: '77.5',
            SC_BAND_LEVEL: 'B1',
            LINES: [],
            ENROLLMENT: {
              ERM_TEST_TAKER: 'TT1',
              SESSION: { EXAM: { EXAM_ROUND: null, EXAM_DATE: null } },
            },
          },
        }),
      );

      // Act
      const result = await service.verifyCertificate('CERT-VALID');

      // Assert
      expect(result.scores.vocabGrammar).toBe(33.5);
      expect(result.scores.reading).toBe(44);
      expect(result.scores.total).toBe(77.5);
    });
  });

  describe('verifyReceipt', () => {
    // VERIFY-U-012
    it('should throw NotFoundException when receipt is not found', async () => {
      // Arrange
      receiptRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyReceipt('RCP-MISSING')).rejects.toThrow(
        NotFoundException,
      );
    });

    // VERIFY-U-013
    it('should throw NotFoundException when receipt is soft-deleted', async () => {
      // Arrange
      receiptRepository.findOne.mockResolvedValue(
        baseIssuedReceipt({
          DELETED_AT: new Date('2025-01-01T00:00:00.000Z'),
        }),
      );

      // Act & Assert
      await expect(service.verifyReceipt('RCP-DELETED')).rejects.toThrow(
        NotFoundException,
      );
    });

    // VERIFY-U-014
    it('should throw NotFoundException when receipt is unissued', async () => {
      // Arrange
      receiptRepository.findOne.mockResolvedValue({
        RC_ID: 10,
        RC_VERIFY_CODE: 'RCP-ABC',
        RC_STATUS: ReceiptStatus.UNISSUED,
        DELETED_AT: null,
      } as Receipt);

      // Act & Assert
      await expect(service.verifyReceipt('RCP-ABC')).rejects.toThrow(
        NotFoundException,
      );
    });

    // VERIFY-U-015
    it('should return voided receipt with limited payment details', async () => {
      // Arrange
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

      // Act
      const result = await service.verifyReceipt('RCP-VOID');

      // Assert
      expect(result.status).toBe('voided');
      expect(result.payment.amount).toBeNull();
      expect(result.payee.address).toBeNull();
      expect(result.receiptNo).toBe('RC2025-00010');
    });

    // VERIFY-U-016
    it('should return full valid payload for issued receipt', async () => {
      // Arrange
      receiptRepository.findOne.mockResolvedValue(baseIssuedReceipt());

      // Act
      const result = await service.verifyReceipt('RCP-ISSUED');

      // Assert
      expect(result).toEqual({
        type: 'receipt',
        status: 'valid',
        verificationCode: 'RCP-ISSUED',
        receiptNo: 'RC2025-00042',
        issuedOrPaidAt: '2025-06-10T08:00:00.000Z',
        payee: {
          name: 'Payee Name',
          taxIdMasked: '12345****0123',
          address: '123 Main St',
        },
        payment: {
          amount: 1500,
          description: 'ค่าสมัครสอบ BUU-GET',
          paymentMethod: 'QR',
          examRound: 'Round 3',
          examDate: '2025-07-01',
        },
        organization: {
          nameTH: 'มหาวิทยาลัยบูรพา',
          nameEN: 'BURAPHA UNIVERSITY',
          taxId: '0994000033100',
        },
      });
    });

    // VERIFY-U-017 (partial — receiptNo via voided fixture still covered; issued also asserts)
    it('should build receiptNo as RC{year}-{pad5} from reference date', async () => {
      // Arrange
      receiptRepository.findOne.mockResolvedValue(
        baseIssuedReceipt({
          RC_ID: 7,
          RC_ISSUED_AT: new Date('2024-03-15T00:00:00.000Z'),
        }),
      );

      // Act
      const result = await service.verifyReceipt('RCP-ISSUED');

      // Assert
      expect(result.receiptNo).toBe('RC2024-00007');
    });

    // VERIFY-U-018
    describe('issuedOrPaidAt date priority', () => {
      it('should prefer RC_ISSUED_AT when present', async () => {
        // Arrange
        receiptRepository.findOne.mockResolvedValue(baseIssuedReceipt());

        // Act
        const result = await service.verifyReceipt('RCP-ISSUED');

        // Assert
        expect(result.issuedOrPaidAt).toBe('2025-06-10T08:00:00.000Z');
      });

      it('should fall back to TRANX_PAID_AT when RC_ISSUED_AT is null', async () => {
        // Arrange
        receiptRepository.findOne.mockResolvedValue(
          baseIssuedReceipt({ RC_ISSUED_AT: null }),
        );

        // Act
        const result = await service.verifyReceipt('RCP-ISSUED');

        // Assert
        expect(result.issuedOrPaidAt).toBe('2025-06-05T12:00:00.000Z');
      });

      it('should fall back to CREATED_AT when issued and paid dates are null', async () => {
        // Arrange
        receiptRepository.findOne.mockResolvedValue(
          baseIssuedReceipt({
            RC_ISSUED_AT: null,
            TRANSACTION: {
              TRANX_AMOUNT: 100,
              TRANX_CHANNEL: TransactionChannel.ATM,
              TRANX_PAID_AT: null,
              ENROLLMENT: {
                SESSION: {
                  EXAM: { EXAM_ROUND: null, EXAM_DATE: null },
                },
              },
            },
          }),
        );

        // Act
        const result = await service.verifyReceipt('RCP-ISSUED');

        // Assert
        expect(result.issuedOrPaidAt).toBe('2025-06-01T00:00:00.000Z');
      });
    });

    // VERIFY-U-019
    describe('mapPaymentMethod channel mapping', () => {
      const cases: Array<{
        channel: TransactionChannel | undefined;
        expected: string | null;
      }> = [
        { channel: TransactionChannel.QR, expected: 'QR' },
        {
          channel: TransactionChannel.MOBILE_BANKING,
          expected: 'Mobile Banking',
        },
        { channel: TransactionChannel.ATM, expected: 'ATM' },
        { channel: TransactionChannel.COUNTER, expected: 'Counter' },
        { channel: undefined, expected: null },
      ];

      it.each(cases)(
        'should map channel $channel to $expected',
        async ({ channel, expected }) => {
          // Arrange
          receiptRepository.findOne.mockResolvedValue(
            baseIssuedReceipt({
              TRANSACTION: {
                TRANX_AMOUNT: 100,
                TRANX_CHANNEL: channel,
                TRANX_PAID_AT: new Date('2025-06-05T12:00:00.000Z'),
                ENROLLMENT: {
                  SESSION: {
                    EXAM: { EXAM_ROUND: null, EXAM_DATE: null },
                  },
                },
              },
            }),
          );

          // Act
          const result = await service.verifyReceipt('RCP-ISSUED');

          // Assert
          expect(result.payment.paymentMethod).toBe(expected);
        },
      );
    });

    // VERIFY-U-020
    it('should use constant receipt description ค่าสมัครสอบ BUU-GET', async () => {
      // Arrange
      receiptRepository.findOne.mockResolvedValue(baseIssuedReceipt());

      // Act
      const result = await service.verifyReceipt('RCP-ISSUED');

      // Assert
      expect(result.payment.description).toBe('ค่าสมัครสอบ BUU-GET');
    });

    // VERIFY-U-021
    it('should return BUU organization constants', async () => {
      // Arrange
      receiptRepository.findOne.mockResolvedValue(baseIssuedReceipt());

      // Act
      const result = await service.verifyReceipt('RCP-ISSUED');

      // Assert
      expect(result.organization).toEqual({
        nameTH: 'มหาวิทยาลัยบูรพา',
        nameEN: 'BURAPHA UNIVERSITY',
        taxId: '0994000033100',
      });
    });
  });
});
