import { PartialType } from '@nestjs/swagger';
import { CreateExamVoucherDto } from './create-exam-voucher.dto';

export class UpdateExamVoucherDto extends PartialType(CreateExamVoucherDto) {}
