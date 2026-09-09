import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  AUDIT_ACTION_VALUES,
  AuditActionValue,
} from '../constants/audit-actions';
import { AuditLogStatus } from '../entities/audit-log.entity';

export class AuditLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'ช่วงเวลาเริ่มต้น (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'ช่วงเวลาสิ้นสุด (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ description: 'USER_ID ผู้กระทำ' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  actorUserId?: number;

  @ApiPropertyOptional({ enum: AUDIT_ACTION_VALUES })
  @IsOptional()
  @IsString()
  @IsIn(AUDIT_ACTION_VALUES)
  action?: AuditActionValue;

  @ApiPropertyOptional({ description: 'โมดูลที่ emit' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  module?: string;

  @ApiPropertyOptional({ enum: AuditLogStatus })
  @IsOptional()
  @IsEnum(AuditLogStatus)
  status?: AuditLogStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  resourceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  resourceId?: string;
}

export class AuditLogResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true, type: Number })
  actorUserId: number | null;

  @ApiProperty({ nullable: true, type: Object })
  actorSnapshot: Record<string, unknown> | null;

  @ApiProperty()
  action: string;

  @ApiProperty()
  module: string;

  @ApiProperty({ nullable: true, type: String })
  resourceType: string | null;

  @ApiProperty({ nullable: true, type: String })
  resourceId: string | null;

  @ApiProperty({ enum: AuditLogStatus })
  status: AuditLogStatus;

  @ApiProperty({ nullable: true, type: String })
  statusDetail: string | null;

  @ApiProperty({ nullable: true, type: Object })
  beforeState: Record<string, unknown> | null;

  @ApiProperty({ nullable: true, type: Object })
  afterState: Record<string, unknown> | null;

  @ApiProperty({ nullable: true, type: String })
  ipAddress: string | null;

  @ApiProperty({ nullable: true, type: String })
  userAgent: string | null;

  @ApiProperty({ nullable: true, type: String })
  correlationId: string | null;

  @ApiProperty()
  createdAt: Date;
}
