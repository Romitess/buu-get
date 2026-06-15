import { PartialType } from '@nestjs/swagger';
import { CreateExamCertificateDto } from './create-exam-certificate.dto';

export class UpdateExamCertificateDto extends PartialType(
  CreateExamCertificateDto,
) {}
