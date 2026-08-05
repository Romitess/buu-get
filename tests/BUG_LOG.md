# Bug Log

บั๊กที่พบระหว่าง test rollout — แยกจาก Master Test Plan

| ID | Date | Module | Severity | Summary | Status |
|---|---|---|---|---|---|
| BUG-001 | 2026-08-05 | verify / CERT_CODE lookup | medium | Certificate verify matches CERT_CODE case-insensitively (MySQL CI collation) — wrong-case still returns 200 | open |
| BUG-002 | 2026-08-05 | exam-certificates | low | Controller `@Controller('api/exam-certificates')` + global `api` prefix → route `/api/api/exam-certificates` | open |
| BUG-003 | 2026-08-05 | roles | low | `GET /api/roles/:id` after missing/hard-deleted returns 200 with empty/null body instead of 404 | open |
| BUG-004 | 2026-08-05 | verify UI | high | Public certificate verify page shows not-found: `getBandRules()` (auth-gated) inside `Promise.all` with verify API | open |
| BUG-005 | 2026-08-05 | bank-reconciles updateRefs | high | PATCH `/:id/refs` rematch updates BR_REF* but leaves TRANX_ID on prior transaction (stale relation on save) | open |

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
- **Status:** open

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
- **Status:** open
- **Note:** VERIFY-E-001 skipped until fixed (`tests/e2e/verify.e2e.spec.ts`)

### BUG-005

- **Date:** 2026-08-05
- **Module / file:** `apps/backend/src/modules/bank-reconciles/bank-reconciles.service.ts` (`updateRefs`)
- **How found:** integration BR-I-003
- **Expected:** PATCH refs rematch sets `TRANX_ID` to the new matching transaction and unmatches the old one
- **Actual:** `BR_REF*` update but `TRANX_ID` stays on the prior transaction (likely stale `TRANSACTION` relation on `save()`)
- **Repro:** Import BR → verify link to txn A → PATCH refs to txn B’s REF1/REF2 → response still has txn A’s `TRANX_ID`
- **Status:** open
- **Note:** BR-I-003 skipped until fixed (`tests/integration/bank-reconciles.api.spec.ts`)

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
