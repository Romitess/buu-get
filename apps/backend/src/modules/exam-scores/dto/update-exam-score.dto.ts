import { PartialType } from '@nestjs/swagger';
import { CreateExamScoreDto } from './create-exam-score.dto';

export class UpdateExamScoreDto extends PartialType(CreateExamScoreDto) {}
