import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamCertificatesService } from './exam-certificates.service';
import { ExamCertificatesController } from './exam-certificates.controller';
import { ExamCertificate } from './entities/exam-certificate.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamCertificate])],
  controllers: [ExamCertificatesController],
  providers: [ExamCertificatesService],
})
export class ExamCertificatesModule {}
