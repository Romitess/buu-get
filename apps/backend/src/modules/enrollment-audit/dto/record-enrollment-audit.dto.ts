import {
  EnrollmentAuditActorType,
  EnrollmentAuditCategory,
  EnrollmentAuditEventType,
} from '../entities/exam-enrollment-audit-log.entity';

export interface RecordEnrollmentAuditInput {
  ermId: number;
  userId: number;
  examId?: number | null;
  sessionId?: number | null;
  eventType: EnrollmentAuditEventType | string;
  category: EnrollmentAuditCategory | string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorType: EnrollmentAuditActorType | string;
  actorUserId?: number | null;
  actorName?: string | null;
  message?: string | null;
  payload?: Record<string, unknown> | null;
  refType?: string | null;
  refId?: number | null;
}
