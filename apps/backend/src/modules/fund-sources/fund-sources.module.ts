import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FundSourcesService } from './fund-sources.service';
import { FundSourcesController } from './fund-sources.controller';
import { FundSource } from './entities/fund-source.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FundSource])],
  controllers: [FundSourcesController],
  providers: [FundSourcesService],
  exports: [FundSourcesService],
})
export class FundSourcesModule {}
