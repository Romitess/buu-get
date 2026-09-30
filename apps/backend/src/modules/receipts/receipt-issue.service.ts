import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import { resolveImageFolder } from '../platform-gateway/constants/image-category.config';
import { buildReceiptNo } from 'src/common/utils/receipt-no.util';
import { buildReceiptItemDescription } from 'src/common/utils/receipt-description.util';
import { buildReceiptPdfWithSignature } from 'src/common/utils/build-receipt-pdf-with-signature.util';
import { Receipt } from './entities/receipt.entity';

const BUU_ORGANIZATION = {
  nameTH: 'มหาวิทยาลัยบูรพา',
  nameEN: 'BURAPHA UNIVERSITY',
} as const;

export interface ESignSignaturePayload {
  psnId: string;
  fullName: string;
  signatureBase64: string;
}

/** ข้อมูลสำหรับวาดใบเสร็จรูปแบบเดิม ก่อนอัปโหลดไฟล์ที่มีลายเซ็น */
export interface SignedReceiptDraft {
  rcId: number;
  tranxId: number;
  receiptNo: string;
  issuedAt: string;
  payerName: string;
  taxId: string | null;
  address: string | null;
  amount: number;
  description: string;
  examDate: string | null;
  verifyCode: string;
  paymentChannel: number | null;
}

@Injectable()
export class ReceiptIssueService {
  private readonly logger = new Logger(ReceiptIssueService.name);

  constructor(
    private readonly platformGatewayService: PlatformGatewayService,
  ) {}

  /**
   * ดึงลายเซ็นจาก e-sign ตาม psn_id (เก็บใน memory เท่านั้น)
   * ลองซ้ำเมื่อยังไม่ได้ภาพลายเซ็น — ไม่เขียน DB จนกว่าจะได้ค่าครบ
   */
  async fetchSignatureByPerson(
    psnId: string,
    options: { retries?: number } = {},
  ): Promise<ESignSignaturePayload> {
    const maxAttempts = Math.max(1, options.retries ?? 3);
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response =
          await this.platformGatewayService.getSignatureImageByPerson({
            psn_id: psnId,
          });

        const result = response?.result;
        const signatureBase64 = result?.SIGN_BASE64?.trim();
        if (!signatureBase64) {
          throw new ServiceUnavailableException(
            `E-sign signature image not found for person ${psnId}`,
          );
        }

        const rawBase64 = signatureBase64.includes(',')
          ? (signatureBase64.split(',')[1] ?? '')
          : signatureBase64;
        if (rawBase64.length < 16) {
          throw new ServiceUnavailableException(
            `E-sign signature image is invalid for person ${psnId}`,
          );
        }

        return {
          psnId: result?.PSN_ID?.trim() || psnId,
          fullName: result?.PSN_FULLNAME?.trim() || psnId,
          signatureBase64,
        };
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `fetchSignatureByPerson attempt ${attempt}/${maxAttempts} failed for ${psnId}`,
        );
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new ServiceUnavailableException(
          `E-sign signature image not found for person ${psnId}`,
        );
  }

  /**
   * บันทึก metadata ผู้รับเงินบนใบเสร็จ (ยังไม่อัปโหลดไฟล์)
   */
  async applyCollectorMetadata(
    manager: EntityManager,
    receiptIds: number[],
    signature: ESignSignaturePayload,
  ): Promise<void> {
    if (receiptIds.length === 0) return;

    await manager.getRepository(Receipt).update(
      { RC_ID: In(receiptIds) },
      {
        RC_ISSUED_BY_PSN_ID: signature.psnId,
        RC_COLLECTOR_NAME: signature.fullName,
      },
    );
  }

  /**
   * โหลดข้อมูลใบเสร็จที่ออกเลขแล้ว เพื่อให้ฝั่งเว็บแปะลายเซ็นในช่อง «ภาพลายมือชื่อ»
   * ก่อนอัปโหลดไฟล์
   */
  async loadSignedReceiptDrafts(
    manager: EntityManager,
    receiptIds: number[],
  ): Promise<SignedReceiptDraft[]> {
    if (receiptIds.length === 0) return [];

    const receipts = await manager.getRepository(Receipt).find({
      where: { RC_ID: In(receiptIds) },
      relations: [
        'TRANSACTION',
        'TRANSACTION.ENROLLMENT',
        'TRANSACTION.ENROLLMENT.SESSION',
        'TRANSACTION.ENROLLMENT.SESSION.EXAM',
      ],
      order: { RC_ID: 'ASC' },
    });

    return receipts.map((receipt) => {
      if (!receipt.RC_NO) {
        throw new BadRequestException(
          `Receipt ${receipt.RC_ID} has no RC_NO; cannot prepare signed receipt`,
        );
      }
      if (!receipt.RC_VERIFY_CODE) {
        throw new BadRequestException(
          `Receipt ${receipt.RC_ID} has no verify code`,
        );
      }

      const transaction = receipt.TRANSACTION;
      const exam = transaction?.ENROLLMENT?.SESSION?.EXAM;
      const referenceDate =
        receipt.RC_ISSUED_AT ??
        transaction?.TRANX_PAID_AT ??
        receipt.CREATED_AT;
      const amountNumber = Number(transaction?.TRANX_AMOUNT ?? 0);

      return {
        rcId: receipt.RC_ID,
        tranxId: receipt.TRANX_ID,
        receiptNo: buildReceiptNo(
          receipt.RC_NO,
          receipt.RC_ID,
          referenceDate,
          receipt.CREATED_AT,
        ),
        issuedAt:
          referenceDate instanceof Date
            ? referenceDate.toISOString()
            : referenceDate
              ? String(referenceDate)
              : new Date().toISOString(),
        payerName: receipt.RC_NAME?.trim() || '-',
        taxId: receipt.RC_TAX_ID != null ? String(receipt.RC_TAX_ID) : null,
        address: receipt.RC_ADDRESS?.trim() || null,
        amount: Number.isFinite(amountNumber) ? amountNumber : 0,
        description: buildReceiptItemDescription(
          exam?.EXAM_ROUND,
          exam?.EXAM_FISCAL_YEAR,
        ),
        examDate: exam?.EXAM_DATE ?? null,
        verifyCode: receipt.RC_VERIFY_CODE,
        paymentChannel: transaction?.TRANX_CHANNEL ?? null,
      };
    });
  }

  /**
   * สร้าง PDF ใบเสร็จ (ฝังลายเซ็น) แล้วอัปโหลด MinIO → เซ็ต RC_FILE_PATH
   * ข้ามใบที่มี RC_FILE_PATH แล้ว (idempotent)
   * ใช้ EntityManager ของ transaction เดียวกันเพื่อเห็น RC_NO ที่เพิ่ง assign
   */
  async generateAndUploadReceiptFiles(
    manager: EntityManager,
    receiptIds: number[],
    signature: ESignSignaturePayload,
  ): Promise<void> {
    if (receiptIds.length === 0) return;

    const receipts = await manager.getRepository(Receipt).find({
      where: { RC_ID: In(receiptIds) },
      relations: [
        'TRANSACTION',
        'TRANSACTION.ENROLLMENT',
        'TRANSACTION.ENROLLMENT.SESSION',
        'TRANSACTION.ENROLLMENT.SESSION.EXAM',
      ],
      order: { RC_ID: 'ASC' },
    });

    const folder = resolveImageFolder('receipt-file');

    for (const receipt of receipts) {
      if (receipt.RC_FILE_PATH?.startsWith('/')) {
        continue;
      }

      if (!receipt.RC_NO) {
        throw new BadRequestException(
          `Receipt ${receipt.RC_ID} has no RC_NO; cannot generate receipt file`,
        );
      }

      const transaction = receipt.TRANSACTION;
      const exam = transaction?.ENROLLMENT?.SESSION?.EXAM;
      const referenceDate =
        receipt.RC_ISSUED_AT ??
        transaction?.TRANX_PAID_AT ??
        receipt.CREATED_AT;
      const receiptNo = buildReceiptNo(
        receipt.RC_NO,
        receipt.RC_ID,
        referenceDate,
        receipt.CREATED_AT,
      );
      const description = buildReceiptItemDescription(
        exam?.EXAM_ROUND,
        exam?.EXAM_FISCAL_YEAR,
      );
      const amountNumber = Number(transaction?.TRANX_AMOUNT ?? 0);
      const amount = Number.isFinite(amountNumber)
        ? amountNumber.toFixed(2)
        : '0.00';
      const issuedAt =
        referenceDate instanceof Date
          ? referenceDate.toISOString()
          : referenceDate
            ? String(referenceDate)
            : '-';

      const pdfBuffer = await buildReceiptPdfWithSignature({
        organizationNameTh: BUU_ORGANIZATION.nameTH,
        organizationNameEn: BUU_ORGANIZATION.nameEN,
        receiptNo,
        issuedAt,
        payerName: receipt.RC_NAME?.trim() || '-',
        taxId: receipt.RC_TAX_ID != null ? String(receipt.RC_TAX_ID) : null,
        amount,
        description,
        examRound: exam?.EXAM_ROUND ?? null,
        examDate: exam?.EXAM_DATE ?? null,
        verifyCode: receipt.RC_VERIFY_CODE,
        collectorName: signature.fullName,
        signatureBase64: signature.signatureBase64,
      });

      const fileName = `${receipt.RC_NO}.pdf`;
      const uploadResult = (await this.platformGatewayService.uploadBuffer(
        pdfBuffer,
        fileName,
        {
          path: folder,
          fileName,
          forceFileName: true,
          bucket: 'buu-get.storage',
        },
      )) as { result?: string; filename?: string; path?: string } | undefined;

      const filePath =
        uploadResult?.result || uploadResult?.filename || uploadResult?.path;
      if (typeof filePath !== 'string' || !filePath) {
        this.logger.error(
          `uploadBuffer returned no path for receipt ${receipt.RC_ID}`,
        );
        throw new ServiceUnavailableException(
          `Failed to upload receipt file for ${receipt.RC_NO}`,
        );
      }

      const normalizedPath = filePath.startsWith('/')
        ? filePath
        : `/${filePath.replace(/^\/+/, '')}`;

      await manager
        .getRepository(Receipt)
        .update({ RC_ID: receipt.RC_ID }, { RC_FILE_PATH: normalizedPath });
    }
  }
}
