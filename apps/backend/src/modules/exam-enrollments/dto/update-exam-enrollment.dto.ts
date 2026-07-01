import { PartialType } from '@nestjs/swagger';
import { CreateExamEnrollmentDto } from './create-exam-enrollment.dto';

export class UpdateExamEnrollmentDto extends PartialType(
  CreateExamEnrollmentDto,
) {}
