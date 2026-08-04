import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamCertificate } from '../exam-certificates/entities/exam-certificate.entity';
import { Receipt, ReceiptStatus } from '../receipts/entities/receipt.entity';
import { TransactionChannel } from '../transactions/entities/transaction.entity';
import { maskIdentifier } from 'src/common/utils/mask-identifier.util';
import { buildReceiptNo } from 'src/common/utils/receipt-no.util';
import type {
  VerifyCertificateResponseDto,
  VerifyReceiptResponseDto,
} from './dto/verify-response.dto';

const BUU_ORGANIZATION = {
  nameTH: 'มหาวิทยาลัยบูรพา',
  nameEN: 'BURAPHA UNIVERSITY',
  taxId: '0994000033100',
} as const;

const RECEIPT_ITEM_DESCRIPTION = 'ค่าสมัครสอบ BUU-GET';

@Injectable()
export class VerifyService {
  constructor(
    @InjectRepository(ExamCertificate)
    private readonly certificateRepository: Repository<ExamCertificate>,
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
  ) {}

  async verifyCertificate(code: string): Promise<VerifyCertificateResponseDto> {
    const certificate = await this.certificateRepository.findOne({
      where: { CERT_CODE: code },
      relations: [
        'SCORE',
        'SCORE.LINES',
        'SCORE.ENROLLMENT',
        'SCORE.ENROLLMENT.SESSION',
        'SCORE.ENROLLMENT.SESSION.EXAM',
        'USER',
        'USER.PROFILE',
      ],
      withDeleted: true,
    });

    if (!certificate || certificate.DELETED_AT) {
      throw new NotFoundException('Certificate not found');
    }

    const enrollment = certificate.SCORE?.ENROLLMENT;
    const exam = enrollment?.SESSION?.EXAM;
    const profile = certificate.USER?.PROFILE;
    const fullName =
      profile?.userFullnameEn?.trim() ||
      profile?.userFullnameTh?.trim() ||
      certificate.USER?.USER_EMAIL ||
      '-';
    const nationalId =
      certificate.USER?.USER_NATIONAL_ID ||
      certificate.USER?.USER_PASSPORT_NO ||
      null;

    const now = new Date();
    let status: VerifyCertificateResponseDto['status'] = 'valid';
    if (certificate.CERT_EXPIRES_AT && certificate.CERT_EXPIRES_AT < now) {
      status = 'expired';
    }

    const scoreLines = (certificate.SCORE?.LINES ?? [])
      .filter((line) => !line.DELETED_AT)
      .sort((a, b) => a.SCL_SORT_ORDER - b.SCL_SORT_ORDER)
      .map((line) => ({
        nameTh: line.SCL_NAME_TH,
        nameEn: line.SCL_NAME_EN,
        score: Number(line.SCL_SCORE ?? 0),
        maxScore: Number(line.SCL_MAX_SCORE),
        sortOrder: line.SCL_SORT_ORDER,
      }));

    return {
      type: 'certificate',
      status,
      verificationCode: certificate.CERT_CODE,
      issuedAt: certificate.CERT_ISSUED_AT?.toISOString() ?? null,
      expiresAt: certificate.CERT_EXPIRES_AT?.toISOString() ?? null,
      holder: {
        fullName,
        testTakerId:
          enrollment?.ERM_TEST_TAKER || certificate.USER?.USER_CODE || '-',
        nationalIdMasked: maskIdentifier(nationalId),
      },
      exam: {
        round: exam?.EXAM_ROUND ?? null,
        date: exam?.EXAM_DATE ?? null,
      },
      scores: {
        vocabGrammar: Number(certificate.SCORE?.SC_LANG_USE_SCORE ?? 0),
        reading: Number(certificate.SCORE?.SC_READING_SCORE ?? 0),
        total: Number(certificate.SCORE?.SC_TOTAL_SCORE ?? 0),
        bandLevel:
          certificate.SCORE?.SC_BAND_LEVEL === null ||
          certificate.SCORE?.SC_BAND_LEVEL === undefined
            ? null
            : certificate.SCORE.SC_BAND_LEVEL,
        lines: scoreLines,
      },
    };
  }

  async verifyReceipt(code: string): Promise<VerifyReceiptResponseDto> {
    const receipt = await this.receiptRepository.findOne({
      where: { RC_VERIFY_CODE: code },
      relations: [
        'TRANSACTION',
        'TRANSACTION.ENROLLMENT',
        'TRANSACTION.ENROLLMENT.SESSION',
        'TRANSACTION.ENROLLMENT.SESSION.EXAM',
      ],
      withDeleted: true,
    });

    if (
      !receipt ||
      receipt.DELETED_AT ||
      receipt.RC_STATUS === ReceiptStatus.UNISSUED
    ) {
      throw new NotFoundException('Receipt not found');
    }

    const transaction = receipt.TRANSACTION;
    const exam = transaction?.ENROLLMENT?.SESSION?.EXAM;
    const referenceDate =
      receipt.RC_ISSUED_AT ?? transaction?.TRANX_PAID_AT ?? receipt.CREATED_AT;
    const receiptNo = buildReceiptNo(
      receipt.RC_ID,
      referenceDate,
      receipt.CREATED_AT,
    );

    if (receipt.RC_STATUS === ReceiptStatus.VOIDED) {
      return {
        type: 'receipt',
        status: 'voided',
        verificationCode: receipt.RC_VERIFY_CODE,
        receiptNo,
        issuedOrPaidAt: referenceDate?.toISOString() ?? null,
        payee: {
          name: receipt.RC_NAME,
          taxIdMasked: maskIdentifier(receipt.RC_TAX_ID),
          address: null,
        },
        payment: {
          amount: null,
          description: RECEIPT_ITEM_DESCRIPTION,
          paymentMethod: null,
          examRound: exam?.EXAM_ROUND ?? null,
          examDate: exam?.EXAM_DATE ?? null,
        },
        organization: { ...BUU_ORGANIZATION },
      };
    }

    return {
      type: 'receipt',
      status: 'valid',
      verificationCode: receipt.RC_VERIFY_CODE,
      receiptNo,
      issuedOrPaidAt: referenceDate?.toISOString() ?? null,
      payee: {
        name: receipt.RC_NAME,
        taxIdMasked: maskIdentifier(receipt.RC_TAX_ID),
        address: receipt.RC_ADDRESS,
      },
      payment: {
        amount: Number(transaction?.TRANX_AMOUNT ?? 0),
        description: RECEIPT_ITEM_DESCRIPTION,
        paymentMethod: this.mapPaymentMethod(transaction?.TRANX_CHANNEL),
        examRound: exam?.EXAM_ROUND ?? null,
        examDate: exam?.EXAM_DATE ?? null,
      },
      organization: { ...BUU_ORGANIZATION },
    };
  }

  private mapPaymentMethod(
    channel: TransactionChannel | undefined,
  ): string | null {
    if (channel === undefined || channel === null) return null;

    switch (channel) {
      case TransactionChannel.QR:
        return 'QR';
      case TransactionChannel.MOBILE_BANKING:
        return 'Mobile Banking';
      case TransactionChannel.ATM:
        return 'ATM';
      case TransactionChannel.COUNTER:
        return 'Counter';
      default:
        return String(channel);
    }
  }
}
