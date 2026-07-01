import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionProfilesService } from './transaction-profiles.service';
import { TransactionProfilesController } from './transaction-profiles.controller';
import { TransactionProfile } from './entities/transaction-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionProfile])],
  controllers: [TransactionProfilesController],
  providers: [TransactionProfilesService],
  exports: [TransactionProfilesService],
})
export class TransactionProfilesModule {}
