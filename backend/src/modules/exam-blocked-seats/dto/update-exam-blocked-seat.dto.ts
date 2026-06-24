import { PartialType } from '@nestjs/swagger';
import { CreateExamBlockedSeatDto } from './create-exam-blocked-seat.dto';

export class UpdateExamBlockedSeatDto extends PartialType(
  CreateExamBlockedSeatDto,
) {}
