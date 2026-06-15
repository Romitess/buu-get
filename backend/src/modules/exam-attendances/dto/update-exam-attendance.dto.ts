import { PartialType } from '@nestjs/swagger';
import { CreateExamAttendanceDto } from './create-exam-attendance.dto';

export class UpdateExamAttendanceDto extends PartialType(
  CreateExamAttendanceDto,
) {}
