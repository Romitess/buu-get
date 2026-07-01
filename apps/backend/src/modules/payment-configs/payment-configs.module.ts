import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentConfigsService } from './payment-configs.service';
import { PaymentConfigsController } from './payment-configs.controller';
import { PaymentConfig } from './entities/payment-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentConfig])],
  controllers: [PaymentConfigsController],
  providers: [PaymentConfigsService],
  exports: [PaymentConfigsService],
})
export class PaymentConfigsModule {}
