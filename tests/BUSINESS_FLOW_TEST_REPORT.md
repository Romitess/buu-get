# Business Flow Test Report

> Phase 6 — stakeholder-facing summary of automated coverage across decision flows.  
> Evidence: `tests/PROGRESS.md`, `tests/MASTER_TEST_PLAN.md`, `tests/BUG_LOG.md`  
> Generated as part of **one-shot finish** (THAID + Batch 7 extras deferred).

## Executive verdict

Automated coverage now spans the core BUU-GET decision path:

**Auth → Enrollment/Payment → Exam lifecycle → Scores/Cert → Profile → Admin report**

| Flow | Batches | Unit | Integration | E2E | Open blockers |
|---|---|---:|---:|---:|---|
| Auth & access | 1 | 114 pass | 58p / 3s | 10p / 1s | BUG-004 verify UI |
| Money / payment | 2 | 141 pass | 65p / 1s | 15p / 1s | BUG-005 bank rematch |
| Enrollment & voucher | 3 | 100 pass | 40p | 13p | BUG-006/007 (seat/attendance UX) |
| Exam lifecycle | 4 | 28 pass | 19p / 1s | 2p / 4s | BUG-008/009 edit/seat redirect |
| Scores & certificates | 5 | 47 pass | 25p | 8p / 1s | BUG-002 double prefix; BUG-010 scores load |
| Profile & identity | 6 | 21 pass | 17p | 5p | BUG-011/012 authz gaps (asserted) |
| Exam report (slim) | 7 | 11 pass | 8p | 3p | Month/round filter known gap |

**Active matrix totals (B1–7 slim):** U400 / I237 / E72 → **709**  
**THAID + moodle/page-builder/platform-gateway/transaction-* extras:** deferred/cut

---

## Flow 1 — Auth & Access

**Business decision:** Who can enter the system, with which roles, and can documents be verified?

| Layer | Evidence | Outcome |
|---|---|---|
| Unit | auth / users / roles / verify specs | Login, OTP, register, JWT mapping covered |
| Integration | `auth|users|roles|verify.api.spec.ts` | 58 pass / 3 skip |
| E2E | login smoke, roles access, verify page | 10 pass / 1 skip |

**Risk:** BUG-004 — public certificate verify page blocked by auth-gated band rules.

---

## Flow 2 — Enrollment & Payment (Money)

**Business decision:** Candidate pays / staff confirms payment; receipts and bank reconcile stay consistent.

| Layer | Evidence | Outcome |
|---|---|---|
| Unit | transactions, receipts, voided, bank, payment-configs | 141 pass |
| Integration | money API suites | 65 pass / 1 skip |
| E2E | payment / receipt / bank flows | 15 pass / 1 skip |

**Risk:** BUG-005 — bank reconcile rematch can leave stale `TRANX_ID`.

---

## Flow 3 — Enrollment & Voucher

**Business decision:** Candidate enrolls, uses voucher/fund source; staff manages seats and attendance.

| Layer | Evidence | Outcome |
|---|---|---|
| Unit | enrollments / vouchers / rule-vouchers / fund-sources | 100 pass |
| Integration | enrollment/voucher/fund API | 40 pass |
| E2E | enroll / voucher / fund UI | 13 pass |

**Risks:** BUG-006 seat confirm disabled for API-seeded rooms; BUG-007 nationalId missing on attendance list.

---

## Flow 4 — Exam lifecycle

**Business decision:** Admin opens exams, sessions, locations, seats, and blocks.

| Layer | Evidence | Outcome |
|---|---|---|
| Unit | exam* lifecycle services | 28 pass |
| Integration | exam* API | 19 pass / 1 skip |
| E2E | lifecycle UI | 2 pass / 4 skip |

**Risks:** BUG-008 / BUG-009 — API-seeded exams redirect away from edit-exam and seat-management pages (blocks several E2E paths).

---

## Flow 5 — Scores & Certificates

**Business decision:** Score import/band, rubrics/criteria, certificate issue and public verify.

| Layer | Evidence | Outcome |
|---|---|---|
| Unit | scores / criteria / rubrics / certificates | 47 pass |
| Integration | scores/cert API | 25 pass |
| E2E | scores/cert UI | 8 pass / 1 skip |

**Risks:** BUG-002 double `/api/api/exam-certificates`; BUG-010 unbounded scores fetch blocks enrollments UI; CERT duplicate code → 500 (logged in rollout notes).

---

## Flow 6 — Profile & identity

**Business decision:** Candidate maintains profile/photo; staff remarks force fixes; admin audits history.

| Layer | Evidence | Outcome |
|---|---|---|
| Unit | PROF/IMG/PEH | 21 pass (THAID cut) |
| Integration | profile/image/history API | 17 pass |
| E2E | profile edit / photo / history | 5 pass |

**Risks:** BUG-011 any JWT can PATCH foreign profile by id; BUG-012 any JWT can read foreign history/images. Asserted as current behavior.

**Deferred:** entire `THAID-*` (stub public echo, not real identity flow).

---

## Flow 7 — Admin exam report

**Business decision:** ADMIN/EXECUTIVE view YoY enrollment/attendance/score/attempt metrics and drill to candidates.

| Layer | Evidence | Outcome |
|---|---|---|
| Unit | attempt-metrics + ExamReportService | 11 pass |
| Integration | `/api/exam-report/*` | 8 pass |
| E2E | dashboard → year → candidates; candidate deny | 3 pass |

**Known gap:** `fromMonth` / `toMonth` / round query params are DTO/UI-only (not applied in service).

**Cut from Batch 7:** moodle*, page-builder, platform-gateway full suite, transaction-refs/profiles/status-history.

---

## Cross-cutting quality notes

1. **Shared-DB mode** — suites seed via API with markers (`B6-*`, `B7-RPT-`, `EXAM-I`, `TXN-I`, …) and `afterAll` soft-delete; no full-schema truncate unless `ALLOW_DB_TRUNCATE=1`.
2. **RBAC seeded users** (`test.*@buu-get.test`) are fixtures — must remain after cleanup.
3. **Policy:** production bugs discovered in tests are logged + skipped; tests assert current behavior for known authz gaps rather than forcing green via product patches.
4. **Highest stakeholder impact open bugs:** BUG-004 (public verify), BUG-005 (reconcile integrity), BUG-008/009 (admin exam edit UX), BUG-010 (scores page load), BUG-011 (profile authz).

---

## Recommended next actions (outside this rollout)

1. Fix BUG-008/009 so lifecycle E2E skips can be unskipped.
2. Fix BUG-010 scores page pagination/load before large shared-DB demos.
3. Harden profile/history authz (BUG-011/012).
4. Optionally schedule deferred batches: THAID (if productized), moodle sync, page-builder.
5. Implement month/round filtering in exam-report service if UI promises it.

---

## Appendix — one-shot finish scope

| Included | Excluded |
|---|---|
| Batch 6 PROF/IMG/PEH U→I→E | All THAID-* |
| Batch 7 exam-report only | moodle, page-builder, platform-gateway, txn-refs/profiles/status-history |
| Phase 6 this report | — |
| Shared-DB prefix cleanup | Full truncate / deleting seeded RBAC users |
