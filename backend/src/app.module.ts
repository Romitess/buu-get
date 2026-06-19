import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { validateEnv } from './config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { UserProfileModule } from './modules/user-profile/user-profile.module';
import { ExamModule } from './modules/exam/exam.module';
import { ExamSessionsModule } from './modules/exam-sessions/exam-sessions.module';
import { ExamLocationsModule } from './modules/exam-locations/exam-locations.module';
import { ExamLocationSeatsModule } from './modules/exam-location-seats/exam-location-seats.module';
import { ExamSessionLocationsModule } from './modules/exam-session-locations/exam-session-locations.module';
import { ExamEnrollmentsModule } from './modules/exam-enrollments/exam-enrollments.module';
import { ExamVouchersModule } from './modules/exam-vouchers/exam-vouchers.module';
import { ExamAttendancesModule } from './modules/exam-attendances/exam-attendances.module';
import { TransactionRefsModule } from './modules/transaction-refs/transaction-refs.module';
import { FundSourcesModule } from './modules/fund-sources/fund-sources.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { BankReconcilesModule } from './modules/bank-reconciles/bank-reconciles.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { ExamScoresModule } from './modules/exam-scores/exam-scores.module';
import { ExamCertificatesModule } from './modules/exam-certificates/exam-certificates.module';
import { TransactionProfilesModule } from './modules/transaction-profiles/transaction-profiles.module';
import { PaymentConfigsModule } from './modules/payment-configs/payment-configs.module';
import { TransactionStatusHistoryModule } from './modules/transaction-status-history/transaction-status-history.module';
import { VoidedReceiptsModule } from './modules/voided-receipts/voided-receipts.module';
import { UserImageModule } from './modules/user-image/user-image.module';
import buuApiConfig from './config/buu-api-config';
import { PlatformGatewayModule } from './modules/platform-gateway/platform-gateway.module';
import { ProfileEditHistoryModule } from './modules/profile-edit-history/profile-edit-history.module';
import { PageBuilderModule } from './modules/page-builder/page-builder.module';
import { ExamRuleVouchersModule } from './modules/exam-rule-vouchers/exam-rule-vouchers.module';
import { ScoreCriteriaModule } from './modules/score-criteria/score-criteria.module';
import { MoodleSyncLogsModule } from './modules/moodle-sync-logs/moodle-sync-logs.module';
import { ExamReportModule } from './modules/exam-report/exam-report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [buuApiConfig],
      envFilePath: ['.env', 'backend/.env', '../.env'],
      isGlobal: true,
      validate: validateEnv,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions =>
        ({
          type: configService.getOrThrow<string>('DB_TYPE'),
          host: configService.getOrThrow<string>('DB_HOST'),
          port: configService.getOrThrow<number>('DB_PORT'),
          username: configService.getOrThrow<string>('DB_USER'),
          password: configService.getOrThrow<string>('DB_PASSWORD'),
          database: configService.getOrThrow<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: false,
          // dropSchema: false,
          migrationsRun: true,
          migrations: ['dist/database/migrations/*.js'],
        }) as TypeOrmModuleOptions,
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    UserProfileModule,
    ExamModule,
    ExamSessionsModule,
    ExamLocationsModule,
    ExamLocationSeatsModule,
    ExamSessionLocationsModule,
    ExamEnrollmentsModule,
    ExamVouchersModule,
    ExamAttendancesModule,
    TransactionRefsModule,
    FundSourcesModule,
    TransactionsModule,
    BankReconcilesModule,
    ReceiptsModule,
    ExamScoresModule,
    ExamCertificatesModule,
    TransactionProfilesModule,
    PaymentConfigsModule,
    TransactionStatusHistoryModule,
    VoidedReceiptsModule,
    UserImageModule,
    PlatformGatewayModule,
    ProfileEditHistoryModule,
    PageBuilderModule,
    ExamRuleVouchersModule,
    ScoreCriteriaModule,
    MoodleSyncLogsModule,
    ExamReportModule,
  ],
})
export class AppModule {}
