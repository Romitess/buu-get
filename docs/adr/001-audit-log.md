# ADR 001 — Platform Audit Log

## Status

Accepted (2026-09-09)

## Context

BUU GET already has domain-specific history tables (enrollment audit, profile edit history, transaction status history, system-setting audit, Moodle sync logs). Those remain the source of truth for **domain timelines**. This ADR adds a complementary **platform audit trail** that answers, for a user action: who, what, when, on which resource, and whether it succeeded — in a queryable, append-only, PDPA-aware way.

## Decision

### Action taxonomy

Actions are a closed `AuditAction` const (`AUTH.LOGIN`, `USER.ROLE.UPDATE`, …). The interceptor and `record()` accept only those values. New events require a taxonomy addition — no free-string actions.

This pass **ships the full taxonomy** and **wires**:

- `AUTH.LOGIN` via `@Audit()` on `POST /auth/login` (success and failed login)
- `AUDIT.EXPORT` via `AuditLogsService.recordAsync` on `GET /audit-logs/export`

### Sync vs async

| Mode | When | How |
|---|---|---|
| **Async (default)** | High-volume or lower-stakes HTTP events (login, later AUTH/PROFILE reads-adjacent writes) | Interceptor `recordAsync` — fire-and-forget; a failed audit write never fails the business request |
| **Sync (in-transaction)** | Losing the log is unacceptable: `USER.ROLE.UPDATE`, `USER.DELETE`, `SCORE.UPDATE`, `CERTIFICATE.ISSUE`, `RECEIPT.VOID`, `SETTINGS.UPDATE`, `PAYMENT.RECONCILE` | `await record(input, manager)` inside the existing TypeORM transaction. Do **not** also put `@Audit()` on that handler (double-write) |

This pass uses async only.

### Capture

- Global `AuditInterceptor` writes **only** when `@Audit()` metadata is present (opt-in).
- Snapshots are **allowlist-by-default** (`bodyKeys` / `resultKeys`). A central denylist then strips secrets (passwords, tokens, national ID, passport, payment/QR payloads) even if a developer allowlists them. Size cap ~8 KiB.
- No BullMQ/Redis (not in stack). Async = `void promise` with logged errors, same posture as Moodle `writeLog`.

### Storage and immutability

Table `SYS_T_AUDIT_LOGS` is insert + select only. MySQL `BEFORE UPDATE` / `BEFORE DELETE` triggers reject mutation. There is no update/delete HTTP endpoint and no update/delete service method. No FK to users — `AL_ACTOR_SNAPSHOT` survives account deletion.

### Retention and PDPA

- **Retention:** 24 months hot in MySQL. Purpose = security / compliance / incident response.
- Logged personal data is limited to actor `userId`, `email`, `roles`. Failed logins may store the attempted email (security purpose). National ID, passport, passwords, tokens, and full payment details are denylisted.
- Access is `@Roles(RoleEnum.ADMIN)` (super_admin bypasses via existing `RolesGuard`). Export is itself audited (`AUDIT.EXPORT`).
- Viewing the paginated list is **not** meta-audited (volume / recursion).

### Complementarity

Do **not** replace or federate `EXAM_T_ENROLLMENT_AUDIT_LOGS`, profile-edit-history, transaction-status-history, or system-setting audit logs. Those stay domain timelines. Platform audit is a cross-cutting compliance trail.

## Out of scope (this pass)

- Wiring remaining taxonomy actions beyond `AUTH.LOGIN` and `AUDIT.EXPORT`
- MySQL RANGE partitioning (would require `CREATED_AT` in the PK)
- Cold-storage archival cron
- Read replica / dedicated reporting path
- Replacing the applicant-audit UI
- BullMQ / Redis queue
- Auditing GET/list/health traffic
- Logging `GET /auth/me`

## Consequences

- Login success/failure becomes visible in `/admin/audit-logs` after the migration runs.
- Migration requires `TRIGGER` privilege; failure is loud (do not skip immutability).
- Later high-stakes writes should use `record(..., manager)` per the sync matrix above.
