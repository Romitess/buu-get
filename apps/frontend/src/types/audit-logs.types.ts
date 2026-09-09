export type AuditLogStatus = 'SUCCESS' | 'FAILURE' | 'PARTIAL';

export interface AuditActorSnapshot {
  userId?: number;
  email?: string;
  roles?: string[];
}

export interface AuditLogListItem {
  id: number;
  actorUserId: number | null;
  actorSnapshot: AuditActorSnapshot | null;
  action: string;
  module: string;
  resourceType: string | null;
  resourceId: string | null;
  status: AuditLogStatus;
  statusDetail: string | null;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface AuditLogsListParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  actorUserId?: number;
  action?: string;
  module?: string;
  status?: AuditLogStatus;
  resourceType?: string;
  resourceId?: string;
}

export interface AuditLogsListResponse {
  data: AuditLogListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const AUDIT_ACTION_OPTIONS = [
  'AUTH.LOGIN',
  'AUTH.REGISTER',
  'AUTH.OTP.SEND',
  'AUTH.OTP.VERIFY',
  'USER.CREATE',
  'USER.ROLE.UPDATE',
  'USER.DELETE',
  'PROFILE.UPDATE',
  'ENROLLMENT.CREATE',
  'ENROLLMENT.STATUS.CHANGE',
  'ENROLLMENT.CANCEL',
  'PAYMENT.CREATE',
  'PAYMENT.STATUS.CHANGE',
  'PAYMENT.RECONCILE',
  'RECEIPT.ISSUE',
  'RECEIPT.VOID',
  'EXAM.CREATE',
  'EXAM.UPDATE',
  'SCORE.UPDATE',
  'CERTIFICATE.ISSUE',
  'CERTIFICATE.DOWNLOAD',
  'SETTINGS.UPDATE',
  'AUDIT.EXPORT',
] as const;

export const AUDIT_STATUS_OPTIONS: AuditLogStatus[] = [
  'SUCCESS',
  'FAILURE',
  'PARTIAL',
];
