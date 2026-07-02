import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamCertificatesService } from './exam-certificates.service';
import { ExamCertificatesController } from './exam-certificates.controller';
import { ExamCertificate } from './entities/exam-certificate.entity';
import { ExamScore } from '../exam-scores/entities/exam-score.entity';
import { ExamSession } from '../exam-sessions/entities/exam-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamCertificate, ExamScore, ExamSession]),
  ],
  controllers: [ExamCertificatesController],
  providers: [ExamCertificatesService],
})
export class ExamCertificatesModule {}
