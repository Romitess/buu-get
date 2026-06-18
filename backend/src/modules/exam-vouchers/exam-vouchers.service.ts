import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ExamVoucher } from './entities/exam-voucher.entity';
import { CreateExamVoucherDto } from './dto/create-exam-voucher.dto';
import { UpdateExamVoucherDto } from './dto/update-exam-voucher.dto';
import { SendVoucherTicketDto } from './dto/send-voucher-ticket.dto';
import { BulkIssueVouchersDto } from './dto/bulk-issue-vouchers.dto';
import { PlatformGatewayService } from '../platform-gateway/platform-gateway.service';
import {
  ExamEnrollment,
  ExamEnrollmentStatus,
} from '../exam-enrollments/entities/exam-enrollment.entity';

@Injectable()
export class ExamVouchersService {
  constructor(
    @InjectRepository(ExamVoucher)
    private readonly examVoucherRepository: Repository<ExamVoucher>,
    @InjectRepository(ExamEnrollment)
    private readonly examEnrollmentRepository: Repository<ExamEnrollment>,
    private readonly platformGatewayService: PlatformGatewayService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createExamVoucherDto: CreateExamVoucherDto,
  ): Promise<ExamVoucher> {
    const voucher = this.examVoucherRepository.create(createExamVoucherDto);
    return await this.examVoucherRepository.save(voucher);
  }

  async createFromEnrollment(ERM_ID: number): Promise<ExamVoucher> {
    return await this.dataSource.transaction(async (manager) => {
      const enrollment = await manager.getRepository(ExamEnrollment).findOne({
        where: { ERM_ID },
        relations: ['SESSION', 'SESSION.EXAM', 'USER', 'USER.PROFILE'],
      });

      if (!enrollment) {
        throw new NotFoundException(
          `Exam Enrollment with ID ${ERM_ID} not found`,
        );
      }

      if (!enrollment.ERM_TEST_TAKER) {
        throw new BadRequestException(
          `Test taker ID is missing for enrollment ${enrollment.ERM_ID}`,
        );
      }

      if (enrollment.ERM_STATUS === ExamEnrollmentStatus.SEAT_ASSIGNED) {
        enrollment.ERM_STATUS = ExamEnrollmentStatus.SEAT_PUBLISHED;
        await manager.getRepository(ExamEnrollment).save(enrollment);
      }

      const voucherRepository = manager.getRepository(ExamVoucher);
      const existingVoucher = await voucherRepository.findOne({
        where: { ERM_ID },
      });

      if (existingVoucher) {
        return existingVoucher;
      }

      const voucher = voucherRepository.create({
        ERM_ID,
        VC_CODE: this.generateVoucherCode(ERM_ID),
      });

      return await voucherRepository.save(voucher);
    });
  }

  async findAll(): Promise<ExamVoucher[]> {
    return await this.examVoucherRepository.find({
      relations: ['ENROLLMENT'],
    });
  }

  async findOne(id: number): Promise<ExamVoucher> {
    const voucher = await this.examVoucherRepository.findOne({
      where: { VC_ID: id },
      relations: ['ENROLLMENT'],
    });

    if (!voucher) {
      throw new NotFoundException(`Exam Voucher with ID ${id} not found`);
    }

    return voucher;
  }

  async update(
    id: number,
    updateExamVoucherDto: UpdateExamVoucherDto,
  ): Promise<ExamVoucher> {
    const voucher = await this.findOne(id);
    const updated = this.examVoucherRepository.merge(
      voucher,
      updateExamVoucherDto,
    );
    return await this.examVoucherRepository.save(updated);
  }

  async remove(id: number): Promise<void> {
    const voucher = await this.findOne(id);
    await this.examVoucherRepository.softRemove(voucher);
  }

  sendVoucherEmail(dto: SendVoucherTicketDto): Promise<{ success: boolean }> {
    const subject = `แจ้งเตือนการพิมพ์บัตรประจำตัวผู้เข้าสอบ - ${dto.examName}`;
    const htmlContent = `
        <div style="font-family: 'Sarabun', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #1e3a8a; text-align: center;">ระบบแจ้งเตือน BUU-GET</h2>
          <p>เรียน คุณ <strong>${dto.fullName}</strong>,</p>
          <p>ระบบได้เปิดให้ท่านสามารถพิมพ์บัตรประจำตัวผู้เข้าสอบ สำหรับรอบสอบ <strong>${dto.examName}</strong> ได้แล้ว</p>
          <p style="color: #ef4444; font-weight: bold;">ท่านสามารถพิมพ์บัตรเข้าห้องสอบ ได้ที่ลิงก์ด้านล่างนี้:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${dto.historyUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
              พิมพ์บัตรเข้าห้องสอบ
            </a>
          </p>
          <p style="word-break: break-all; color: #666; font-size: 14px;">หรือคัดลอกลิงก์นี้ไปวางบนเบราว์เซอร์: <br/> ${dto.historyUrl}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666; text-align: center;">นี่คืออีเมลอัตโนมัติจากระบบ BUU-GET กรุณาอย่าตอบกลับอีเมลนี้</p>
        </div>
      `;

    this.platformGatewayService
      .sendEmail('BUU-GET', dto.email, subject, htmlContent)
      .then(() => {
        console.log(
          '[MailService] Voucher Email sent successfully via BUU Gateway!',
        );
      })
      .catch((err) => {
        console.error(
          '[MailService] Error sending voucher email via BUU Gateway:',
          err,
        );
      });

    return Promise.resolve({ success: true });
  }

  async bulkIssueVouchers(
    dto: BulkIssueVouchersDto,
  ): Promise<{ success: boolean }> {
    const { ermIds, examName, historyUrl } = dto;
    if (!ermIds || ermIds.length === 0) {
      return { success: true };
    }

    const enrollments = await this.dataSource.transaction(async (manager) => {
      const enrollmentRepository = manager.getRepository(ExamEnrollment);
      const voucherRepository = manager.getRepository(ExamVoucher);
      const selectedEnrollments = await enrollmentRepository.find({
        where: { ERM_ID: In(ermIds) },
        relations: ['SESSION', 'SESSION.EXAM', 'USER', 'USER.PROFILE'],
      });

      if (selectedEnrollments.length === 0) {
        return [];
      }

      const enrollmentWithoutTestTakerId = selectedEnrollments.find(
        (enrollment) => !enrollment.ERM_TEST_TAKER,
      );
      if (enrollmentWithoutTestTakerId) {
        throw new BadRequestException(
          `Test taker ID is missing for enrollment ${enrollmentWithoutTestTakerId.ERM_ID}`,
        );
      }

      const enrollmentsToUpdate = selectedEnrollments.filter(
        (enrollment) =>
          enrollment.ERM_STATUS === ExamEnrollmentStatus.SEAT_ASSIGNED,
      );

      if (enrollmentsToUpdate.length > 0) {
        for (const enrollment of enrollmentsToUpdate) {
          enrollment.ERM_STATUS = ExamEnrollmentStatus.SEAT_PUBLISHED;
        }
        await enrollmentRepository.save(enrollmentsToUpdate);
      }

      const existingVouchers = await voucherRepository.find({
        where: { ERM_ID: In(ermIds) },
      });
      const existingErmIds = new Set(
        existingVouchers.map((voucher) => voucher.ERM_ID),
      );

      const vouchersToCreate = selectedEnrollments
        .filter((enrollment) => !existingErmIds.has(enrollment.ERM_ID))
        .map((enrollment) =>
          voucherRepository.create({
            ERM_ID: enrollment.ERM_ID,
            VC_CODE: this.generateVoucherCode(enrollment.ERM_ID),
          }),
        );

      if (vouchersToCreate.length > 0) {
        await voucherRepository.save(vouchersToCreate);
      }

      return selectedEnrollments;
    });

    if (enrollments.length === 0) {
      return { success: true };
    }

    this.sendVoucherEmailsInBatch(enrollments, examName, historyUrl).catch(
      (err) => {
        console.error(
          '[BulkMail] Unhandled error during bulk email dispatch:',
          err,
        );
      },
    );

    return { success: true };
  }

  private generateVoucherCode(ermId: number): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `VC-${year}-${ermId}-${random}`;
  }

  private async sendVoucherEmailsInBatch(
    enrollments: ExamEnrollment[],
    examName: string,
    historyUrl: string,
  ): Promise<void> {
    const limit = 10;
    const items = [...enrollments];

    const worker = async () => {
      while (items.length > 0) {
        const enrollment = items.shift();
        if (!enrollment) continue;

        const email = enrollment.USER?.USER_EMAIL;
        if (!email) continue;

        const prefix = enrollment.USER?.PROFILE?.userTitleTh || '';
        const fullname = enrollment.USER?.PROFILE?.userFullnameTh || '';
        const fullName = `${prefix} ${fullname}`.trim() || 'ผู้สมัครสอบ';

        const subject = `แจ้งเตือนการพิมพ์บัตรประจำตัวผู้เข้าสอบ - ${examName}`;
        const htmlContent = `
          <div style="font-family: 'Sarabun', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #1e3a8a; text-align: center;">ระบบแจ้งเตือน BUU-GET</h2>
            <p>เรียน คุณ <strong>${fullName}</strong>,</p>
            <p>ระบบได้เปิดให้ท่านสามารถพิมพ์บัตรประจำตัวผู้เข้าสอบ สำหรับรอบสอบ <strong>${examName}</strong> ได้แล้ว</p>
            <p style="color: #ef4444; font-weight: bold;">ท่านสามารถพิมพ์บัตรเข้าห้องสอบ ได้ที่ลิงก์ด้านล่างนี้:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${historyUrl}" style="background-color: #1e3a8a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                พิมพ์บัตรเข้าห้องสอบ
              </a>
            </p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">หรือคัดลอกลิงก์นี้ไปวางบนเบราว์เซอร์: <br/> ${historyUrl}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666; text-align: center;">นี่คืออีเมลอัตโนมัติจากระบบ BUU-GET กรุณาอย่าตอบกลับอีเมลนี้</p>
          </div>
        `;

        try {
          await this.platformGatewayService.sendEmail(
            'BUU-GET',
            email,
            subject,
            htmlContent,
          );
        } catch (error) {
          console.error(`[BulkMail] Failed to send email to ${email}:`, error);
        }
      }
    };

    const workers = Array.from(
      { length: Math.min(limit, enrollments.length) },
      () => worker(),
    );
    await Promise.all(workers);
    console.log(
      `[BulkMail] Finished processing all ${enrollments.length} bulk emails.`,
    );
  }
}
