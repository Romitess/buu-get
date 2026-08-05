# Test Rollout — Progress Tracker

> อัปเดตท้ายทุก batch เพื่อ resume ได้ข้ามเซสชัน

## Current phase

**Phase 5 — Batch 1 E2E Browser Rollout** → done  
**Batch 1 complete** (unit + integration + e2e P0–P1)  
**ถัดไป:** รอ confirm ก่อน Phase 2 ของ **Batch 2 — Money**

## Phase checklist

| Phase | Status | Notes |
|---|---|---|
| 0 Infrastructure | done | Playwright root, shared-DB seed-only, auth fixtures |
| 1 System Inventory | done | P0–P4 + 7 batches |
| 2 Test Case Matrix (per batch) | in progress | Batch 1 done; Batch 2+ pending |
| 3 Unit Test Rollout (per batch) | in progress | Batch 1 done (114 unit) |
| 4 Integration Test Rollout (per batch) | in progress | Batch 1 done (58 pass / 3 skip) |
| 5 E2E (P0–P1 flows) | done | Batch 1: 10 pass / 1 skip (BUG-004) |

## DB mode (Phase 0 adjust)

- ใช้ MySQL เดียวกับ local `.env` (shared-DB) — **ไม่บังคับ** `*_test`
- `npm run test:db:reset` = migrations + upsert RBAC test users (**ไม่ truncate**)
- Truncate ทั้ง schema เฉพาะเมื่อตั้ง `ALLOW_DB_TRUNCATE=1`

## System Inventory (Priority)

| Module/Service | ไฟล์หลัก | ทำไมสำคัญ (business impact) | Priority | มี unit spec? |
|---|---|---|---|---|
| auth | `apps/backend/src/modules/auth/auth.service.ts` | Login/JWT — ทางเข้าทั้งระบบ | P0 | ใช่ |
| users | `apps/backend/src/modules/users/users.service.ts` | บัญชีผู้ใช้ + สิทธิ์เข้าถึง | P0 | ใช่ |
| roles | `apps/backend/src/modules/roles/roles.service.ts` | RBAC 8 roles | P0 | ไม่ |
| transactions | `apps/backend/src/modules/transactions/transactions.service.ts` | รับชำระ / confirm payment | P0 | ใช่ |
| receipts | `apps/backend/src/modules/receipts/receipts.service.ts` | ใบเสร็จ — เอกสารการเงิน | P0 | ไม่ |
| voided-receipts | `apps/backend/src/modules/voided-receipts/voided-receipts.service.ts` | ยกเลิกใบเสร็จ | P0 | ไม่ |
| bank-reconciles | `apps/backend/src/modules/bank-reconciles/bank-reconciles.service.ts` | กระทบยอดธนาคาร | P0 | ใช่ |
| exam-enrollments | `apps/backend/src/modules/exam-enrollments/exam-enrollments.service.ts` | สมัครสอบ + check-in (รวม attendance) | P0 | ใช่ |
| exam | `apps/backend/src/modules/exam/exam.service.ts` | เปิด/ปิดรอบสอบ | P1 | ไม่ |
| exam-sessions | `apps/backend/src/modules/exam-sessions/exam-sessions.service.ts` | รอบสอบ | P1 | ไม่ |
| exam-locations | `apps/backend/src/modules/exam-locations/exam-locations.service.ts` | สถานที่สอบ | P1 | ไม่ |
| exam-session-locations | `apps/backend/src/modules/exam-session-locations/exam-session-locations.service.ts` | ผูกห้องกับรอบ | P1 | ไม่ |
| exam-location-seats | `apps/backend/src/modules/exam-location-seats/exam-location-seats.service.ts` | ที่นั่ง | P1 | ไม่ |
| exam-blocked-seats | `apps/backend/src/modules/exam-blocked-seats/exam-blocked-seats.service.ts` | บล็อกที่นั่ง | P1 | ไม่ |
| exam-vouchers | `apps/backend/src/modules/exam-vouchers/exam-vouchers.service.ts` | ส่วนลด/สิทธิ์ค่าสอบ | P1 | ใช่ |
| exam-rule-vouchers | `apps/backend/src/modules/exam-rule-vouchers/exam-rule-vouchers.service.ts` | กฎ voucher | P1 | ไม่ |
| payment-configs | `apps/backend/src/modules/payment-configs/payment-configs.service.ts` | ค่าธรรมเนียม | P1 | ไม่ |
| fund-sources | `apps/backend/src/modules/fund-sources/fund-sources.service.ts` | แหล่งทุน | P1 | ไม่ |
| exam-scores | `apps/backend/src/modules/exam-scores/exam-scores.service.ts` | คะแนนสอบ | P1 | ใช่ |
| score-criteria | `apps/backend/src/modules/score-criteria/score-criteria.service.ts` | เกณฑ์คะแนน | P1 | ไม่ |
| score-rubrics | `apps/backend/src/modules/score-rubrics/score-rubrics.service.ts` | รูบริก | P1 | ไม่ |
| exam-certificates | `apps/backend/src/modules/exam-certificates/exam-certificates.service.ts` | ออกใบรับรอง | P1 | ใช่ |
| verify | `apps/backend/src/modules/verify/verify.service.ts` | รหัสยืนยันเอกสาร | P1 | ใช่ |
| user-profile | `apps/backend/src/modules/user-profile/user-profile.service.ts` | โปรไฟล์ผู้สมัคร | P2 | ไม่ |
| user-image | `apps/backend/src/modules/user-image/user-image.service.ts` | รูปโปรไฟล์ | P2 | ไม่ |
| profile-edit-history | `apps/backend/src/modules/profile-edit-history/profile-edit-history.service.ts` | ประวัติแก้โปรไฟล์ | P2 | ไม่ |
| transaction-refs | `apps/backend/src/modules/transaction-refs/transaction-refs.service.ts` | อ้างอิงธุรกรรม | P2 | ไม่ |
| transaction-profiles | `apps/backend/src/modules/transaction-profiles/transaction-profiles.service.ts` | โปรไฟล์ธุรกรรม | P2 | ไม่ |
| transaction-status-history | `apps/backend/src/modules/transaction-status-history/transaction-status-history.service.ts` | ประวัติสถานะจ่าย | P2 | ไม่ |
| exam-report | `apps/backend/src/modules/exam-report/exam-report.service.ts` | รายงานสรุป | P2 | util มี |
| thaid | `apps/backend/src/modules/thaid/thaid.service.ts` | Login ThaiD | P2 | ใช่ |
| platform-gateway | `apps/backend/src/modules/platform-gateway/platform-gateway.service.ts` | Kong/email/file | P2 | ใช่ |
| moodle | `apps/backend/src/modules/moodle/moodle-sync.service.ts` | Sync Moodle | P3 | ไม่ |
| moodle-sync-logs | `apps/backend/src/modules/moodle-sync-logs/moodle-sync-logs.service.ts` | Log sync | P3 | ไม่ |
| page-builder | `apps/backend/src/modules/page-builder/` | CMS หน้าเว็บ | P3 | ไม่ |
| common utils / guards | `apps/backend/src/common/` | เสริม | P4 | บางส่วน |

## Batches (proposed order)

| Batch | Modules | Priority | Matrix | Unit | Integration | E2E |
|---|---|---|---|---|---|---|
| **1 — Auth & Access** | auth, users, roles, verify | P0–P1 | **done** (U99/I61/E13) | **done** (114 tests pass) | **done** (58 pass / 3 skip) | **done** (10 pass / 1 skip BUG-004) |
| **2 — Money** | transactions, receipts, voided-receipts, bank-reconciles, payment-configs | P0–P1 | pending | pending | pending | pending |
| **3 — Enrollment & Voucher** | exam-enrollments, exam-vouchers, exam-rule-vouchers, fund-sources | P0–P1 | pending | pending | pending | pending |
| **4 — Exam lifecycle** | exam, exam-sessions, exam-locations, exam-session-locations, exam-location-seats, exam-blocked-seats | P1 | pending | pending | pending | pending |
| **5 — Scores & Certificates** | exam-scores, score-criteria, score-rubrics, exam-certificates | P1 | pending | pending | pending | pending |
| **6 — Profile & identity** | user-profile, user-image, profile-edit-history, thaid | P2 | pending | pending | pending | pending |
| **7 — Reporting & integrations** | exam-report, transaction-refs, transaction-profiles, transaction-status-history, platform-gateway, moodle, moodle-sync-logs, page-builder | P2–P3 | pending | pending | pending | pending |

P4 (utils/guards) ไม่เปิด batch แยกในรอบแรก — เติมคู่กับ module ที่เกี่ยวข้อง

**Next gate:** confirm เริ่ม **Batch 2 — Money** Phase 2 (test-case-analyst: transactions, receipts, voided-receipts, bank-reconciles, payment-configs)

### Batch 1 E2E Rollout evidence (Phase 5)

| Case | Result |
|---|---|
| AUTH-E-001 login smoke | pass |
| AUTH-E-002 candidate → exam-schedule | pass |
| AUTH-E-003 admin/staff → exam-management | pass |
| AUTH-E-004 finance → payment-import | pass |
| AUTH-E-005 failed login | pass |
| AUTH-E-006 logged-in /login redirect | pass |
| ROLES-E-002 candidate blocked from admin | pass |
| VERIFY-E-001 public certificate | **skip** (BUG-004) |
| VERIFY-E-002 public receipt | pass |

POMs: `tests/e2e/pages/login.page.ts`, `verify-certificate.page.ts`, `verify-receipt.page.ts`  
Specs: `auth.e2e.spec.ts`, `roles-access.e2e.spec.ts`, `verify.e2e.spec.ts`  
Headed + headless: **10 passed, 1 skipped**

### E2E backlog (Batch 1, not in first pass)

| ID | Priority | Reason |
|---|---|---|
| USERS-E-001 | P3 | n/a — no admin users CRUD UI |
| ROLES-E-001 | P2 | ROLE_LABELS display |
| VERIFY-E-003 | P2 | bad code not-found UI |
| VERIFY-E-004 | P3 | short QR link `v/c/:code` |

### Batch 1 Unit Rollout evidence (Phase 3)

| Module | Spec files | Result |
|---|---|---|
| auth | `auth.service.spec.ts`, `jwt.strategy.spec.ts` | PASS (32) |
| users | `users.service.spec.ts` | PASS (27) |
| roles | `roles.service.spec.ts`, `create-role.dto.spec.ts`, `roles.guard.spec.ts` | PASS (21) |
| verify | `verify.service.spec.ts` | PASS (34) |
| **Batch 1 combined** | 7 suites | **114 passed** |

Command: `npx jest --testPathPattern='roles\.(service|guard)|create-role|verify\.service|auth\.service|jwt\.strategy|users\.service' --no-coverage`  
Bugs found in production during Phase 3: **none**

### Batch 1 Integration Rollout evidence (Phase 4)

| Module | Spec file | Result |
|---|---|---|
| auth | `tests/integration/auth.api.spec.ts` | 17 pass / 1 skip (OTP one-time) |
| users | `tests/integration/users.api.spec.ts` | 21 pass |
| roles | `tests/integration/roles.api.spec.ts` | 13 pass / 1 skip (soft-delete N/A) |
| verify | `tests/integration/verify.api.spec.ts` | 7 pass / 1 skip (throttle) |
| **Batch 1 combined** | 4 files | **58 passed, 3 skipped** |

Command: `SKIP_TEST_DB_RESET=1 npx playwright test --project=integration`  
Bugs logged: BUG-001 (CERT_CODE case), BUG-002 (`/api/api/exam-certificates`), BUG-003 (roles GET missing → 200 empty) — see [BUG_LOG.md](./BUG_LOG.md)

## Bug Log

ดู [BUG_LOG.md](./BUG_LOG.md)

## Master Test Plan

ดู [MASTER_TEST_PLAN.md](./MASTER_TEST_PLAN.md)

---

## TODO — Azure DevOps pipeline (ยังไม่ execute)

เสียบหลัง build ใน ADO pipeline (mirror ของ GitHub Actions ที่มีอยู่):

1. **Unit** — `npm run test:unit` (ไม่ต้องการ MySQL)
2. **Integration** — ใช้ MySQL (shared หรือ dedicated) + `.env.test` จาก variable group → `npm run test:db:reset` (seed-only) → start backend → `npm run test:integration`
3. **E2E** — start backend + frontend → `npm run test:e2e` (CI = headless + trace on failure)
4. **Secrets** — JWT_SECRET, DB_PASSWORD ใน variable group แยกจาก prod
5. **Artifacts** — publish Playwright HTML report + trace zip เมื่อ fail
6. **Truncate** — อย่าตั้ง `ALLOW_DB_TRUNCATE=1` บน shared/prod DB; ใช้เฉพาะ disposable schema

Repo ปัจจุบันมี GitHub Actions ที่ [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — ยังไม่ใส่ Playwright ใน CI (เฉพาะ `test:e2e:nest`)
