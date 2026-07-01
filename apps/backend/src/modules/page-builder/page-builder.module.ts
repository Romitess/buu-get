import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PageConfig } from './entities/page-config.entity';
import { PageConfigsService } from './page-configs.service';
import { PageConfigsController } from './page-configs.controller';
import { HomepageService } from './homepage.service';
import { HomepageController } from './homepage.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PageConfig])],
  controllers: [PageConfigsController, HomepageController],
  providers: [PageConfigsService, HomepageService],
  exports: [PageConfigsService, HomepageService],
})
export class PageBuilderModule {}
