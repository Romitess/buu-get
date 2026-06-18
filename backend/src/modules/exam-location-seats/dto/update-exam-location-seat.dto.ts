import { PartialType } from '@nestjs/swagger';
import { CreateExamLocationSeatDto } from './create-exam-location-seat.dto';

export class UpdateExamLocationSeatDto extends PartialType(
  CreateExamLocationSeatDto,
) {}
