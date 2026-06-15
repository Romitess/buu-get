import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ProfileEditHistoryService } from './profile-edit-history.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('profile-edit-history')
@Controller('profile-edit-history')
export class ProfileEditHistoryController {
  constructor(private readonly historyService: ProfileEditHistoryService) {}

  @Get('profile/:userProfileId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findByProfileId(
    @Param('userProfileId', ParseIntPipe) userProfileId: number,
  ) {
    return await this.historyService.findByUserProfileId(userProfileId);
  }
}
