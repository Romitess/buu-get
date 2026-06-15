import { PartialType } from '@nestjs/swagger';
import { CreateExamSessionLocationDto } from './create-exam-session-location.dto';

export class UpdateExamSessionLocationDto extends PartialType(
  CreateExamSessionLocationDto,
) {}
