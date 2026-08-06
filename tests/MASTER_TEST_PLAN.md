# Master Test Plan

รวม Test Case Matrix จากทุก batch (Phase 2+)

## Cumulative counts

| Level | Batch 1 | Batch 2 | Total |
|---|---:|---:|---:|
| unit | 99 | 112 | 211 |
| integration | 61 | 66 | 127 |
| e2e | 13 | 20 | 33 |
| **all** | **173** | **198** | **371** |

### Batch 1 breakdown

| Module | Unit | Integration | E2E | Total |
|---|---:|---:|---:|---:|
| auth | 32 | 18 | 6 | 50 |
| users | 27 | 21 | 1 | 49 |
| roles | 16 | 14 | 2 | 32 |
| verify | 24 | 8 | 4 | 36 |

### Batch 2 breakdown

| Module | Unit | Integration | E2E | Total |
|---|---:|---:|---:|---:|
| transactions | 38 | 14 | 4 | 56 |
| receipts | 18 | 16 | 4 | 38 |
| voided-receipts | 21 | 12 | 5 | 38 |
| bank-reconciles | 21 | 8 | 4 | 33 |
| payment-configs | 14 | 16 | 3 | 33 |

---

## Batch 1 — Auth & Access

### auth

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-U-001 | unit | `login` success — JWT payload + response shape | P0 | Mock user + bcrypt + JwtService | Call `AuthService.login` | JWT `{sub,email,role,roles}`; `{accessToken,user}` | yes | `auth.service.spec.ts` |
| AUTH-U-002 | unit | `login` — remark null when PROFILE missing | P1 | User without PROFILE | Call `login` | `remark === null` | yes | |
| AUTH-U-003 | unit | `login` — invalid password | P0 | bcrypt.compare=false | Call `login` | `BadRequestException` Invalid email or password | yes | |
| AUTH-U-004 | unit | `login` — user not found | P0 | findByEmail null | Call `login` | `BadRequestException` Invalid email or password | yes | |
| AUTH-U-005 | unit | `login` — empty ROLES_ID → candidate fallback | P1 | ROLES_ID=[] | Call `login` | role/roles = candidate | gap | |
| AUTH-U-006 | unit | `login` — multi-role primary = first | P1 | roles [admin,staff] | Call `login` | role=admin | gap | |
| AUTH-U-007 | unit | `sendOtp` rejects registered email | P0 | Existing user | Call `sendOtp` | BadRequest อีเมลนี้ถูกใช้งานแล้ว | gap | |
| AUTH-U-008 | unit | `sendOtp` caches OTP + emails | P0 | New email; mocks | Call `sendOtp` | cache 5min; sendEmail; success | gap | |
| AUTH-U-009 | unit | `sendOtp` gateway failure | P1 | sendEmail throws | Call `sendOtp` | BadRequest ไม่สามารถส่งอีเมล OTP | gap | |
| AUTH-U-010 | unit | `verifyOtp` success deletes OTP | P0 | Matching OTP in cache | Call `verifyOtp` | success; cache.del | gap | |
| AUTH-U-011 | unit | `verifyOtp` wrong OTP | P0 | Different OTP | Call `verifyOtp` | BadRequest OTP ไม่ถูกต้อง/หมดอายุ | gap | |
| AUTH-U-012 | unit | `verifyOtp` missing/expired | P0 | cache empty | Call `verifyOtp` | BadRequest OTP ไม่ถูกต้อง/หมดอายุ | gap | |
| AUTH-U-013 | unit | `register` happy path | P0 | Txn mocks; Moodle ok | Call `register` | Registration successful; ACTIVE; commit | gap | |
| AUTH-U-014 | unit | `register` email normalize | P1 | Mixed-case email | Call `register` | Stored lowercase trimmed | gap | |
| AUTH-U-015 | unit | `register` duplicate email | P0 | Email exists in txn | Call `register` | BadRequest; rollback | gap | |
| AUTH-U-016 | unit | `register` duplicate national ID (thai) | P0 | National ID exists | Call `register` | BadRequest; rollback | gap | |
| AUTH-U-017 | unit | `register` duplicate passport (foreigner) | P0 | Passport exists | Call `register` | BadRequest; rollback | gap | |
| AUTH-U-018 | unit | `register` thai vs foreigner ID fields | P1 | Both userTypes | Call `register` | NATIONAL_ID vs PASSPORT_NO | gap | |
| AUTH-U-019 | unit | `register` userThaidSynced thai only | P2 | thai vs foreigner | Call `register` | true iff thai | gap | |
| AUTH-U-020 | unit | `register` birthdate parse | P2 | `YYYY MM DD` | Call `register` | Valid Date | gap | |
| AUTH-U-021 | unit | `register` invalid birthdate → null | P2 | Bad birthdate | Call `register` | DOB null; still succeeds | gap | |
| AUTH-U-022 | unit | `register` Moodle failure rolls back | P0 | Moodle throws | Call `register` | rollback; BadRequest | gap | |
| AUTH-U-023 | unit | `register` profile image fail still succeeds | P1 | Image upload throws after commit | Call `register` | Returns success; logged | gap | |
| AUTH-U-024 | unit | persistRegisterProfileImage invalid data URL | P2 | Bad data: URL | Via register | No UserImage | gap | |
| AUTH-U-025 | unit | persistRegisterProfileImage plain path | P2 | Path string | Via register | UserImage saved | gap | |
| AUTH-U-026 | unit | deriveName from full name for Moodle | P2 | ≥2 name tokens | Via register | first/last split | gap | |
| AUTH-U-027 | unit | deriveName fallback email local-part | P2 | No name | Via register | local-part | gap | |
| AUTH-U-028 | unit | `getProfile` maps user+profile | P0 | findById with relations | Call `getProfile` | Flattened profile fields | gap | |
| AUTH-U-029 | unit | `getProfile` user not found | P1 | findById null | Call `getProfile` | BadRequest User not found | gap | |
| AUTH-U-030 | unit | `getProfile` empty roles → candidate | P1 | Empty ROLES_ID | Call `getProfile` | candidate fallback | gap | |
| AUTH-U-031 | unit | JwtStrategy.validate maps payload | P0 | Payload with roles | Call `validate` | `{userId,email,role,roles}` | gap | |
| AUTH-U-032 | unit | JwtStrategy.validate legacy no roles | P1 | role only | Call `validate` | roles=[role] | gap | |
| AUTH-I-001 | integration | POST /api/auth/login valid | P0 | Seeded user | POST login | 200/201 + accessToken | gap | |
| AUTH-I-002 | integration | POST /api/auth/login wrong password | P0 | Seeded user | POST wrong pwd | 400 | gap | |
| AUTH-I-003 | integration | POST /api/auth/login unknown email | P0 | — | POST unknown | 400 | gap | |
| AUTH-I-004 | integration | POST /api/auth/login DTO validation | P1 | — | Invalid body | 400 | gap | |
| AUTH-I-005 | integration | GET /api/auth/me with JWT | P0 | Login token | GET /me | 200 profile | gap | |
| AUTH-I-006 | integration | GET /api/auth/me without token | P0 | — | GET /me | 401 | gap | |
| AUTH-I-007 | integration | GET /api/auth/me invalid JWT | P1 | Bad token | GET /me | 401 | gap | |
| AUTH-I-008 | integration | POST /api/auth/send-otp new email | P1 | Gateway stub | POST send-otp | success | gap | |
| AUTH-I-009 | integration | POST /api/auth/send-otp existing email | P0 | Registered email | POST send-otp | 400 | gap | |
| AUTH-I-010 | integration | POST /api/auth/send-otp invalid email | P2 | — | Bad email | 400 | gap | |
| AUTH-I-011 | integration | POST /api/auth/verify-otp wrong | P0 | — | Wrong OTP | 400 | gap | |
| AUTH-I-012 | integration | POST /api/auth/verify-otp length ≠6 | P2 | — | Bad length | 400 | gap | |
| AUTH-I-013 | integration | POST /api/auth/verify-otp one-time | P1 | Known OTP | Verify twice | Second fails | gap | |
| AUTH-I-014 | integration | POST /api/auth/register thai persists | P0 | Unique ids; Moodle stub | POST register | User+Profile+candidate | gap | |
| AUTH-I-015 | integration | POST /api/auth/register duplicate email | P0 | Existing email | POST register | 400 | gap | |
| AUTH-I-016 | integration | POST /api/auth/register duplicate national ID | P1 | Existing ID | POST register | 400 | gap | |
| AUTH-I-017 | integration | POST /api/auth/register DTO validation | P1 | — | Invalid body | 400 | gap | |
| AUTH-I-018 | integration | Login JWT works on protected route | P1 | Candidate token | Call protected API | Not 401 | gap | |
| AUTH-E-001 | e2e | Login page renders brand + form | P1 | FE up | Open /login | Logo visible | yes | auth-smoke |
| AUTH-E-002 | e2e | Candidate login → exam-schedule | P0 | Seeded candidate | UI login | Redirect exam-schedule | gap | |
| AUTH-E-003 | e2e | Admin/staff login → admin-exam-management | P0 | Seeded admin/staff | UI login | Redirect exam management | gap | |
| AUTH-E-004 | e2e | Finance login → admin-payment-import | P1 | Seeded finance | UI login | Redirect payment import | gap | |
| AUTH-E-005 | e2e | Failed login stays on login | P0 | — | Wrong password | Stay /login; error | gap | |
| AUTH-E-006 | e2e | Logged-in /login redirects home | P1 | Already logged in | Visit /login | Redirect role home | gap | |

### users

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| USERS-U-001 | unit | generateUserCode Buddhist YY + pad | P1 | Mock service | generateUserCode | e.g. 69000001 | yes | |
| USERS-U-002 | unit | generateUserCode pads USER_ID | P2 | — | generateUserCode(123) | 69000123 | yes | |
| USERS-U-003 | unit | create rejects duplicate email | P0 | Existing (incl soft-deleted) | create | ConflictException | gap | |
| USERS-U-004 | unit | create rejects duplicate national ID | P0 | Existing national ID | create | ConflictException | gap | |
| USERS-U-005 | unit | create rejects duplicate passport | P0 | Existing passport | create | ConflictException | gap | |
| USERS-U-006 | unit | create hashes password | P0 | Txn mocks | create | bcrypt hash stored | gap | |
| USERS-U-007 | unit | create assigns roles | P0 | Roles found | create with USER_ROLES | ROLES_ID set | gap | |
| USERS-U-008 | unit | create skips roles when empty | P1 | USER_ROLES=[] | create | No findByIds | gap | |
| USERS-U-009 | unit | create sets USER_CODE after insert | P0 | Save returns USER_ID | create | USER_CODE updated | gap | |
| USERS-U-010 | unit | create with profile in txn | P1 | profile in DTO | create | userProfileService.create | gap | |
| USERS-U-011 | unit | create without profile skips | P2 | No profile | create | No profile call | gap | |
| USERS-U-012 | unit | findAll defaults page/limit | P1 | Empty query | findAll | page1 limit10 | gap | |
| USERS-U-013 | unit | findAll filter by role | P1 | query.role | findAll | innerJoin ROLE_NAME | gap | |
| USERS-U-014 | unit | findAll search fields | P1 | search term | findAll | LIKE national/passport/email/names | gap | |
| USERS-U-015 | unit | findAll blank search ignored | P2 | search spaces | findAll | No search clause | gap | |
| USERS-U-016 | unit | findOne returns DTO | P1 | User exists | findOne | fromEntity + relations | gap | |
| USERS-U-017 | unit | findOne NotFound | P0 | Missing | findOne | NotFoundException | gap | |
| USERS-U-018 | unit | updateRole replaces ROLES_ID | P0 | User+roles exist | updateRole | Roles replaced | gap | |
| USERS-U-019 | unit | updateRole user missing | P0 | User null | updateRole | NotFoundException | gap | |
| USERS-U-020 | unit | updateRole unknown roleIds partial | P2 | Subset found | updateRole | Only found roles | gap | Product risk |
| USERS-U-021 | unit | remove soft-deletes | P0 | User exists | remove | softRemove | gap | |
| USERS-U-022 | unit | remove NotFound | P0 | Missing | remove | NotFoundException | gap | |
| USERS-U-023 | unit | checkIdentifiers normalize | P1 | Mixed ids | checkIdentifiers | trim/dedupe | gap | |
| USERS-U-024 | unit | checkIdentifiers all empty → [] | P2 | Empty strings | checkIdentifiers | [] no query | gap | |
| USERS-U-025 | unit | checkIdentifiers exists flags | P0 | DB hits | checkIdentifiers | exists true/false | gap | |
| USERS-U-026 | unit | findByCode NotFound message | P3 | Missing code | findByCode | NotFound with code | gap | Internal |
| USERS-U-027 | unit | UserResponseDto omits password | P0 | Entity with password | fromEntity | No password | gap | |
| USERS-I-001 | integration | POST /users ADMIN create | P0 | ADMIN JWT; roles seeded | POST /api/users | 201; hashed; USER_CODE | gap | |
| USERS-I-002 | integration | POST /users Conflict soft-deleted email | P0 | Soft-deleted user | POST create | 409 | gap | |
| USERS-I-003 | integration | POST /users DTO validation | P1 | ADMIN JWT | Invalid body | 400 | gap | |
| USERS-I-004 | integration | POST /users forbidden non-ADMIN | P0 | STAFF JWT | POST | 403 | gap | |
| USERS-I-005 | integration | GET /users allowed LIST roles | P0 | STAFF/ADMIN JWT | GET | 200 paginated | gap | |
| USERS-I-006 | integration | GET /users forbidden CANDIDATE | P0 | Candidate JWT | GET | 403 | yes | authz.e2e Nest |
| USERS-I-007 | integration | GET /users unauthenticated | P0 | No JWT | GET | 401 | gap | |
| USERS-I-008 | integration | GET /users pagination/role/search | P1 | Seeded users | GET query | Correct filter/meta | gap | |
| USERS-I-009 | integration | POST /users/check-identifiers | P1 | LIST JWT | POST identifiers | results exists | gap | |
| USERS-I-010 | integration | POST check-identifiers validation | P2 | LIST JWT | Empty/>1000 | 400 | gap | |
| USERS-I-011 | integration | GET /users/:id self | P0 | Self JWT | GET self | 200 | gap | |
| USERS-I-012 | integration | GET /users/:id ADMIN other | P0 | ADMIN JWT | GET other | 200 | gap | |
| USERS-I-013 | integration | GET /users/:id non-admin other → 403 | P0 | STAFF JWT | GET other | 403 | gap | |
| USERS-I-014 | integration | GET /users/:id NotFound | P1 | ADMIN JWT | Missing id | 404 | gap | |
| USERS-I-015 | integration | GET /users/:id non-int | P2 | Auth | /users/abc | 400 | gap | |
| USERS-I-016 | integration | PATCH /users/:id/role ADMIN | P0 | ADMIN JWT | PATCH roleIds | 200; join updated | gap | |
| USERS-I-017 | integration | PATCH role forbidden non-ADMIN | P0 | STAFF JWT | PATCH | 403 | gap | |
| USERS-I-018 | integration | PATCH role empty roleIds | P1 | ADMIN JWT | roleIds=[] | 400 | gap | |
| USERS-I-019 | integration | DELETE /users/:id soft-delete | P0 | ADMIN JWT | DELETE | DELETED_AT set | gap | |
| USERS-I-020 | integration | DELETE forbidden / NotFound | P0 | STAFF / missing | DELETE | 403 / 404 | gap | |
| USERS-I-021 | integration | Create USER_STATUS persisted | P2 | ADMIN JWT | POST INACTIVE | Status stored | gap | |
| USERS-E-001 | e2e | Dedicated admin user CRUD UI | P3 | — | — | — | n/a | No admin users page |

### roles

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ROLES-U-001 | unit | create saves DTO | P0 | Mock repo | create | save called | gap | |
| ROLES-U-002 | unit | findAll returns find() | P0 | Mock repo | findAll | array | gap | |
| ROLES-U-003 | unit | findOne by ROLE_ID | P0 | Mock repo | findOne(5) | where ROLE_ID | gap | No NotFound |
| ROLES-U-004 | unit | update delegates | P0 | Mock repo | update | repository.update | gap | |
| ROLES-U-005 | unit | remove hard-deletes | P0 | Mock repo | remove | delete not softDelete | gap | Entity has soft-delete column unused |
| ROLES-U-006 | unit | findByName by ROLE_NAME | P0 | Mock repo | findByName | Role or null | gap | Used by auth register |
| ROLES-U-007 | unit | RoleEnum 8 values | P0 | — | Assert enum | 8 string roles | gap | Match frontend ROLES |
| ROLES-U-008 | unit | USER_ADMIN_ROLES admin-only | P0 | — | Read constant | [ADMIN] | gap | |
| ROLES-U-009 | unit | RolesGuard allows no @Roles | P1 | No metadata | canActivate | true | yes | roles.guard.spec |
| ROLES-U-010 | unit | RolesGuard allows matching role | P0 | Required ADMIN | canActivate | true | yes | |
| ROLES-U-011 | unit | RolesGuard denies missing role | P0 | Candidate vs ADMIN | canActivate | ForbiddenException | yes | |
| ROLES-U-012 | unit | RolesGuard no roles assigned | P0 | Empty roles | canActivate | Forbidden No role assigned | gap | |
| ROLES-U-013 | unit | RolesGuard prefers roles[] over role | P1 | Conflicting role/roles | canActivate | Uses roles[] | gap | |
| ROLES-U-014 | unit | RolesGuard fallback single role | P1 | roles=[] role=ADMIN | canActivate | Allow | gap | |
| ROLES-U-015 | unit | RolesGuard normalize case/hyphen | P1 | Variant spellings | canActivate | Allow | gap | |
| ROLES-U-016 | unit | CreateRoleDto validation | P0 | Invalid DTO | Validate | Fail IsString/IsNotEmpty | gap | |
| ROLES-I-001 | integration | POST /roles as admin | P0 | ADMIN JWT | POST | 200/201; DB row | gap | |
| ROLES-I-002 | integration | POST /roles invalid body | P0 | ADMIN JWT | Bad body | 400 | gap | |
| ROLES-I-003 | integration | POST /roles unknown props | P1 | ADMIN JWT | Extra field | 400 | gap | |
| ROLES-I-004 | integration | POST /roles forbidden non-admin | P0 | Candidate JWT | POST | 403 | gap | |
| ROLES-I-005 | integration | POST /roles no JWT | P0 | — | POST | 401 | gap | |
| ROLES-I-006 | integration | GET /roles admin list | P0 | Seeded roles | GET | 200 array | gap | |
| ROLES-I-007 | integration | GET /roles/:id | P1 | Known id | GET | 200 or null | gap | |
| ROLES-I-008 | integration | :id non-int ParseIntPipe | P1 | ADMIN JWT | /roles/abc | 400 | gap | |
| ROLES-I-009 | integration | PATCH /roles/:id | P0 | Existing role | PATCH | DB updated | gap | |
| ROLES-I-010 | integration | DELETE /roles/:id hard delete | P0 | Existing role | DELETE | Row gone | gap | FK risk |
| ROLES-I-011 | integration | All /roles deny non-admin | P0 | STAFF JWT | CRUD | All 403 | gap | |
| ROLES-I-012 | integration | findByName seeded enum | P0 | candidate seeded | findByName | Returns role | gap | |
| ROLES-I-013 | integration | Duplicate ROLE_NAME allowed | P2 | ADMIN JWT | Create twice | Both succeed | gap | Product risk |
| ROLES-I-014 | integration | Soft-deleted excluded if soft-removed | P3 | Soft DELETED_AT | GET list | Excluded | gap | Mismatch hard delete |
| ROLES-E-001 | e2e | ROLE_LABELS match RoleEnum | P2 | Seeded users | Login; see label | Matches ROLE_LABELS | gap | No roles CRUD UI |
| ROLES-E-002 | e2e | Non-admin blocked from admin surfaces | P1 | Candidate/staff | Try admin routes | Blocked | gap | |

### verify

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VERIFY-U-001 | unit | Certificate missing → NotFound | P0 | findOne null | verifyCertificate | NotFoundException | yes | |
| VERIFY-U-002 | unit | Soft-deleted certificate → NotFound | P0 | DELETED_AT set | verifyCertificate | NotFoundException | gap | |
| VERIFY-U-003 | unit | Valid certificate response | P0 | Non-expired cert + relations | verifyCertificate | type certificate status valid | gap | |
| VERIFY-U-004 | unit | Expired certificate status | P0 | Past CERT_EXPIRES_AT | verifyCertificate | status expired | yes | |
| VERIFY-U-005 | unit | Null expires stays valid | P1 | CERT_EXPIRES_AT null | verifyCertificate | status valid | gap | |
| VERIFY-U-006 | unit | Holder fullName fallback | P2 | Vary EN/TH/email | verifyCertificate | First non-empty or '-' | gap | |
| VERIFY-U-007 | unit | testTakerId fallback | P2 | Missing ERM_TEST_TAKER | verifyCertificate | USER_CODE then '-' | gap | |
| VERIFY-U-008 | unit | nationalId mask prefer national/passport | P1 | IDs present | verifyCertificate | maskIdentifier | yes (partial) | |
| VERIFY-U-009 | unit | Score lines filter/sort/map | P1 | Mixed deleted lines | verifyCertificate | Non-deleted sorted | gap | |
| VERIFY-U-010 | unit | bandLevel null | P2 | SC_BAND_LEVEL null | verifyCertificate | null | gap | |
| VERIFY-U-011 | unit | Deprecated vocab/reading scores | P2 | SCORE fields set | verifyCertificate | Numbers mapped | gap | |
| VERIFY-U-012 | unit | Receipt not found | P0 | null | verifyReceipt | NotFoundException | gap | |
| VERIFY-U-013 | unit | Soft-deleted receipt | P0 | DELETED_AT | verifyReceipt | NotFoundException | gap | |
| VERIFY-U-014 | unit | Unissued receipt → NotFound | P0 | UNISSUED | verifyReceipt | NotFoundException | yes | |
| VERIFY-U-015 | unit | Voided receipt redacts | P0 | VOIDED | verifyReceipt | voided; amount/address null | yes | |
| VERIFY-U-016 | unit | Issued receipt full payload | P0 | ISSUED + relations | verifyReceipt | status valid + fields | gap | |
| VERIFY-U-017 | unit | receiptNo buildReceiptNo | P1 | Known RC_ID | verifyReceipt | RC{year}-{pad5} | yes (partial) | |
| VERIFY-U-018 | unit | issuedOrPaidAt priority | P1 | Vary dates | verifyReceipt | ISSUED→PAID→CREATED | gap | |
| VERIFY-U-019 | unit | mapPaymentMethod channels | P2 | Vary TRANX_CHANNEL | verifyReceipt | Mapped labels | gap | |
| VERIFY-U-020 | unit | Receipt description constant | P3 | Any receipt | verifyReceipt | ค่าสมัครสอบ BUU-GET | gap | |
| VERIFY-U-021 | unit | Organization constants | P2 | Any receipt | verifyReceipt | taxId 0994000033100 | gap | |
| VERIFY-U-022 | unit | generateCertificateCode format | P1 | — | util | 16 A-Z0-9 | yes | |
| VERIFY-U-023 | unit | generateReceiptVerifyCode format | P1 | — | util | 16 A-Z0-9 | yes | |
| VERIFY-U-024 | unit | Code uniqueness sample | P2 | Generate 20 | Set size | 20 | yes | |
| VERIFY-I-001 | integration | GET /verify/certificate/:code public | P0 | Seeded cert; no JWT | GET | 200 | gap | |
| VERIFY-I-002 | integration | GET certificate unknown/soft-deleted 404 | P0 | Bad/deleted code | GET | 404 | gap | |
| VERIFY-I-003 | integration | GET certificate expired 200 | P1 | Expired cert | GET | 200 status expired | gap | |
| VERIFY-I-004 | integration | GET /verify/receipt/:code issued | P0 | Issued receipt | GET | 200 | gap | |
| VERIFY-I-005 | integration | GET receipt unissued/deleted 404 | P0 | Bad states | GET | 404 | gap | |
| VERIFY-I-006 | integration | GET receipt voided redacted | P1 | VOIDED | GET | 200 voided | gap | |
| VERIFY-I-007 | integration | Throttle 30/60s | P2 | Public | Burst GETs | 429 | gap | |
| VERIFY-I-008 | integration | Exact code match only | P1 | Distinct codes | Wrong vs right | Only exact 200 | gap | |
| VERIFY-E-001 | e2e | Public UI verify certificate | P1 | Valid code | Open verify page | Shows result no login | gap | |
| VERIFY-E-002 | e2e | Public UI verify receipt | P1 | Issued code | Open verify page | Shows receipt | gap | |
| VERIFY-E-003 | e2e | Public UI not-found bad code | P2 | Bad code | Open verify | Error/not-found | gap | |
| VERIFY-E-004 | e2e | Short QR certificate link | P3 | Valid code | Open v/c/:code | Same result | gap | |

---

## Notes / risks flagged for Bug Log later (not bugs until confirmed)

- USERS-U-020: `updateRole` silently assigns only found roleIds
- ROLES-I-013: duplicate ROLE_NAME allowed (no unique constraint)
- ROLES-U-005 / ROLES-I-010: hard delete vs soft-delete column mismatch
- VERIFY DTO allows `revoked` but service never sets it

---

## Batch 2 — Money

### transactions

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TXN-U-001 | unit | createTransactionForFlow creates PENDING when none exists | P0 | Mock: PC+ERM; no prior TRANX | Call createTransactionForFlow | PENDING/UNMATCH/QR; history Created pending; returns TRANX_ID | gap | |
| TXN-U-002 | unit | createTransactionForFlow reuses PENDING keeps QR | P0 | Existing PENDING+QR | Call with new pcId/amount | Updates PC/amount; keeps QR; no new history | gap | |
| TXN-U-003 | unit | createTransactionForFlow restarts non-PENDING non-PAID | P0 | EXPIRED/REJECTED etc | Call flow create | New QR; PENDING; history Restarted | gap | |
| TXN-U-004 | unit | createTransactionForFlow Conflict when already PAID | P0 | Latest TRANX PAID | Call flow create | ConflictException | gap | |
| TXN-U-005 | unit | createTransactionForFlow NotFound missing PC | P1 | pcId missing | Call | NotFoundException | gap | |
| TXN-U-006 | unit | createTransactionForFlow NotFound missing ERM | P1 | ermId missing | Call | NotFoundException | gap | |
| TXN-U-007 | unit | confirmPaymentFlow PENDING→PAID + ERM + ref | P0 | PENDING; owner; PC active | confirmPaymentFlow | PAID+PAID_AT; ERM PAID; history; TransactionRef | gap | |
| TXN-U-008 | unit | confirmPaymentFlow rejects non-PENDING | P0 | PAID/EXPIRED | Confirm | BadRequestException | gap | |
| TXN-U-009 | unit | confirmPaymentFlow NotFound transaction | P1 | Unknown id | Confirm | NotFoundException | gap | |
| TXN-U-010 | unit | confirmPaymentFlow NotFound enrollment | P1 | TRANX ok; ERM missing | Confirm | NotFoundException | gap | |
| TXN-U-011 | unit | confirmPaymentFlow Forbidden non-owner non-FINANCE | P0 | Other ERM; CANDIDATE | Confirm | ForbiddenException | gap | |
| TXN-U-012 | unit | confirmPaymentFlow allows FINANCE_ROLES | P0 | Other ERM; ADMIN/FINANCE/STAFF | Confirm | Succeeds | gap | |
| TXN-U-013 | unit | confirmPaymentFlow BadRequest inactive PC | P0 | PC_IS_ACTIVE=false | Confirm | BadRequestException | gap | |
| TXN-U-014 | unit | confirmPaymentFlow BadRequest expired PC | P0 | PC_EFFECTIVE_TO < now | Confirm | BadRequestException | gap | |
| TXN-U-015 | unit | confirmPaymentFlow NotFound missing PC | P1 | PC_ID missing | Confirm | NotFoundException | gap | |
| TXN-U-016 | unit | confirmPaymentFlow creates receipt when receiptName set | P1 | PENDING + receiptName | Confirm | Receipt UNISSUED + verify; profile sync | gap | |
| TXN-U-017 | unit | confirmPaymentFlow skips receipt without receiptName | P2 | PENDING; no receiptName | Confirm | No receipt; still PAID | gap | |
| TXN-U-018 | unit | confirmPaymentFlow updates existing receipt | P2 | Receipt exists | Confirm with name | Updates; UNISSUED | gap | |
| TXN-U-019 | unit | buildEnrollmentRefCode format and bounds | P1 | Via confirm | Valid vs out-of-range ERM_ID | yyddmm+6erm or BadRequest | gap | |
| TXN-U-020 | unit | confirmPaymentFlow rolls back on mid-flow failure | P0 | Mock save throws | Confirm | rollback; error rethrown | gap | |
| TXN-U-021 | unit | expireTransaction PENDING→EXPIRED | P0 | PENDING; owner/FINANCE | expireTransaction | EXPIRED + history; ERM unchanged | gap | |
| TXN-U-022 | unit | expireTransaction rejects non-PENDING | P0 | PAID | Expire | BadRequestException | gap | |
| TXN-U-023 | unit | expireTransaction Forbidden non-owner | P0 | Other ERM; CANDIDATE | Expire | ForbiddenException | gap | |
| TXN-U-024 | unit | expireTransaction NotFound | P1 | Unknown id | Expire | NotFoundException | gap | |
| TXN-U-025 | unit | createPendingPayment PAID+MATCH+receipt+ERM | P0 | Fee match; PC_ID=1; no prior | createPendingPayment | TRANX PAID/MATCH; receipt; ERM PAID | gap | name says pending but sets PAID |
| TXN-U-026 | unit | createPendingPayment amount ≠ exam fee | P0 | Fee 500; amount 400 | Call | BadRequestException | gap | |
| TXN-U-027 | unit | createPendingPayment exam fee missing | P1 | EXAM_FEE null | Call | BadRequestException | gap | |
| TXN-U-028 | unit | createPendingPayment Conflict non-PENDING/non-PAID prior | P0 | Prior EXPIRED etc | Call | ConflictException | gap | |
| TXN-U-029 | unit | createPendingPayment updates existing PENDING/PAID | P1 | Prior PENDING/PAID | Call | Overwrites to PAID/MATCH | gap | |
| TXN-U-030 | unit | createPendingPayment NotFound ERM or PC 1 | P1 | Missing | Call | NotFoundException | gap | |
| TXN-U-031 | unit | refundTransaction PAID→REFUND + ERM CANCELLED | P0 | PAID; no ISSUED receipt | refundTransaction | REFUND; history; ERM CANCELLED | gap | |
| TXN-U-032 | unit | refundTransaction allows APPROVED | P1 | APPROVED; no ISSUED | Refund | REFUND + CANCELLED | gap | |
| TXN-U-033 | unit | refundTransaction rejects non-refundable | P0 | PENDING etc | Refund | BadRequestException | gap | |
| TXN-U-034 | unit | refundTransaction Conflict already REFUND/VOIDED | P1 | REFUND or RECEIPT_VOIDED | Refund | ConflictException | gap | |
| TXN-U-035 | unit | refundTransaction blocks ISSUED receipt | P0 | PAID + ISSUED | Refund | BadRequest void instead | gap | |
| TXN-U-036 | unit | findAll pagination | P2 | Mock findAndCount | findAll defaults/custom | Paginated meta | yes | existing spec |
| TXN-U-037 | unit | findOne NotFound | P2 | Missing id | findOne | NotFoundException | gap | |
| TXN-U-038 | unit | update / updateByErmId / soft remove | P2 | Existing/missing | update paths | assign+save; null; softRemove | gap | |
| TXN-I-001 | integration | POST /transactions creates PENDING | P0 | JWT; ERM+PC | POST CreateTransactionFlowDto | 201; PENDING | gap | |
| TXN-I-002 | integration | POST /transactions 409 when PAID | P0 | PAID exists | POST | 409 | gap | |
| TXN-I-003 | integration | PATCH confirm persists PAID+ref+ERM | P0 | Own PENDING; active PC | PATCH confirm | 200; DB PAID | gap | |
| TXN-I-004 | integration | PATCH confirm 400 bad state/PC | P0 | Bad states | Confirm | 400 | gap | |
| TXN-I-005 | integration | PATCH confirm 403 other user | P0 | Other PENDING; CANDIDATE | Confirm | 403 | gap | |
| TXN-I-006 | integration | PATCH expire persists EXPIRED | P0 | Own PENDING | PATCH expire | 200; EXPIRED | gap | |
| TXN-I-007 | integration | POST pending-payment amount/phone validation | P0 | Bad amount/phone | POST | 400 | gap | |
| TXN-I-008 | integration | POST pending-payment commits PAID | P0 | Fee match; PC 1 | POST | 201; PAID+receipt | gap | |
| TXN-I-009 | integration | POST refund FINANCE only + ISSUED block | P0 | PAID±ISSUED; roles | POST refund | 403 / 400 / REFUND | gap | |
| TXN-I-010 | integration | GET /transactions requires FINANCE | P1 | CANDIDATE vs FINANCE | GET | 403 vs 200 | gap | |
| TXN-I-011 | integration | PATCH/DELETE finance mutations require FINANCE | P2 | Non-finance | Mutate | 403 | gap | |
| TXN-I-012 | integration | Unauthenticated rejected | P0 | No JWT | Money routes | 401 | gap | |
| TXN-I-013 | integration | DTO validation create/confirm | P1 | Invalid body | POST/PATCH | 400 | gap | |
| TXN-I-014 | integration | confirm/expire transactional integrity | P1 | Double-confirm | Two confirms | One PAID; second 400 | gap | |
| TXN-E-001 | e2e | Candidate create→confirm payment UI | P0 | Unpaid enrollment | exam-history pay flow | PENDING then PAID | gap | |
| TXN-E-002 | e2e | Candidate expires abandoned pending | P1 | PENDING | Expire in UI | EXPIRED; can restart | gap | |
| TXN-E-003 | e2e | Candidate cannot confirm another's txn | P0 | Two candidates | B confirms A's | 403 | gap | |
| TXN-E-004 | e2e | Finance refund unpaid-receipt path | P2 | PAID no ISSUED | Finance UI/API | REFUND; ERM CANCELLED | gap | |

### receipts

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RCPT-U-001 | unit | create persists + auto RC_VERIFY_CODE | P0 | Mock repo | create({TRANX_ID, signature}) | Verify code set; save | gap | |
| RCPT-U-002 | unit | create always overwrites verify via util | P0 | Same | create | Client cannot set code via DTO | gap | |
| RCPT-U-003 | unit | findOne NotFound | P0 | null | findOne | NotFoundException | gap | |
| RCPT-U-004 | unit | findOne with TRANSACTION relation | P1 | Entity | findOne | relations TRANSACTION | gap | |
| RCPT-U-005 | unit | findAll default pagination DESC | P1 | Mock | findAll({}) | page=1 limit=10 | gap | |
| RCPT-U-006 | unit | findAll custom page/limit | P2 | Mock | findAll page 3 limit 25 | skip=50 | gap | |
| RCPT-U-007 | unit | findIssued filters ISSUED only | P0 | Spy | findIssued | where ISSUED; deep relations | gap | |
| RCPT-U-008 | unit | update Object.assign no state machine | P0 | UNISSUED | update status ISSUED | Saved; no guard | gap | |
| RCPT-U-009 | unit | update allows reverse/VOIDED | P0 | ISSUED | update UNISSUED/VOIDED | Accepted | gap | money risk |
| RCPT-U-010 | unit | remove softRemove | P1 | Existing | remove | softRemove | gap | |
| RCPT-U-011 | unit | downloadReceipt 404 missing | P0 | No receipt | download | NotFoundException | gap | |
| RCPT-U-012 | unit | downloadReceipt 403 non-ISSUED | P0 | UNISSUED/VOIDED | download | ForbiddenException | gap | |
| RCPT-U-013 | unit | downloadReceipt PDF when ISSUED | P0 | ISSUED | download | Stub PDF bytes | gap | |
| RCPT-U-014 | unit | CreateReceiptDto required fields | P0 | validate | Empty/non-int | Fail | gap | |
| RCPT-U-015 | unit | CreateReceiptDto RC_STATUS enum | P0 | validate | Invalid status | Fail IsEnum | gap | |
| RCPT-U-016 | unit | CreateReceiptDto RC_ISSUED_AT date | P2 | validate | Bad date | Fail | gap | |
| RCPT-U-017 | unit | UpdateReceiptDto PartialType | P1 | validate | Partial patch | Valid | gap | |
| RCPT-U-018 | unit | Tax/profile fields absent from DTOs | P0 | whitelist pipe | Body with tax fields | Stripped/forbidden | gap | sync in transactions |
| RCPT-I-001 | integration | POST /receipts FINANCE creates + verify code | P0 | FINANCE JWT | POST | 201; 16-char code; UNISSUED | gap | |
| RCPT-I-002 | integration | POST can create already ISSUED | P1 | FINANCE | POST status 1 | Persisted ISSUED | gap | |
| RCPT-I-003 | integration | POST rejects non-FINANCE | P0 | USER JWT | POST | 403 | gap | |
| RCPT-I-004 | integration | CRUD without JWT → 401 | P0 | No auth | Hit routes | 401 | gap | |
| RCPT-I-005 | integration | GET /receipts paginates | P1 | Seed ≥2 | GET page/limit | 200 paginated | gap | |
| RCPT-I-006 | integration | GET /receipts/issued only ISSUED | P0 | Mix statuses | GET issued | Only ISSUED | gap | |
| RCPT-I-007 | integration | GET /:id 200 / 404 | P1 | Known/missing | GET | 200/404 | gap | |
| RCPT-I-008 | integration | PATCH UNISSUED→ISSUED | P0 | UNISSUED | PATCH status 1 | DB ISSUED | gap | |
| RCPT-I-009 | integration | PATCH invalid status → 400 | P1 | FINANCE | Bad body | 400 | gap | |
| RCPT-I-010 | integration | DELETE soft-delete | P1 | Existing | DELETE then GET | 404; soft DELETED_AT | gap | |
| RCPT-I-011 | integration | GET download ISSUED → PDF headers | P0 | ISSUED; any JWT | GET download | PDF Content-Type | gap | no @Roles |
| RCPT-I-012 | integration | Download UNISSUED/VOIDED 403; missing 404 | P0 | Matching | GET download | 403/404 | gap | |
| RCPT-I-013 | integration | Download without JWT → 401 | P0 | No token | GET download | 401 | gap | |
| RCPT-I-014 | integration | limit >100 rejected | P2 | FINANCE | GET limit=101 | 400 | gap | |
| RCPT-I-015 | integration | RC_VERIFY_CODE unique constraint | P0 | Force duplicate | Second insert | Unique violation | gap | |
| RCPT-I-016 | integration | API cannot mutate tax/profile | P0 | FINANCE | POST/PATCH tax fields | Ignored/400 | gap | |
| RCPT-E-001 | e2e | Finance issued receipt usage report | P1 | ISSUED rows | /admin/receipt-usage-report | List from GET issued | gap | |
| RCPT-E-002 | e2e | User downloads ISSUED PDF | P1 | ISSUED receipt | UI download | PDF; UNISSUED blocked | gap | |
| RCPT-E-003 | e2e | Non-finance blocked from admin receipt APIs | P2 | USER login | Admin/API | UI gated + 403 | gap | |
| RCPT-E-004 | e2e | Public verify receipt by code | P0 | ISSUED code | /verify/receipt/:code | Valid; UNISSUED not-found | n/a | verify module |

### voided-receipts

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VOID-U-001 | unit | create voids ISSUED receipt happy | P0 | ISSUED; no void; txn ok | create({RC_ID, reason}, userId) | Receipt VOIDED; txn RECEIPT_VOIDED; ERM CANCELLED; history REVERSAL | gap | |
| VOID-U-002 | unit | create whitespace-only reason | P0 | reason `   ` | create | BadRequestException | gap | |
| VOID-U-003 | unit | create trims reason | P1 | padded reason | create | VR_REASON trimmed | gap | |
| VOID-U-004 | unit | create receipt not found | P0 | Missing RC | create | NotFoundException | gap | |
| VOID-U-005 | unit | create reject UNISSUED | P0 | UNISSUED | create | BadRequestException | gap | |
| VOID-U-006 | unit | create reject already VOIDED status | P0 | VOIDED | create | BadRequestException | gap | |
| VOID-U-007 | unit | create Conflict when VOIDED_RECEIPT exists | P0 | Relation exists | create | ConflictException | gap | |
| VOID-U-008 | unit | create transaction missing | P0 | TRANSACTION null | create | NotFoundException | gap | |
| VOID-U-009 | unit | create reject txn REFUND | P0 | Status REFUND | create | ConflictException | gap | |
| VOID-U-010 | unit | create reject txn RECEIPT_VOIDED | P0 | Status RECEIPT_VOIDED | create | ConflictException | gap | |
| VOID-U-011 | unit | create history captures previous status | P1 | PAID txn | create | TSH_FROM prev → 8 | gap | |
| VOID-U-012 | unit | create enrollment missing still succeeds | P1 | No ERM | create | Void ok; no ERM save | gap | |
| VOID-U-013 | unit | create cancels enrollment when present | P0 | ERM exists | create | ERM CANCELLED | gap | |
| VOID-U-014 | unit | findOne with relations | P2 | Row exists | findOne | RECEIPT+USER | gap | |
| VOID-U-015 | unit | findOne not found | P2 | Missing | findOne | NotFoundException | gap | |
| VOID-U-016 | unit | findAll default pagination | P2 | Mock | findAll({}) | page 1 limit 10 | gap | |
| VOID-U-017 | unit | findAll custom pagination | P2 | page 2 limit 5 | findAll | skip 5 | gap | |
| VOID-U-018 | unit | DTO RC_ID required number | P1 | validate | Bad RC_ID | Fail | gap | |
| VOID-U-019 | unit | DTO VR_REASON required MinLength 1 | P1 | validate | Empty | Fail | gap | |
| VOID-U-020 | unit | DTO VR_REASON MaxLength 2000 | P1 | validate | 2001 chars | Fail | gap | |
| VOID-U-021 | unit | create runs in dataSource.transaction | P1 | Spy transaction | create | Inside TX callback | gap | |
| VOID-I-001 | integration | POST voids issued end-to-end | P0 | ISSUED+txn+ERM; FINANCE | POST | 201; all side effects | gap | |
| VOID-I-002 | integration | POST without JWT → 401 | P0 | No token | POST | 401 | gap | |
| VOID-I-003 | integration | POST non-FINANCE → 403 | P0 | Outside FINANCE_ROLES | POST | 403 | gap | |
| VOID-I-004 | integration | POST as STAFF allowed by API | P1 | STAFF JWT | POST | 201 | gap | UI excludes STAFF |
| VOID-I-005 | integration | POST as ADMIN/FINANCE | P0 | ADMIN/FINANCE | POST | 201 | gap | |
| VOID-I-006 | integration | POST invalid body → 400 | P1 | Bad DTO | POST | 400 | gap | |
| VOID-I-007 | integration | POST void twice → 409 | P0 | Already voided | Second POST | 409 | gap | |
| VOID-I-008 | integration | POST when txn REFUND → 409 | P0 | REFUND txn | POST | 409 | gap | |
| VOID-I-009 | integration | GET list paginated | P2 | FINANCE; rows | GET | 200 | gap | |
| VOID-I-010 | integration | GET /:id | P2 | Known VR_ID | GET | 200 | gap | |
| VOID-I-011 | integration | GET /:id unknown → 404 | P2 | Missing | GET | 404 | gap | |
| VOID-I-012 | integration | limit >100 rejected | P3 | FINANCE | GET limit 101 | 400 | gap | |
| VOID-E-001 | e2e | Finance voids receipt via UI | P0 | ISSUED; ADMIN/FINANCE | receipt-void-refund page | Success; voided | gap | |
| VOID-E-002 | e2e | UI blocks empty void reason | P1 | Dialog open | Confirm empty | Client error; no API | gap | |
| VOID-E-003 | e2e | Non-finance cannot open void page | P0 | Non ADMIN/FINANCE | Navigate | Denied/redirect | gap | |
| VOID-E-004 | e2e | After void actions none | P1 | After E-001 | Reload search | canVoid/canRefund false | gap | |
| VOID-E-005 | e2e | Void API failure notify | P2 | Already voided | Confirm | Error notify | gap | |

### bank-reconciles

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BR-U-001 | unit | Import rejects missing file | P1 | Mock | importFile(undefined) | BadRequestException | gap | |
| BR-U-002 | unit | Import rejects non csv/xlsx/xls | P1 | .pdf file | importFile | BadRequestException | gap | |
| BR-U-003 | unit | Import skips invalid rows | P1 | Valid+invalid CSV | importFile | invalidSkipped≥1 | gap | |
| BR-U-004 | unit | Import truncates fields to 20 chars | P2 | Long cells | importFile | Sliced to 20 | gap | |
| BR-U-005 | unit | In-file duplicate aborts entire import | P0 | Dup CSV rows | importFile | imported 0; no save | yes | |
| BR-U-006 | unit | Existing import key hash aborts import | P0 | DB hash match | importFile | imported 0 | yes | |
| BR-U-007 | unit | Successful import stores SHA-256 hash | P0 | Unique row | importFile | BR_IMPORT_KEY_HASH set | yes | |
| BR-U-008 | unit | Amount comma strip + NaN invalid | P2 | 1,500.50 / abc | import | Accept / invalidSkipped | gap | |
| BR-U-009 | unit | buildVerifyMatches amount equal → MATCH | P0 | Equal cents | verify path | MATCH | gap | |
| BR-U-010 | unit | buildVerifyMatches unequal → MISSING | P0 | Amounts differ | verify path | MISSING still linked | gap | |
| BR-U-011 | unit | buildVerifyMatches skips null/dup BR | P1 | Bad rows | Build matches | First valid only | gap | |
| BR-U-012 | unit | getChangeReason REF1/REF2/BOTH/null | P2 | Snapshots | getChangeReason | Correct reason | yes | |
| BR-U-013 | unit | updateRefs rejects blank BR_REF1 | P1 | Existing BR | updateRefs blank | BadRequestException | gap | |
| BR-U-014 | unit | updateRefs rematch equal → MATCH | P0 | Prior linked; new equal | updateRefs | Unmatch old; MATCH new | gap | |
| BR-U-015 | unit | updateRefs rematch unequal → MISSING | P0 | Amounts differ | updateRefs | MISSING linked | gap | |
| BR-U-016 | unit | matchRefs empty returns [] | P2 | Empty refs | matchRefs | [] | gap | |
| BR-U-017 | unit | confirmPayment empty → no-op | P2 | [] | confirmPayment | updated 0 | gap | |
| BR-U-018 | unit | confirmPayment blocks REFUND/RECEIPT_VOIDED | P0 | Status 7/8 | confirmPayment | BadRequest; rollback | gap | |
| BR-U-019 | unit | confirmPayment APPROVED+MATCH+issue+ERM+history | P0 | Valid tranx+receipt | confirmPayment | Bulk issue ISSUED; ERM PAID | gap | |
| BR-U-020 | unit | getTestExportRows maps + truncates | P2 | Fee>0; paidAt | getTestExportRows | BKK datetime; payer≤20 | yes | |
| BR-U-021 | unit | getTestExportRows fee≤0 / missing exam | P2 | Bad exam | getTestExportRows | BadRequest/NotFound | yes | |
| BR-I-001 | integration | POST import persists + CREATED_BY | P0 | FINANCE; unique CSV | Multipart | 201; hashes | gap | |
| BR-I-002 | integration | POST verify joins refs updates in TX | P0 | Unmatched BR+ref | POST verify | MATCH/MISSING side effects | gap | |
| BR-I-003 | integration | PATCH refs unmatch/rematch + edit log | P0 | Linked BR | PATCH refs | Soft TX; edit log | gap | |
| BR-I-004 | integration | POST match query-only | P1 | Seeded refs | POST match | Rows; no BR mutation | gap | |
| BR-I-005 | integration | POST confirm-payment bulk issues atomically | P0 | Matched tranx | POST confirm | Commit all or 400 none | gap | |
| BR-I-006 | integration | DELETE soft-deletes all | P1 | Multiple BRs | DELETE | DELETED_AT | gap | |
| BR-I-007 | integration | Authz FINANCE_ROLES only | P0 | anon/APPLICANT/FINANCE | Hit routes | 401/403/2xx | gap | |
| BR-I-008 | integration | DTO validation verify/refs/export | P1 | Invalid bodies | POST/PATCH/GET | 400 | gap | |
| BR-E-001 | e2e | Finance upload→verify match statuses | P0 | Finance; unpaid refs | payment-import UI | MATCH/MISSING | gap | |
| BR-E-002 | e2e | Finance edit refs rematches | P1 | Mismatched REF | Edit save | Unmatch/rematch | gap | |
| BR-E-003 | e2e | Finance confirm payment issues receipts | P0 | Verified matched | Confirm dialog | Receipts issued | gap | |
| BR-E-004 | e2e | Non-finance blocked from payment import | P1 | Applicant | Navigate/API | Blocked/403 | gap | |

### payment-configs

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PCFG-U-001 | unit | create maps DTO → save | P0 | Mock repo | create | create+save | gap | |
| PCFG-U-002 | unit | findAll returns find() | P1 | Mock | findAll | No custom filters | gap | |
| PCFG-U-003 | unit | findOne with TRANSACTIONS | P0 | Entity | findOne | relations | gap | |
| PCFG-U-004 | unit | findOne NotFound | P0 | null | findOne | NotFoundException | gap | |
| PCFG-U-005 | unit | update then re-fetch | P0 | Exists | update | update+findOne | gap | |
| PCFG-U-006 | unit | update missing → NotFound | P0 | null | update | NotFound; no update | gap | |
| PCFG-U-007 | unit | remove softRemove | P0 | Entity | remove | softRemove | gap | |
| PCFG-U-008 | unit | remove missing → NotFound | P1 | null | remove | NotFound | gap | |
| PCFG-U-009 | unit | Create DTO required strings | P0 | validate | Omit name/codes | Fail | gap | |
| PCFG-U-010 | unit | Create DTO MaxLength | P1 | validate | Overlong | Fail | gap | |
| PCFG-U-011 | unit | Create DTO PC_IS_ACTIVE required bool | P0 | validate | Omit / true/false | Fail / pass | gap | no fee amount in module |
| PCFG-U-012 | unit | Create DTO EFFECTIVE_FROM required ISO | P0 | validate | Missing/bad | Fail | gap | |
| PCFG-U-013 | unit | Create DTO EFFECTIVE_TO optional | P1 | validate | Omit/invalid/valid | OK/fail/OK | gap | |
| PCFG-U-014 | unit | UpdatePaymentConfigDto PartialType | P2 | validate | {} / partial | Valid | gap | |
| PCFG-I-001 | integration | POST creates row (FINANCE) | P0 | finance JWT | POST | 201; DB row | gap | |
| PCFG-I-002 | integration | GET lists configs | P1 | Seeded | GET | 200; soft-deleted excluded | gap | |
| PCFG-I-003 | integration | GET /:id with TRANSACTIONS | P1 | Seeded ± txn | GET | 200 + relation | gap | |
| PCFG-I-004 | integration | GET /:id unknown → 404 | P0 | finance | GET missing | 404 | gap | |
| PCFG-I-005 | integration | PATCH updates fields | P0 | Existing | PATCH | 200; DB updated | gap | |
| PCFG-I-006 | integration | DELETE soft-delete excluded | P0 | Existing | DELETE then GET | Soft-deleted; 404 | gap | |
| PCFG-I-007 | integration | Soft-delete with FK transaction | P1 | Config+txn | DELETE | Soft delete OK | gap | |
| PCFG-I-008 | integration | ValidationPipe rejects bad create | P0 | finance | Bad POST | 400 | gap | |
| PCFG-I-009 | integration | ParseIntPipe non-int :id | P2 | finance | GET abc | 400 | gap | |
| PCFG-I-010 | integration | Unauthenticated → 401 | P0 | No JWT | Any route | 401 | gap | |
| PCFG-I-011 | integration | Non-FINANCE → 403 | P0 | candidate etc | Mutate/list | 403 | gap | |
| PCFG-I-012 | integration | ADMIN/FINANCE/STAFF allowed | P0 | Each role | GET | 200 | gap | |
| PCFG-I-013 | integration | Persist EFFECTIVE_TO null | P1 | finance | POST omit TO | NULL stored | gap | |
| PCFG-I-014 | integration | Deactivate PC_IS_ACTIVE false | P0 | Active | PATCH false | DB false | gap | |
| PCFG-I-015 | integration | Accepts TO < FROM (current) | P1 | finance | POST FROM>TO | 201 — no range check | gap | risk |
| PCFG-I-016 | integration | Duplicate COMP/PROD codes allowed | P2 | Same codes | POST again | 201 — no unique | gap | |
| PCFG-E-001 | e2e | Finance CRUD lifecycle via API | P1 | finance; no UI | Create→list→patch→delete | Full HTTP lifecycle | gap | API-only |
| PCFG-E-002 | e2e | Finance mutates; candidate blocked | P0 | Two users | Finance create; candidate GET | 2xx / 403 | gap | |
| PCFG-E-003 | e2e | Deactivate then soft-delete | P1 | Active config | PATCH false then DELETE | Inactive then 404 | gap | |

## Notes / risks flagged for Bug Log later (Batch 2)

- TXN-U-025: `createPendingPayment` name says pending but sets PAID/MATCH
- RCPT-U-008/009: receipts module has no UNISSUED→ISSUED state machine
- RCPT-I-011: download has JWT but no `@Roles` (any authenticated role)
- VOID API allows STAFF; UI route ADMIN|FINANCE only
- BR confirmPayment bulk issues receipts without setting `RC_ISSUED_AT` (flagged in receipts notes)
- PCFG: no fee amount; no FROM≤TO validation; duplicate COMP/PROD codes allowed

## Next gate

Phase 5 Batch 2 E2E **done** (15 passed / 1 skipped BUG-005).  
**Batch 2 complete.**  
รอ confirm ก่อน Batch 3 Phase 2: `test-case-analyst` (exam-enrollments → exam-vouchers → exam-rule-vouchers → fund-sources).  
Phase 6 Business Flow Test Report ยังไม่เริ่ม (ขั้นตอนสุดท้ายหลัง batch หลัก)
