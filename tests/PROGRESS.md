# Test Rollout — Progress Tracker

> อัปเดตท้ายทุก batch เพื่อ resume ได้ข้ามเซสชัน

## Current phase

**Phase 5 — Batch 2 Money E2E Rollout** → done (15 pass / 1 skip BUG-005)  
**Batch 1 complete** · **Batch 2 complete** (matrix + unit + integration + e2e P0–P1)  
**ถัดไป:** รอ confirm ก่อน **Batch 3 Phase 2** (Enrollment & Voucher matrix)  
**Phase 6 (final):** Business Flow Test Report — pending (ทำหลัง batch หลัก)

## Phase checklist

| Phase | Status | Notes |
|---|---|---|
| 0 Infrastructure | done | Playwright root, shared-DB seed-only, auth fixtures |
| 1 System Inventory | done | P0–P4 + 7 batches |
| 2 Test Case Matrix (per batch) | in progress | Batch 1+2 done; Batch 3+ pending |
| 3 Unit Test Rollout (per batch) | in progress | Batch 1 done (114); Batch 2 done (141) |
| 4 Integration Test Rollout (per batch) | in progress | Batch 1 done (58/3 skip); Batch 2 done (65 pass / 1 skip BUG-005) |
| 5 E2E (P0–P1 flows) | in progress | Batch 1 done; Batch 2 done (15 pass / 1 skip BUG-005) |
| 6 Business Flow Test Report | pending | Final step after main batches — flow-centric report for stakeholders |

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
| **2 — Money** | transactions, receipts, voided-receipts, bank-reconciles, payment-configs | P0–P1 | **done** (U112/I66/E20) | **done** (141 tests pass) | **done** (65 pass / 1 skip BUG-005) | **done** (15 pass / 1 skip BUG-005) |
| **3 — Enrollment & Voucher** | exam-enrollments, exam-vouchers, exam-rule-vouchers, fund-sources | P0–P1 | pending | pending | pending | pending |
| **4 — Exam lifecycle** | exam, exam-sessions, exam-locations, exam-session-locations, exam-location-seats, exam-blocked-seats | P1 | pending | pending | pending | pending |
| **5 — Scores & Certificates** | exam-scores, score-criteria, score-rubrics, exam-certificates | P1 | pending | pending | pending | pending |
| **6 — Profile & identity** | user-profile, user-image, profile-edit-history, thaid | P2 | pending | pending | pending | pending |
| **7 — Reporting & integrations** | exam-report, transaction-refs, transaction-profiles, transaction-status-history, platform-gateway, moodle, moodle-sync-logs, page-builder | P2–P3 | pending | pending | pending | pending |

P4 (utils/guards) ไม่เปิด batch แยกในรอบแรก — เติมคู่กับ module ที่เกี่ยวข้อง

**Next gate:** confirm เริ่ม **Batch 3 — Enrollment & Voucher** Phase 2 (test-case-analyst: exam-enrollments → exam-vouchers → exam-rule-vouchers → fund-sources). Phase 6 Flow Report ยังไม่เริ่ม

### Batch 2 E2E Rollout evidence (Phase 5)

| Case | Result |
|---|---|
| TXN-E-001 create→confirm payment UI | pass |
| TXN-E-002 expire abandoned pending | pass |
| TXN-E-003 cross-user confirm 403 | pass |
| RCPT-E-001 finance receipt-usage-report | pass |
| RCPT-E-002 download ISSUED PDF | pass |
| VOID-E-001 finance void UI | pass |
| VOID-E-002 empty reason blocked | pass |
| VOID-E-003 non-finance blocked | pass |
| VOID-E-004 post-void actions none | pass |
| BR-E-001 upload→verify MATCH/MISSING | pass |
| BR-E-002 edit refs rematch | **skip** (BUG-005) |
| BR-E-003 confirm payment issues receipts | pass |
| BR-E-004 non-finance blocked import | pass |
| PCFG-E-001 finance CRUD API | pass |
| PCFG-E-002 candidate 403 | pass |
| PCFG-E-003 deactivate then delete | pass |

POMs: `exam-history.page.ts`, `receipt-usage-report.page.ts`, `receipt-void-refund.page.ts`, `payment-import.page.ts`  
Specs: `transactions.e2e.spec.ts`, `receipts.e2e.spec.ts`, `voided-receipts.e2e.spec.ts`, `bank-reconciles.e2e.spec.ts`, `payment-configs.e2e.spec.ts`  
**15 passed, 1 skipped** (~2.8m, `--workers=1`)

### E2E backlog (Batch 2, not in first pass)

| ID | Priority | Reason |
|---|---|---|
| TXN-E-004 | P2 | Finance refund UI |
| RCPT-E-003 | P2 | Non-finance admin receipt gate |
| RCPT-E-004 | P0 | Covered by verify Batch 1 |
| VOID-E-005 | P2 | Void API failure notify |
| BR-E-002 | P1 | BUG-005 — skipped until rematch fixed |

### Batch 2 Integration Rollout evidence (Phase 4)

| Module | Spec file | Result |
|---|---|---|
| transactions | `tests/integration/transactions.api.spec.ts` | PASS (14) |
| receipts | `tests/integration/receipts.api.spec.ts` | PASS (16) |
| voided-receipts | `tests/integration/voided-receipts.api.spec.ts` | PASS (12) |
| bank-reconciles | `tests/integration/bank-reconciles.api.spec.ts` | 7 pass / **1 skip** (BR-I-003 → BUG-005) |
| payment-configs | `tests/integration/payment-configs.api.spec.ts` | PASS (16) |
| **Batch 2 combined** | 5 files | **65 passed, 1 skipped** |

Command: `SKIP_TEST_DB_RESET=1 SKIP_WEB_SERVER=1 npx playwright test --project=integration tests/integration/{transactions,receipts,voided-receipts,bank-reconciles,payment-configs}.api.spec.ts --workers=1`

Notes:
- VOID-I-007: matrix expected 409; API returns 400 after void (RC_STATUS check before Conflict) — rejection still works; not logged as product bug
- BR-I-006 soft-deletes **all** bank-reconcile rows on shared DB — run carefully

### Batch 2 Unit Rollout evidence (Phase 3)

| Module | Spec files | Result |
|---|---|---|
| transactions | `transactions.service.spec.ts` | PASS (40) |
| receipts | `receipts.service.spec.ts`, `dto/receipt.dto.spec.ts` | PASS (27) |
| voided-receipts | `voided-receipts.service.spec.ts`, `dto/create-voided-receipt.dto.spec.ts` | PASS (23) |
| bank-reconciles | `bank-reconciles.service.spec.ts` | PASS (22) |
| payment-configs | `payment-configs.service.spec.ts`, `dto/payment-config.dto.spec.ts` | PASS (29) |
| **Batch 2 combined** | 8 suites | **141 passed** |

Command: `cd apps/backend && npx jest src/modules/transactions/transactions.service.spec.ts src/modules/receipts src/modules/voided-receipts src/modules/bank-reconciles/bank-reconciles.service.spec.ts src/modules/payment-configs --no-coverage`

### Batch 2 Matrix evidence (Phase 2)

| Module | Unit | Integration | E2E | Total | Existing unit coverage note |
|---|---:|---:|---:|---:|---|
| transactions | 38 | 14 | 4 | 56 | TXN-U-036 only (findAll) |
| receipts | 18 | 16 | 4 | 38 | no module spec |
| voided-receipts | 21 | 12 | 5 | 38 | no module spec |
| bank-reconciles | 21 | 8 | 4 | 33 | import hash/dedupe + test-export + getChangeReason |
| payment-configs | 14 | 16 | 3 | 33 | no module spec |
| **Batch 2** | **112** | **66** | **20** | **198** | — |

Cumulative (Batch 1+2): **U211 / I127 / E33 → 371** (see `tests/MASTER_TEST_PLAN.md`)

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
