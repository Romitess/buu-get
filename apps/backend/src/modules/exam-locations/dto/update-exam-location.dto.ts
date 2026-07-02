import { PartialType } from '@nestjs/swagger';
import { CreateExamLocationDto } from './create-exam-location.dto';

export class UpdateExamLocationDto extends PartialType(CreateExamLocationDto) {}
