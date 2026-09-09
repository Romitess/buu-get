import { AuditActionValue } from '../constants/audit-actions';
import { AuditLogStatus } from '../entities/audit-log.entity';

export interface AuditActorSnapshot {
  userId?: number;
  email?: string;
  roles?: string[];
}

export interface RecordAuditInput {
  actorUserId?: number | null;
  actorSnapshot?: AuditActorSnapshot | null;
  action: AuditActionValue;
  module?: string;
  resourceType?: string | null;
  resourceId?: string | null;
  status: AuditLogStatus;
  statusDetail?: string | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}
