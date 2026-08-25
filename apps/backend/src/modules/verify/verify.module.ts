import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ExamCertificate } from '../exam-certificates/entities/exam-certificate.entity';
import { Receipt } from '../receipts/entities/receipt.entity';
import { ScoreCriteriaModule } from '../score-criteria/score-criteria.module';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExamCertificate, Receipt]),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 30 }]),
    ScoreCriteriaModule,
  ],
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class VerifyModule {}
