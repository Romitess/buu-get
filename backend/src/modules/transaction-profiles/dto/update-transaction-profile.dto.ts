import { PartialType } from '@nestjs/swagger';
import { CreateTransactionProfileDto } from './create-transaction-profile.dto';

export class UpdateTransactionProfileDto extends PartialType(
  CreateTransactionProfileDto,
) {}
