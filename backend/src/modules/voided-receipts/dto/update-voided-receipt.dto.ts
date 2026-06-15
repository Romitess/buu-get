import { PartialType } from '@nestjs/swagger';
import { CreateVoidedReceiptDto } from './create-voided-receipt.dto';

export class UpdateVoidedReceiptDto extends PartialType(
  CreateVoidedReceiptDto,
) {}
