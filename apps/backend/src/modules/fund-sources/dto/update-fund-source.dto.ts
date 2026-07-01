import { PartialType } from '@nestjs/swagger';
import { CreateFundSourceDto } from './create-fund-source.dto';

export class UpdateFundSourceDto extends PartialType(CreateFundSourceDto) {}
