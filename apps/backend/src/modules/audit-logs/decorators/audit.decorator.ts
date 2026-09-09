import { SetMetadata } from '@nestjs/common';
import { AuditActionValue } from '../constants/audit-actions';
import { AUDIT_METADATA_KEY } from '../constants/audit.constants';

export interface AuditOptions {
  action: AuditActionValue;
  resourceType: string;
  /** Allowlisted body keys / dotted paths captured as before_state. Empty = no snapshot. */
  bodyKeys?: string[];
  /** Allowlisted result keys / dotted paths captured as after_state. Empty = no snapshot. */
  resultKeys?: string[];
  /** Request param name used as resource_id (e.g. 'id'). */
  resourceIdParam?: string;
  /** Dotted path on the handler result used as resource_id (e.g. 'user.id'). */
  resourceIdFrom?: string;
}

export const Audit = (options: AuditOptions): MethodDecorator =>
  SetMetadata(AUDIT_METADATA_KEY, options);
