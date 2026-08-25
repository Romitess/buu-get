# Bug Log

บั๊กที่พบระหว่าง test rollout — แยกจาก Master Test Plan

| ID | Date | Module | Severity | Summary | Status |
|---|---|---|---|---|---|
| BUG-001 | 2026-08-05 | verify / CERT_CODE lookup | medium | Certificate verify matches CERT_CODE case-insensitively (MySQL CI collation) — wrong-case still returns 200 | open |
| BUG-002 | 2026-08-05 | exam-certificates | low | Controller `@Controller('api/exam-certificates')` + global `api` prefix → route `/api/api/exam-certificates` | fixed |
| BUG-003 | 2026-08-05 | roles | low | `GET /api/roles/:id` after missing/hard-deleted returns 200 with empty/null body instead of 404 | open |
| BUG-004 | 2026-08-05 | verify UI | high | Public certificate verify page shows not-found: `getBandRules()` (auth-gated) inside `Promise.all` with verify API | fixed |
| BUG-005 | 2026-08-05 | bank-reconciles updateRefs | high | PATCH `/:id/refs` rematch updates BR_REF* but leaves TRANX_ID on prior transaction (stale relation on save) | fixed |
| BUG-006 | 2026-08-05 | exam seat management UI | medium | Confirm Seat Assignment stays disabled for API-seeded location/session-location (auto-assign finds no usable seats) | fixed |
| BUG-007 | 2026-08-05 | exam attendance list | medium | Attendance table shows nationalId as `-` (USER_NATIONAL_ID missing on enrollment list) so check-in dialog search cannot resolve candidate | fixed |
| BUG-008 | 2026-08-05 | edit-exam UI / useCreateExam | medium | API-seeded exam opens `/admin/edit-exam/:id` then immediately redirects back to `/admin/exam-management` (cannot execute edit-based lifecycle flows) | fixed |
| BUG-009 | 2026-08-05 | exam-seat-management route | medium | API-seeded exam opens `/admin/exam-management/:id/seats` then redirects back to `/admin/exam-management` | fixed |
| BUG-010 | 2026-08-06 | exam-scores page load | high | Scores page awaits unbounded `fetchExamScores()` (all pages) before loading enrollments — shared-DB with many scores leaves table empty for minutes; blocks import/bulk-issue E2E | fixed |
| BUG-011 | 2026-08-06 | user-profile PATCH :id | high | `PATCH /api/user-profile/:id` is JWT-only (no ownership / @Roles) — any authenticated user can mutate another user's profile if they know the id | fixed |
| BUG-012 | 2026-08-06 | profile-edit-history | medium | History GET + `latest-images` are JWT-only (no @Roles / ownership) — any authenticated role can read any profile's edit history and image paths | fixed |

### BUG-001

- **Date:** 2026-08-05
- **Module / file:** `apps/backend/src/modules/verify/verify.service.ts` (CERT_CODE lookup)
- **How found:** integration VERIFY-I-008
- **Expected:** Exact case-sensitive code match (or documented CI collation)
- **Actual:** Wrong-case CERT_CODE still returns 200
- **Repro:** `GET /api/verify/certificate/{codeWithWrongCase}` for a valid cert
- **Status:** open

### BUG-002

- **Date:** 2026-08-05
- **Module / file:** `apps/backend/src/modules/exam-certificates/exam-certificates.controller.ts`
- **How found:** integration verify fixture setup
- **Expected:** `@Controller('exam-certificates')` → `/api/exam-certificates`
- **Actual:** Path is `/api/api/exam-certificates`
- **Repro:** Open Swagger or call admin list certificates
- **Status:** fixed
- **Fix:** Controller remounted at `@Controller('exam-certificates')`; frontend `CERTIFICATE_ENDPOINT` → `/exam-certificates`

### BUG-003

- **Date:** 2026-08-05
- **Module / file:** `apps/backend/src/modules/roles/roles.service.ts` `findOne`
- **How found:** integration ROLES-I-010 follow-up GET
- **Expected:** 404 NotFound when role missing
- **Actual:** 200 with empty/null body (`findOne` returns null, no NotFoundException)
- **Repro:** `GET /api/roles/{deletedOrMissingId}` as admin
- **Status:** open

### BUG-004

- **Date:** 2026-08-05
- **Module / file:** `apps/frontend/src/pages/verify/verify-result-page.vue` (`loadDocument`)
- **How found:** e2e VERIFY-E-001
- **Expected:** Anonymous user can view valid certificate result when `/api/verify/certificate/:code` returns 200
- **Actual:** UI shows “Document not found” because `Promise.all([verifyCertificate, getBandRules(), …])` fails when `getBandRules()` → `GET /api/score-criteria/band-rules` returns 401
- **Repro:** Open public verify certificate page with a valid CERT_CODE while logged out
- **Status:** fixed
- **Fix:** Verify API embeds `bandRules` from active score-criteria; FE uses payload only (no auth-gated `getBandRules`). VERIFY-E-001 unskipped.

### BUG-005

- **Date:** 2026-08-05
- **Module / file:** `apps/backend/src/modules/bank-reconciles/bank-reconciles.service.ts` (`updateRefs`)
- **How found:** integration BR-I-003
- **Expected:** PATCH refs rematch sets `TRANX_ID` to the new matching transaction and unmatches the old one
- **Actual:** `BR_REF*` update but `TRANX_ID` stays on the prior transaction (likely stale `TRANSACTION` relation on `save()`)
- **Repro:** Import BR → verify link to txn A → PATCH refs to txn B’s REF1/REF2 → response still has txn A’s `TRANX_ID`
- **Status:** fixed
- **Fix:** `updateRefs` clears stale `TRANSACTION` relation via `Reflect.deleteProperty` before setting new `TRANX_ID` (BUG-005).
- **Note:** BR-I-003 unskipped / soft-skip path updated in `tests/integration/bank-reconciles.api.spec.ts`

### BUG-006

- **Date:** 2026-08-05
- **Module / file:** Exam seat management UI + `/exam/:id/with-seats` (API-seeded location / session-location)
- **How found:** e2e ENR-E-004
- **Expected:** After opening seat assignment for an exam with paid enrollments and a room, auto-assign / Confirm Seat Assignment enables and persists seats
- **Actual:** Confirm stays disabled; rearrange finds no usable seats when location + session-location were created via API (UI path may create seats differently)
- **Repro:** Seed exam + location + session-location via API → open admin seat candidates UI → Confirm remains disabled
- **Status:** fixed
- **Fix:** Session-location create hydrates `SEATS_SNAPSHOT` + layout from location seats; seat-management backfills `LOCATION.SEATS` via `/exam-location-seats/location/:id` when with-seats omits them.

### BUG-007

- **Date:** 2026-08-05
- **Module / file:** Exam attendance list / enrollment list payload (`USER_NATIONAL_ID` / user relation)
- **How found:** e2e ENR-E-005
- **Expected:** Attendance table shows candidate national ID so check-in dialog search can resolve the row
- **Actual:** Table shows nationalId as `-`; dialog search cannot resolve candidate
- **Repro:** Open attendance for exam with enrolled candidate who has national ID on user record
- **Status:** fixed
- **Fix:** Attendance + enrollment table map `USER_NATIONAL_ID` with passport fallback; tolerate missing/trimmed values.

### BUG-008

- **Date:** 2026-08-05
- **Module / file:** `apps/frontend/src/composables/use-create-exam.ts` (edit flow load path)
- **How found:** e2e Batch 4 lifecycle (`SES-E-001`, `SL-E-001`, `BLOCK-E-001`)
- **Expected:** Admin can stay on `/admin/edit-exam/:examId` and edit API-seeded exam/session/location data
- **Actual:** Route briefly opens then redirects back to `/admin/exam-management`, blocking edit-flow E2E scenarios
- **Repro:** Seed exam + sessions (+ location linkage) via API, login admin, open `/#/admin/edit-exam/:id`
- **Status:** fixed
- **Fix:** Hardened edit load for API-seeded rooms (null-safe aisle parse, SEATS_SNAPSHOT array guard, backfill `LOCATION.SEATS` from location list) so load no longer throws and abandons the page.

### BUG-009

- **Date:** 2026-08-05
- **Module / file:** seat-management route (`admin-exam-seat-management`) / exam loading guards
- **How found:** e2e Batch 4 lifecycle (`SEAT-E-001`)
- **Expected:** Admin can open `/#/admin/exam-management/:examId/seats` for API-seeded exam and perform seat-assignment flow
- **Actual:** Route redirects back to `/admin/exam-management`, so seat-management flow cannot proceed in UI
- **Repro:** Seed exam + session + session-location via API, login admin, open seat-management URL with `sessionId` and `sessionLocationId`
- **Status:** fixed
- **Fix:** Same seat hydration as BUG-006 so seat page can load usable seats; editing lock still only redirects to candidates when voucher-sent.

### BUG-010

- **Date:** 2026-08-06
- **Module / file:** `apps/frontend/src/pages/admin/exam-scores-page.vue` (`loadData` → `fetchExamScores`) / `apps/frontend/src/services/exam-score.service.ts`
- **How found:** e2e Batch 5 (`SCR-E-001`, `CERT-E-001`)
- **Expected:** Scores page for a seeded exam shows session enrollments quickly so admin can import scores / issue certificates
- **Actual:** `loadData` `Promise.all([fetchExamById, fetchExamScores])` paginates **all** exam-scores in the DB before `fetchRawEnrollmentsByExamId`; with a large shared-DB score table the enrollments table stays empty (`0 ของ 0`) for minutes and IMPORT/bulk-issue cannot run
- **Repro:** Seed disposable exam+session+enrollment, open `/#/admin/exam-management/:examId/scores` while many historical scores exist; watch network for many `/api/exam-scores?page=…` before `/api/exam-enrollments/exam/:id`
- **Status:** fixed
- **Fix:** Load exam → enrollments first; fetch scores scoped by `examId`/`sessionId` without blocking the enrollment table.
### BUG-011

- **Date:** 2026-08-06
- **Module / file:** `apps/backend/src/modules/user-profile/user-profile.controller.ts` (`PATCH :id`)
- **How found:** integration PROF-I-006
- **Expected:** Only owner or ADMIN/staff roles may mutate another profile
- **Actual:** Route uses `@UseGuards(JwtAuthGuard)` only — any JWT can `PATCH /api/user-profile/:id` for a foreign id
- **Repro:** Login as candidate A → `PATCH /api/user-profile/{profileIdOfB}` with field changes → 200
- **Status:** fixed
- **Fix:** `assertSelfOrRoles` on profile.userId with `ENROLLMENT_ADMIN_ROLES`; PROF-I-006 expects 403

### BUG-012

- **Date:** 2026-08-06
- **Module / file:** `apps/backend/src/modules/profile-edit-history/profile-edit-history.controller.ts`
- **How found:** integration PEH-I-005
- **Expected:** History / latest-images restricted to ADMIN/staff or profile owner
- **Actual:** JWT-only endpoints — any authenticated role can `GET .../profile/:id` and `POST .../latest-images` for any ids
- **Repro:** Login as candidate → `GET /api/profile-edit-history/profile/{foreignProfileId}` → 200 with rows
- **Status:** fixed
- **Fix:** Ownership or `ENROLLMENT_ADMIN_ROLES` on GET history + latest-images; PEH-I-005 expects 403

### Template

```
### BUG-NNN
- **Date:**
- **Module / file:**
- **How found:** unit | integration | e2e
- **Expected:**
- **Actual:**
- **Repro:**
- **Status:** open | fixed | wontfix
```
