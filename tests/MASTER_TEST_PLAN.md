# Master Test Plan

รวม Test Case Matrix จากทุก batch (Phase 2+)

## Cumulative counts

| Level | Batch 1 | Batch 2 | Batch 3 | Batch 4 | Batch 5 | Batch 6 | Batch 7 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| unit | 99 | 112 | 95 | 28 | 37 | 19 | 10 | 400 |
| integration | 61 | 66 | 40 | 21 | 25 | 17 | 7 | 237 |
| e2e | 13 | 20 | 15 | 7 | 9 | 5 | 3 | 72 |
| **all** | **173** | **198** | **150** | **56** | **71** | **41** | **20** | **709** |

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

### Batch 3 breakdown

| Module | Unit | Integration | E2E | Total |
|---|---:|---:|---:|---:|
| exam-enrollments | 50 | 12 | 6 | 68 |
| exam-vouchers | 19 | 10 | 3 | 32 |
| exam-rule-vouchers | 8 | 6 | 3 | 17 |
| fund-sources | 18 | 12 | 3 | 33 |

### Batch 4 breakdown

| Module | Unit | Integration | E2E | Total |
|---|---:|---:|---:|---:|
| exam | 6 | 4 | 2 | 12 |
| exam-sessions | 3 | 3 | 1 | 7 |
| exam-locations | 4 | 3 | 1 | 8 |
| exam-session-locations | 5 | 4 | 1 | 10 |
| exam-location-seats | 6 | 4 | 1 | 11 |
| exam-blocked-seats | 4 | 3 | 1 | 8 |

### Batch 5 breakdown

| Module | Unit | Integration | E2E | Total |
|---|---:|---:|---:|---:|
| exam-scores | 10 | 7 | 2 | 19 |
| score-criteria | 7 | 4 | 2 | 13 |
| score-rubrics | 9 | 6 | 2 | 17 |
| exam-certificates | 11 | 8 | 3 | 22 |

### Batch 6 breakdown

| Module | Unit | Integration | E2E | Total |
|---|---:|---:|---:|---:|
| user-profile | 11 | 8 | 3 | 22 |
| user-image | 3 | 4 | 1 | 8 |
| profile-edit-history | 5 | 5 | 1 | 11 |
| thaid | — | — | — | **deferred/cut** |

**Batch 6 active (no THAID; P1 cuts applied):** U19 / I17 / E5 = **41**

Cuts / deferred:
- Entire `THAID-*` deferred
- `PROF-U-012`, `IMG-U-004`, `PEH-U-006`, `PEH-E-002` cut (low ROI / duplicate P0)

### Batch 7 breakdown (slim — exam-report only)

| Module | Unit | Integration | E2E | Total |
|---|---:|---:|---:|---:|
| exam-report | 10 | 7 | 3 | 20 |
| moodle / moodle-sync-logs / page-builder | — | — | — | **cut** |
| platform-gateway | — | — | — | **cut** |
| transaction-refs / profiles / status-history | — | — | — | **cut** |

**Batch 7 slim:** U10 / I7 / E3 = **20**

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

---

## Batch 3 — Enrollment & Voucher

### exam-enrollments

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ENR-U-001 | unit | create regular → UNPAID | P0 | Window open; capacity OK; not SPECIAL | create | UNPAID enrollment | gap | |
| ENR-U-002 | unit | create SPECIAL → PAID + passcode log | P0 | SPECIAL; valid passcode | create+PASSCODE | PAID; ExamPasscodeLog | gap | |
| ENR-U-003 | unit | create SPECIAL without PASSCODE | P0 | SPECIAL | create omit passcode | BadRequest | gap | |
| ENR-U-004 | unit | create SPECIAL invalid PASSCODE | P0 | SPECIAL; bad passcode | create | BadRequest | gap | |
| ENR-U-005 | unit | create registration not open | P0 | window not_open | create | REGISTRATION_NOT_OPEN | gap | |
| ENR-U-006 | unit | create registration closed | P0 | window closed | create | REGISTRATION_CLOSED | gap | |
| ENR-U-007 | unit | create exam started | P0 | window exam_started | create | EXAM_STARTED | gap | |
| ENR-U-008 | unit | create window invalid | P1 | window invalid | create | REGISTRATION_CLOSED | gap | |
| ENR-U-009 | unit | create FULL no sister capacity | P0 | At capacity; sisters full | create | FULL | gap | |
| ENR-U-010 | unit | create overflow → sister session | P0 | Full; sister has capacity | create | SESSION_ID rewritten | gap | |
| ENR-U-011 | unit | create duplicate active same slot | P0 | Existing active same time | create | Conflict | gap | |
| ENR-U-012 | unit | create session not found | P1 | Bad SESSION_ID | create | NotFound | gap | |
| ENR-U-013 | unit | create user not found | P1 | Bad USER_ID | create | NotFound | gap | |
| ENR-U-014 | unit | PHYSICAL_STATUS ทั่วไป → ชาวไทย when no passport | P2 | Special physical status | create with PHYSICAL_STATUS `ไม่มีข้อมูลข้างต้น` (no passport) | `ERM_PHYSICAL_STATUS` = `ชาวไทย` | yes | spot-check vs service.spec |
| ENR-U-015 | unit | validatePasscode SPECIAL success | P0 | Matching passcode | validatePasscode | void ok | gap | |
| ENR-U-016 | unit | validatePasscode non-SPECIAL no-op | P1 | Not SPECIAL | validatePasscode | No check | gap | |
| ENR-U-017 | unit | validatePasscode invalid | P0 | Bad passcode | validatePasscode | BadRequest | gap | |
| ENR-U-018 | unit | checkIn eligible → ATTENDED | P0 | PAID/seat statuses | checkIn | ATTENDED + time | gap | |
| ENR-U-019 | unit | checkIn with explicit timestamp | P1 | Eligible | checkIn+DTO time | Uses provided Date | gap | |
| ENR-U-020 | unit | checkIn rejects UNPAID | P0 | UNPAID | checkIn | BadRequest | gap | |
| ENR-U-021 | unit | checkIn rejects CANCELLED | P0 | CANCELLED | checkIn | BadRequest | gap | |
| ENR-U-022 | unit | checkIn not found | P1 | Missing id | checkIn | NotFound | gap | |
| ENR-U-023 | unit | update admin PAID+seat → SEAT_ASSIGNED | P0 | Admin; set seat on PAID | update | SEAT_ASSIGNED | gap | |
| ENR-U-024 | unit | update admin clear seat → PAID | P1 | SEAT_ASSIGNED | clear seat | PAID | gap | |
| ENR-U-025 | unit | candidate cancel own UNPAID | P0 | Own UNPAID | PATCH CANCELLED | Success | gap | |
| ENR-U-026 | unit | candidate cancel non-UNPAID rejected | P0 | Own PAID | Cancel | BadRequest | gap | |
| ENR-U-027 | unit | candidate forbidden non-cancel fields | P0 | Own | PATCH other fields | Forbidden | gap | |
| ENR-U-028 | unit | candidate forbidden other user | P0 | Other's ERM | update | Forbidden | gap | |
| ENR-U-029 | unit | seat duplicate Conflict | P0 | Seat taken | assign same | Conflict | gap | |
| ENR-U-030 | unit | seat label requires SL_ID | P1 | Label only | update | BadRequest | gap | |
| ENR-U-031 | unit | seat SL_ID requires label | P1 | SL_ID only | update | BadRequest | gap | |
| ENR-U-032 | unit | seat SL not in session | P1 | Wrong SL | update | BadRequest | gap | |
| ENR-U-033 | unit | seat edit blocked VOUCHER_SENT | P0 | Session ≥ VOUCHER_SENT | bulk/update seat | Conflict | yes | |
| ENR-U-034 | unit | seat edit blocked SEAT_PUBLISHED | P0 | Enrollment ≥ SEAT_PUBLISHED | bulkAssign | Conflict | yes | |
| ENR-U-035 | unit | seat edit blocked has VOUCHERS | P0 | VOUCHERS.length>0 | bulk/update | Conflict | yes | |
| ENR-U-036 | unit | bulkAssignSeats happy path | P0 | Valid; editable | bulkAssignSeats | SEAT_ASSIGNED; session SEAT_ALLOCATED | yes | |
| ENR-U-037 | unit | bulkAssign duplicate ermId | P1 | Dup ermId | bulkAssign | BadRequest | gap | |
| ENR-U-038 | unit | bulkAssign duplicate seat in request | P1 | Dup seat | bulkAssign | Conflict | gap | |
| ENR-U-039 | unit | bulkAssign enrollment not in sessionIds | P1 | Wrong session | bulkAssign | BadRequest | gap | |
| ENR-U-040 | unit | bulkAssign SL wrong session | P1 | SL mismatch | bulkAssign | BadRequest | gap | |
| ENR-U-041 | unit | bulkAssign missing enrollment/session | P1 | Bad IDs | bulkAssign | NotFound | gap | |
| ENR-U-042 | unit | allocateSeats PAID → SEAT_ASSIGNED | P1 | Paid rows | allocateSeats | All PAID → SEAT_ASSIGNED | gap | |
| ENR-U-043 | unit | allocateSeats none paid | P2 | No PAID | allocateSeats | NotFound | gap | |
| ENR-U-044 | unit | requestFix WAIT_FIXED + email | P1 | Enrollment+email | requestFix | WAIT_FIXED; sendEmail | gap | |
| ENR-U-045 | unit | requestFix no email still success | P2 | No email | requestFix | success true | gap | |
| ENR-U-046 | unit | cron cancel unpaid >30m | P1 | Old UNPAID | cron handler | → CANCELLED | gap | |
| ENR-U-047 | unit | findAll default pagination | P2 | Mock | findAll | defaults DESC | yes | |
| ENR-U-048 | unit | findOne missing | P2 | Bad id | findOne | NotFound | gap | |
| ENR-U-049 | unit | findExecutiveTestTakers ATTENDED only | P2 | Mix statuses | findExecutive… | ATTENDED only | gap | |
| ENR-U-050 | unit | findExamHistory ATTENDED rounds | P2 | Mixed | findExamHistory… | ATTENDED history | gap | |
| ENR-I-001 | integration | POST create persists rules | P0 | Open session | POST | 201; capacity/window/dup | gap | |
| ENR-I-002 | integration | POST validate-passcode SPECIAL | P0 | SPECIAL passcode | POST | valid/400 | gap | |
| ENR-I-003 | integration | POST check-in ENROLLMENT_ADMIN only | P0 | Roles | POST check-in | 403 vs ATTENDED | gap | |
| ENR-I-004 | integration | PATCH bulk-seat-assignments | P0 | Admin seats | Bulk assign | TX + unique seat | gap | |
| ENR-I-005 | integration | GET user/:id assertSelfOrRoles | P0 | A vs B | GET | 403/200 | gap | |
| ENR-I-006 | integration | GET findAll admin only | P1 | Candidate | GET list | 403 | gap | |
| ENR-I-007 | integration | GET executive EXECUTIVE only | P1 | Non-exec | GET executive | 403 | gap | |
| ENR-I-008 | integration | PATCH candidate cancel vs admin | P0 | UNPAID | Cancel/seat | OK paths | gap | |
| ENR-I-009 | integration | DELETE softRemove | P2 | Admin | DELETE | soft delete | gap | |
| ENR-I-010 | integration | POST match-import | P2 | Refs | POST | Matched array | gap | |
| ENR-I-011 | integration | GET exam/:id filters/totalPaid | P1 | Mix statuses | GET | Excludes CANCELLED | gap | |
| ENR-I-012 | integration | Create DTO validation | P2 | Bad body | POST | 400 | n/a | |
| ENR-E-001 | e2e | Candidate register regular exam | P0 | Open exam | UI register | UNPAID in history | gap | |
| ENR-E-002 | e2e | Special exam passcode enroll | P0 | SPECIAL | Passcode→enroll | Paid | gap | |
| ENR-E-003 | e2e | Candidate cancel unpaid | P1 | Own UNPAID | History cancel | CANCELLED | gap | |
| ENR-E-004 | e2e | Admin bulk seat assign | P0 | Paid; editable | Seat UI | Seats; voucher blocks | gap | |
| ENR-E-005 | e2e | Admin attendance check-in | P0 | Eligible | Check-in dialog | ATTENDED | gap | |
| ENR-E-006 | e2e | Executive exam history | P2 | ATTENDED | Executive pages | History shown | gap | |

### exam-vouchers

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| VOUCH-U-001 | unit | bulkIssue empty ermIds short-circuit | P0 | — | bulkIssue [] | success 0; no TX | yes | |
| VOUCH-U-002 | unit | bulkIssue SEAT_ASSIGNED→PUBLISHED + VOUCHER_SENT | P0 | Test-taker; SEAT_ASSIGNED | bulkIssue | Vouchers; session VOUCHER_SENT | yes | |
| VOUCH-U-003 | unit | bulkIssue idempotent existing voucher | P0 | Already issued | bulkIssue again | No dup save | yes | |
| VOUCH-U-004 | unit | bulkIssue reject missing test-taker | P0 | Null test-taker | bulkIssue | BadRequest | yes | |
| VOUCH-U-005 | unit | bulkIssue unknown ermIds empty success | P1 | Bad ids | bulkIssue | success 0 | gap | |
| VOUCH-U-006 | unit | bulkIssue only SEAT_ASSIGNED change status | P0 | Mix statuses | bulkIssue | Count = ASSIGNED only | gap | |
| VOUCH-U-007 | unit | bulkIssue derive sessionIds | P1 | No sessionIds | bulkIssue | Distinct sessions | gap | |
| VOUCH-U-008 | unit | bulkIssue no downgrade ≥ VOUCHER_SENT | P0 | Session already sent | bulkIssue | Session unchanged | gap | |
| VOUCH-U-009 | unit | bulkIssue emails fire-and-forget | P1 | Mix emails | bulkIssue | Success; email optional | gap | |
| VOUCH-U-010 | unit | createFromEnrollment NotFound | P0 | Missing ERM | createFromEnrollment | NotFound | gap | |
| VOUCH-U-011 | unit | createFromEnrollment missing test-taker | P0 | No test-taker | createFromEnrollment | BadRequest | gap | |
| VOUCH-U-012 | unit | createFromEnrollment SEAT_ASSIGNED→PUBLISHED | P0 | Valid | createFromEnrollment | Voucher; no session VOUCHER_SENT | gap | |
| VOUCH-U-013 | unit | createFromEnrollment idempotent | P0 | Exists | createFromEnrollment | Same voucher | gap | |
| VOUCH-U-014 | unit | generateVoucherCode format | P2 | Via create | create | VC-YYYY-erm-#### | gap | |
| VOUCH-U-015 | unit | sendVoucherEmail success fire-forget | P1 | Valid DTO | sendVoucherEmail | {success:true} | gap | |
| VOUCH-U-016 | unit | findOne NotFound | P1 | Missing | findOne | NotFound | gap | |
| VOUCH-U-017 | unit | update merge save | P2 | Exists | update | Merged | gap | |
| VOUCH-U-018 | unit | remove softRemove | P1 | Exists | remove | softRemove | gap | |
| VOUCH-U-019 | unit | create manual DTO as-is | P2 | Valid | create | Persists code | gap | bypasses rules |
| VOUCH-I-001 | integration | POST bulk-issue atomic | P0 | JWT; SEAT_ASSIGNED | POST bulk-issue | DB published+vouchers+session | gap | |
| VOUCH-I-002 | integration | POST enrollment/:ermId issue | P0 | SEAT_ASSIGNED | POST | Voucher; seat published | gap | |
| VOUCH-I-003 | integration | POST enrollment idempotent | P1 | Issued | POST twice | Same code | gap | |
| VOUCH-I-004 | integration | bulk-issue 400 missing test-taker | P0 | No test-taker | POST | 400; no mutation | gap | |
| VOUCH-I-005 | integration | DTO validation 400 | P1 | Bad bodies | POST | 400 | gap | |
| VOUCH-I-006 | integration | Unauthenticated 401 | P0 | No JWT | Routes | 401 | gap | |
| VOUCH-I-007 | integration | Any authenticated role allowed | P0 | Candidate JWT | Mutate | 2xx if other OK | gap | no @Roles |
| VOUCH-I-008 | integration | DELETE soft-delete | P1 | Exists | DELETE | Soft; 404 after | gap | |
| VOUCH-I-009 | integration | POST send-ticket | P2 | Valid | POST | {success:true} | gap | |
| VOUCH-I-010 | integration | ParseIntPipe non-int | P2 | Bad :id | GET/PATCH | 400 | gap | |
| VOUCH-E-001 | e2e | Admin bulk issue tickets UI | P0 | Seat-assigned ready | Seat candidates issue | Published; voucher preview | gap | |
| VOUCH-E-002 | e2e | Candidate view/print ticket | P1 | Issued | Candidate UI | Code/seat visible | gap | |
| VOUCH-E-003 | e2e | Re-issue already issued | P2 | Issued | Issue again | Idempotent UI | gap | |

### exam-rule-vouchers

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ERV-U-001 | unit | getRegulations empty when no rows | P0 | find [] | getRegulations | empty strings | gap | |
| ERV-U-002 | unit | getRegulations maps latest row | P0 | One row | getRegulations | EN/TH mapped | gap | |
| ERV-U-003 | unit | getRegulations null → empty | P1 | Null content | getRegulations | '' | gap | |
| ERV-U-004 | unit | getRegulations order DESC take 1 | P1 | Spy find | getRegulations | order+take | gap | |
| ERV-U-005 | unit | saveRegulations updates latest | P0 | Existing | saveRegulations | save; no create | gap | |
| ERV-U-006 | unit | saveRegulations creates when empty | P0 | [] | saveRegulations | create+save | gap | |
| ERV-U-007 | unit | saveRegulations echoes DTO | P1 | Either path | save | Returns dto values | gap | |
| ERV-U-008 | unit | saveRegulations only latest of many | P1 | Many rows | save | Only latest saved | gap | |
| ERV-I-001 | integration | GET regulations 401 no JWT | P0 | No auth | GET | 401 | gap | |
| ERV-I-002 | integration | PUT regulations 401 no JWT | P0 | No auth | PUT | 401 | gap | |
| ERV-I-003 | integration | PUT validation 400 | P0 | JWT; bad body | PUT | 400 | gap | |
| ERV-I-004 | integration | GET returns persisted | P0 | Seeded; JWT | GET | 200 content | gap | |
| ERV-I-005 | integration | PUT create then GET | P0 | Empty; JWT | PUT→GET | Match; 1 row | gap | |
| ERV-I-006 | integration | PUT updates same row | P0 | One row | PUT twice | Still 1 row | gap | |
| ERV-E-001 | e2e | Admin save regulations UI | P0 | Admin login | test-voucher-management | Saved on reload | gap | |
| ERV-E-002 | e2e | Non-allowed role blocked page | P1 | Examinee | Navigate | Deny | gap | API no @Roles |
| ERV-E-003 | e2e | Regulations on voucher preview | P1 | Saved regs | Preview | Match admin text | gap | |

### fund-sources

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FUND-U-001 | unit | create persists DTO | P0 | Mock | create | create+save | gap | |
| FUND-U-002 | unit | create omits FS_OPEN_STATUS | P1 | No status | create | DB default true | gap | |
| FUND-U-003 | unit | findAll returns find() | P0 | Mock | findAll | List | gap | |
| FUND-U-004 | unit | findOne exists | P0 | Entity | findOne | Entity | gap | |
| FUND-U-005 | unit | findOne NotFound | P0 | null | findOne | NotFound | gap | |
| FUND-U-006 | unit | update merge save | P0 | Exists | update | Saved | gap | |
| FUND-U-007 | unit | update NotFound | P0 | Missing | update | NotFound | gap | |
| FUND-U-008 | unit | remove softRemove | P0 | Exists | remove | softRemove | gap | |
| FUND-U-009 | unit | remove NotFound | P0 | Missing | remove | NotFound | gap | |
| FUND-U-010 | unit | DTO empty account code | P0 | validate | empty code | Fail | gap | |
| FUND-U-011 | unit | DTO account code MaxLength 50 | P1 | 51 chars | validate | Fail | gap | |
| FUND-U-012 | unit | DTO empty name | P0 | validate | empty name | Fail | gap | |
| FUND-U-013 | unit | DTO name MaxLength 255 | P1 | 256 chars | validate | Fail | gap | |
| FUND-U-014 | unit | DTO non-boolean open status | P1 | string | validate | Fail | gap | |
| FUND-U-015 | unit | UpdateFundSourceDto partial | P1 | Partial | validate | Pass | gap | |
| FUND-U-016 | unit | getDailyRevenue map index+sum | P0 | Raw rows | getDailyRevenue | index 1..n; total | gap | |
| FUND-U-017 | unit | getDailyRevenue status filters | P0 | Spy QB | getDailyRevenue | APPROVED + active ERM | gap | |
| FUND-U-018 | unit | getDailyRevenue date/exam filters | P1 | Query filters | getDailyRevenue | Applied | gap | |
| FUND-I-001 | integration | POST create FINANCE | P0 | FINANCE JWT | POST | 201 | gap | |
| FUND-I-002 | integration | POST invalid 400 | P0 | Bad body | POST | 400 | gap | |
| FUND-I-003 | integration | Mutate forbidden non-FINANCE | P0 | Other roles | POST/PATCH/DELETE | 403 | gap | |
| FUND-I-004 | integration | Unauthenticated 401 | P0 | No JWT | Routes | 401 | gap | |
| FUND-I-005 | integration | GET list read roles | P0 | REG/EXAM_OPS | GET | 200 | gap | |
| FUND-I-006 | integration | GET :id 200/404 | P0 | Exists/missing | GET | 200/404 | gap | |
| FUND-I-007 | integration | GET non-int :id 400 | P1 | abc | GET | 400 | gap | |
| FUND-I-008 | integration | PATCH FINANCE | P0 | Exists | PATCH | 200 | gap | |
| FUND-I-009 | integration | DELETE soft-delete | P0 | Exists | DELETE | Soft; 404 | gap | |
| FUND-I-010 | integration | daily-revenue FINANCE only | P0 | REG vs FINANCE | GET daily-revenue | 403 vs 200 | gap | |
| FUND-I-011 | integration | daily-revenue sums approved | P0 | Seeded txs | GET | Correct total | gap | |
| FUND-I-012 | integration | daily-revenue date/exam filters | P1 | Seeded | Query | Filtered | gap | |
| FUND-E-001 | e2e | Finance fund-source CRUD UI | P0 | Finance login | CRUD page | Reflects API | gap | |
| FUND-E-002 | e2e | Exam form loads fund options | P1 | Exam ops | Exam form | Dropdown populated | gap | |
| FUND-E-003 | e2e | Daily revenue report finance | P1 | Seeded payments | Report page | Rows+total | gap | |

## Notes / risks flagged for Bug Log later (Batch 3)

- VOUCH-I-007 / ERV: JWT without `@Roles` on some write paths (frontend gates only)
- ENR: voucher apply/issue not in enrollments — only seat-edit guards when vouchers exist
- FUND: daily-revenue DTO has unused receiptNo/payerName/payeeName fields
- ERV: bilingual regulations single-row upsert — not voucher eligibility

---

## Batch 4 — Exam lifecycle

### exam

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| EXAM-U-001 | unit | create normalizes reg/pay end-date to period end | P0 | Valid CreateExamDto with end dates | call create | `EXAM_REG_END_DATE`/`EXAM_PAY_END_DATE` normalized before save | gap | Date boundary rule |
| EXAM-U-002 | unit | create validates score-rubric usability | P0 | `SRB_ID` unusable | call create | reject from rubric guard | gap | Validation gate |
| EXAM-U-003 | unit | update blocks rubric change when scores exist | P0 | Existing exam with scores | call update with new `SRB_ID` | ConflictException | gap | State protection |
| EXAM-U-004 | unit | createPasscodes rejects missing ID/name pair | P0 | Passcode item missing pair fields | call createPasscodes | BadRequestException | gap | Input rule |
| EXAM-U-005 | unit | createPasscodes blocked when active enrollments exist | P0 | Non-cancelled enrollment exists | call createPasscodes | ConflictException | gap | Business lock |
| EXAM-U-006 | unit | notifyExamChanges returns success while dispatch async | P1 | Valid exam id + change set | call notifyExamChanges | `{success:true}` immediately | gap | Async side effect |
| EXAM-I-001 | integration | POST `/api/exam` persists even when Moodle sync fails | P0 | EXAM_ADMIN role; Moodle failure mocked | POST create | created successfully; request not failed by side effect | gap | Resilience |
| EXAM-I-002 | integration | PATCH `/api/exam/:id` rubric change conflict after score saved | P0 | Exam has score rows | PATCH with new `SRB_ID` | 409 conflict | gap | Transition safety |
| EXAM-I-003 | integration | POST `/api/exam/:id/passcodes` replaces old set atomically | P1 | Existing passcodes; no active enrollment | POST new passcodes | old deleted, new set persisted | gap | Replace semantics |
| EXAM-I-004 | integration | RBAC for exam mutate endpoints | P0 | allowed/disallowed JWT | hit create/update/delete/notify/passcodes | allowed 2xx, disallowed 403 | gap | `EXAM_ADMIN_ROLES` |
| EXAM-E-001 | e2e | Admin creates exam with sessions + room then publish | P0 | Admin login; room/fund/rubric ready | Fill create-exam form and save | exam + sessions + room links visible | gap | Cross-module happy path |
| EXAM-E-002 | e2e | Edit exam triggers notify-changes flow | P1 | Existing exam with enrolled users | Edit schedule/details and notify | UI success; notify endpoint accepted | gap | UX side effect |

### exam-sessions

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SES-U-001 | unit | create returns reloaded session with relations | P1 | Valid DTO | call create | return shape equals findOne(saved id) | gap | Service behavior |
| SES-U-002 | unit | findOne throws when session not found | P0 | Missing `SS_ID` | call findOne | NotFoundException | gap | Error path |
| SES-U-003 | unit | remove uses softRemove after existence check | P0 | Existing session | call remove | soft-delete called | gap | Soft-delete |
| SES-I-001 | integration | POST `/api/exam-sessions` validates and creates | P0 | Valid exam id + dates/capacity | POST | 201 persisted session | gap | Endpoint contract |
| SES-I-002 | integration | PATCH `/api/exam-sessions/:id` updates metadata | P1 | Existing session | PATCH start/end/capacity | 200 and DB updated | gap | Mutation flow |
| SES-I-003 | integration | DELETE `/api/exam-sessions/:id` soft delete behavior | P0 | Existing session | DELETE then GET/list | hidden from normal query | gap | Soft-delete verification |
| SES-E-001 | e2e | Edit exam removes one session keeps others | P1 | Exam has >1 session | remove slot in UI then save | removed slot gone, remaining intact | gap | Real flow |

### exam-locations

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LOC-U-001 | unit | createWithSeats generates rows*cols and labels by direction | P0 | Rows/cols + direction | call createWithSeats | seat count and labels/order correct | gap | Derived data |
| LOC-U-002 | unit | createWithSeats applies seatStatuses fallback AVAILABLE | P1 | Partial seat-status map | call createWithSeats | mapped seats override, others AVAILABLE | gap | Mapping rule |
| LOC-U-003 | unit | aisle positions normalize legacy/new fields and sort | P1 | mixed aisle payload | create/update location | normalized/sorted aisle positions | gap | Backward compatibility |
| LOC-U-004 | unit | findOne throws on unknown location | P0 | Missing id | call findOne | NotFoundException | gap | Error path |
| LOC-I-001 | integration | POST `/api/exam-locations/with-seats` transactional create | P0 | Valid payload | POST | location+seats committed together | gap | Transaction |
| LOC-I-002 | integration | GET `/api/exam-locations?includeSeats=true` embeds seats | P1 | Seeded location seats | GET includeSeats | seats returned with stable order | gap | API behavior |
| LOC-I-003 | integration | DELETE `/api/exam-locations/:id` soft-delete | P0 | Existing location | DELETE then GET | hidden by default query | gap | Soft-delete |
| LOC-E-001 | e2e | Admin creates location with seat map and reuses in exam form | P1 | Admin login | Create room in UI | room selectable in create-exam flow | gap | FE->BE integration |

### exam-session-locations

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SL-U-001 | unit | create rejects missing location | P0 | Invalid `LOCATION_ID` | call create | NotFoundException | gap | Validation |
| SL-U-002 | unit | create rejects missing session | P0 | Invalid `SS_ID` | call create | NotFoundException | gap | Validation |
| SL-U-003 | unit | create rejects session missing exam date/time | P0 | Session incomplete metadata | call create | BadRequestException | gap | Required metadata |
| SL-U-004 | unit | create rejects duplicate session-location pair | P0 | Existing same pair | call create | ConflictException | gap | Uniqueness |
| SL-U-005 | unit | overlap detection blocks same-room overlapping time | P0 | Same room/date overlapping slot | call create/update | ConflictException | gap | Core guard |
| SL-I-001 | integration | POST `/api/exam-session-locations` allows non-overlap | P0 | Same room/date non-overlap slots | POST links | both succeed | gap | Scheduling rule |
| SL-I-002 | integration | POST overlap returns conflict | P0 | Overlap scenario | POST second link | 409 conflict | gap | Collision |
| SL-I-003 | integration | PATCH rechecks overlap excluding self | P1 | Existing link update | PATCH with/without conflict | 409 on conflict, pass on self/no-conflict | gap | Update behavior |
| SL-I-004 | integration | DELETE soft-delete frees room for new link | P1 | Existing link | DELETE then POST same slot | new link succeeds | gap | Reuse after delete |
| SL-E-001 | e2e | Edit exam room assignment blocks overlapping reuse | P0 | Existing sessions same day | assign same room overlap in UI | backend conflict message shown | gap | High-value guard |

### exam-location-seats

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEAT-U-001 | unit | create rejects duplicate row/col in location | P0 | Seat already at row/col | call create | ConflictException | gap | Uniqueness |
| SEAT-U-002 | unit | create/update rejects duplicate seat label in location | P0 | Label already used | call create/update | ConflictException | gap | Label uniqueness |
| SEAT-U-003 | unit | generateSeats requires rows/cols configured | P0 | Location missing totals | call generateSeats | BadRequestException | gap | Validation |
| SEAT-U-004 | unit | generateSeats status precedence seatStatuses > brokenSeats > existing | P1 | Existing seats + mixed inputs | call generateSeats | final statuses follow precedence | gap | Decision logic |
| SEAT-U-005 | unit | generateSeats blocks shrinking if assigned seats removed | P0 | Out-of-range seats assigned | call generateSeats shrink | BadRequestException with seat labels | gap | Allocation safety |
| SEAT-U-006 | unit | generateSeats restores soft-deleted in-range seats | P1 | Soft-deleted seats in new range | call generateSeats | DELETED_AT cleared and seat restored | gap | Recovery behavior |
| SEAT-I-001 | integration | uniqueness constraints for row/col and label in location | P0 | duplicate insert attempts | POST duplicates | conflict/constraint failure | gap | DB-level guard |
| SEAT-I-002 | integration | POST `/api/exam-location-seats/generate/:locationId` atomic grid update | P0 | Existing grid | POST generate new dimensions | consistent full grid updated | gap | Transactional |
| SEAT-I-003 | integration | generate shrink with assigned seats fails without partial writes | P0 | Assigned seat would be removed | POST generate | fail and previous seats unchanged | gap | Atomicity |
| SEAT-I-004 | integration | DELETE seat soft-delete behavior | P1 | Existing seat | DELETE then list | seat hidden from normal list | gap | Soft-delete |
| SEAT-E-001 | e2e | Seat-management blocks save when paid users > usable seats | P0 | Insufficient usable seats | Open seat-management + save | error shown; no assignment persisted | gap | Capacity constraint |

### exam-blocked-seats

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BLOCK-U-001 | unit | replaceForSession soft-removes previous overrides first | P0 | Existing blocked rows | call replaceForSession | old rows soft-deleted then new set saved | gap | Replace semantics |
| BLOCK-U-002 | unit | replaceForSession empty list clears all overrides | P0 | Existing blocked rows | call replaceForSession with empty seats | returns empty and prior rows cleared | gap | Clear behavior |
| BLOCK-U-003 | unit | findOne throws when missing | P0 | Missing `BLOCK_ID` | call findOne | NotFoundException | gap | Error path |
| BLOCK-U-004 | unit | update mutates only requested fields | P1 | Existing override | call update only status | status updated; links unchanged | gap | Partial update |
| BLOCK-I-001 | integration | POST `/api/exam-blocked-seats/session/:sessionId/replace` all-or-nothing | P0 | Valid multi-seat payload | POST replace | full success or rollback | gap | Tx consistency |
| BLOCK-I-002 | integration | GET with `sessionId` filters target session only | P1 | Multiple sessions blocked | GET query | only target rows returned | gap | Filter behavior |
| BLOCK-I-003 | integration | DELETE override falls back to base seat status | P1 | Existing blocked override | DELETE then fetch effective seats | override gone; base status visible | gap | Effective-state rule |
| BLOCK-E-001 | e2e | Edit exam seat overrides persist after reload | P1 | Existing exam with per-session overrides | edit/save/reopen | blocked/broken overrides preserved | gap | Snapshot + override flow |

## Notes / risks flagged for Bug Log later (Batch 4)

- หลาย controller ในกลุ่ม lifecycle ไม่ได้ใส่ `@Roles(...)` โดยตรง; ถ้า route ไหนไม่ติด role metadata อาจเปิดกับทุก JWT role ได้
- `exam-blocked-seats` ยังไม่มี validation ความสอดคล้อง `LS_ID` กับ session/location ใน payload แบบเข้มงวด
- `exam-location-seats.generateSeats` มี logic ซับซ้อนเรื่อง temporary label + transaction ควรมี integration ครบกัน regression
- Frontend edit-exam เป็น multi-write หลาย endpoint; ถ้าล้มเหลวกลางทางเสี่ยงเกิดข้อมูลค้างบางส่วน
- `notify-changes` เป็น async fire-and-forget; API success ไม่ได้ยืนยันว่า email ส่งสำเร็จ
- `EXAM-I-002` conflict-path ยัง skip ใน shared seed ปัจจุบัน เพราะ `SRB_ID=1` ไม่มี rubric items สำหรับสร้าง persisted score precondition
- `SEAT-I-003` current API behavior ยังยอมรับ payload `brokenSeats` ที่มี member ไม่ใช่ string (ไม่ 400)
- E2E edit route สำหรับ API-seeded exam redirect กลับ `/admin/exam-management` (`BUG-008`) ทำให้ flow ที่ต้องเข้า edit page รันต่อไม่ได้
- E2E seat-management route สำหรับ API-seeded exam redirect กลับ `/admin/exam-management` (`BUG-009`) ทำให้ flow ที่ต้องยืนยัน seat assignment route รันต่อไม่ได้

---

## Batch 5 — Scores & Certificates

### exam-scores

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SCR-U-001 | unit | Upsert by `ERM_ID` creates score + lines + CEFR | P0 | Enrollment has exam rubric/items | call `create` with valid lines | save score/lines + compute band | yes | `exam-scores.service.spec.ts` |
| SCR-U-002 | unit | Upsert restores soft-deleted score row | P0 | Existing soft-deleted score | call `create` with same `ERM_ID` | `DELETED_AT` cleared and row reused | yes | |
| SCR-U-003 | unit | Reject duplicate `SRBI_ID` in payload | P0 | Valid enrollment/rubric | create with duplicate line ids | BadRequest | gap | |
| SCR-U-004 | unit | Reject missing required rubric item score | P0 | Rubric has active items | create missing one item | BadRequest | gap | |
| SCR-U-005 | unit | Reject line not in rubric | P0 | Rubric fixed | create with foreign `SRBI_ID` | BadRequest | gap | |
| SCR-U-006 | unit | Reject score below 0 | P0 | Valid rubric | create with negative score | BadRequest | gap | |
| SCR-U-007 | unit | Reject score above item max | P0 | Item max known | create with score > max | BadRequest | gap | |
| SCR-U-008 | unit | Reject when enrollment/exam/rubric not usable | P0 | Missing or invalid dependencies | create | NotFound/BadRequest | gap | |
| SCR-U-009 | unit | Update with `lines` rewrites lines and recalculates | P1 | Existing score | update with `lines` | lines replaced + band recomputed | gap | |
| SCR-U-010 | unit | Update without `lines` skips recalc branch | P1 | Existing score | update partial fields | direct save branch | gap | |
| SCR-I-001 | integration | POST `/api/exam-scores` happy path | P0 | ENROLLMENT_ADMIN role + seeded rubric | POST valid payload | 201 persisted score/lines/band | gap | |
| SCR-I-002 | integration | POST rejects invalid line composition | P0 | Same as above | POST duplicate/missing/foreign items | 400 | gap | |
| SCR-I-003 | integration | POST rejects out-of-range scores | P0 | Same as above | POST negative/over-max | 400 | gap | |
| SCR-I-004 | integration | POST upsert keeps single logical score per enrollment | P1 | Existing score | POST again with new lines | reused row + updated lines | gap | |
| SCR-I-005 | integration | PATCH with `lines` rewrites and recalculates | P1 | Existing score | PATCH lines payload | 200 + updated lines/band | gap | |
| SCR-I-006 | integration | Role guard on `/exam-scores` routes | P0 | role matrix + no JWT | hit CRUD with various roles | 2xx/403/401 as expected | gap | |
| SCR-I-007 | integration | DELETE soft-delete behavior | P1 | Existing score | DELETE then GET | excluded from normal query | gap | |
| SCR-E-001 | e2e | Admin enters scores and sees computed band | P0 | Admin + rubric + candidate | Save scores in UI | total + CEFR shown | gap | |
| SCR-E-002 | e2e | Non-allowed role blocked from score management | P1 | Candidate login | open score management route | blocked/redirected | gap | |

### score-criteria

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CRI-U-001 | unit | `getBandRules` returns empty when no active/invalid JSON | P0 | No active criteria or malformed content | call `getBandRules` | empty array | gap | |
| CRI-U-002 | unit | Parse filters invalid rule objects | P0 | mixed valid/invalid JSON rules | parse through service path | keep only valid schema rules | gap | |
| CRI-U-003 | unit | `resolveBandLevel` matches inclusive boundaries | P0 | Active band rules | resolve boundary scores | expected CEFR returned | gap | |
| CRI-U-004 | unit | `resolveBandLevel` returns null on non-finite score | P0 | Any rules | resolve NaN/Infinity | null | gap | |
| CRI-U-005 | unit | `resolveBandLevel` returns null when no range matches | P1 | Gapped ranges | resolve unmatched score | null | gap | |
| CRI-U-006 | unit | `saveBandRules` updates existing active row | P0 | Active row exists | save DTO | row updated | gap | |
| CRI-U-007 | unit | `saveBandRules` creates row when none exists | P0 | no active row | save DTO | new active row created | gap | |
| CRI-I-001 | integration | PUT band-rules then GET round-trip consistency | P0 | Authenticated user | PUT valid then GET | persisted rules returned | gap | |
| CRI-I-002 | integration | PUT validation rejects invalid rule fields | P0 | Authenticated user | invalid payload variants | 400 | gap | |
| CRI-I-003 | integration | GET/PUT require JWT | P0 | no token | call endpoints | 401 | gap | |
| CRI-I-004 | integration | Any authenticated role can mutate rules (current behavior) | P1 | candidate/staff/admin JWT | PUT valid payload each role | all authenticated roles 2xx | gap | authz risk |
| CRI-E-001 | e2e | Admin edits CEFR band rules and persists | P0 | Admin login | edit+save+reload criteria page | values persisted | gap | |
| CRI-E-002 | e2e | Updated mapping reflected in downstream score/cert views | P1 | updated rules + existing scores | open dependent UI | CEFR display follows latest rules | gap | |

### score-rubrics

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RUB-U-001 | unit | Create rubric with items and default max score mapping | P0 | Valid DTO | call `create` | items persisted and mapped order | gap | |
| RUB-U-002 | unit | Update blocks item edits for default rubric | P0 | `SRB_IS_DEFAULT=true` | update with `items` | BadRequest | gap | |
| RUB-U-003 | unit | Update blocks items when rubric used by saved scores | P0 | rubric tied to saved scores | update with `items` | Conflict | gap | |
| RUB-U-004 | unit | Update with `items` soft-deletes old items then replaces | P1 | non-default rubric, no score lock | update items | replace semantics applied | gap | |
| RUB-U-005 | unit | Remove blocks default rubric deletion | P0 | default rubric | remove | BadRequest | gap | |
| RUB-U-006 | unit | Remove blocks rubric referenced by exam | P0 | exam references rubric | remove | Conflict | gap | |
| RUB-U-007 | unit | `assertRubricUsable` rejects zero active items | P0 | rubric exists no active items | call `assertRubricUsable` | BadRequest | gap | |
| RUB-U-008 | unit | `findOne` not found path | P1 | missing id | call `findOne` | NotFound | gap | |
| RUB-U-009 | unit | `findAll` hides soft-deleted items in response | P1 | active + deleted items | call `findAll` | response includes only active items | gap | |
| RUB-I-001 | integration | POST `/api/score-rubrics` create rubric/items | P0 | EXAM_ADMIN JWT | POST valid payload | 201 | gap | |
| RUB-I-002 | integration | PATCH default rubric items blocked | P0 | seeded default rubric | PATCH with `items` | 400 | gap | |
| RUB-I-003 | integration | PATCH used-by-score rubric items blocked | P0 | scored exam exists | PATCH items | 409 | gap | |
| RUB-I-004 | integration | DELETE rubric referenced by exam blocked | P0 | exam references rubric | DELETE | 409 | gap | |
| RUB-I-005 | integration | Role guard across rubric endpoints | P0 | role matrix + no JWT | call endpoints | 2xx/403/401 as expected | gap | |
| RUB-I-006 | integration | DTO validation on items/min constraints | P1 | EXAM_ADMIN JWT | invalid payload | 400 | gap | |
| RUB-E-001 | e2e | Admin creates/edits non-default rubric and reuses in exam form | P0 | Admin login | rubric CRUD then open exam form | rubric selectable and persisted | gap | |
| RUB-E-002 | e2e | Locked rubric edit shows conflict feedback | P1 | rubric used by saved scores | edit rubric items in UI | conflict shown and no mutation | gap | |

### exam-certificates

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CERT-U-001 | unit | bulkIssue empty list short-circuit | P0 | none | bulkIssue with empty candidates | success true, 0 created/skipped | gap | |
| CERT-U-002 | unit | Reject future issue date | P0 | `certIssuedAt` in future | create/bulkIssue | BadRequest | yes | existing partial |
| CERT-U-003 | unit | Reject expiry date before issue date | P0 | `certExpiresAt < certIssuedAt` | bulkIssue | BadRequest | gap | |
| CERT-U-004 | unit | Reject missing `SCORES_ID` in requested candidates | P0 | one missing score id | bulkIssue | BadRequest | gap | |
| CERT-U-005 | unit | Reject USER_ID mismatch against score enrollment | P0 | mismatched user/score | bulkIssue | BadRequest | gap | |
| CERT-U-006 | unit | Skip already-certified score | P1 | score already has cert | bulkIssue | skipped increment, no duplicate cert | yes | existing partial |
| CERT-U-007 | unit | Create certificate updates session status COMPLETED | P0 | score with session | create/bulk path | cert saved + session completed | yes | existing partial |
| CERT-U-008 | unit | Missing recipient email does not fail issuance | P1 | user has no email | bulkIssue | cert still created | yes | |
| CERT-U-009 | unit | Email send failure does not rollback issuance | P1 | email sender throws | bulkIssue | cert success, side-effect failure tolerated | gap | |
| CERT-U-010 | unit | Manual create trims custom code or auto-generates | P1 | blank/spaced code payload | create | trimmed code or generated fallback | gap | |
| CERT-U-011 | unit | Update enforces future issue-date guard | P1 | existing cert | update future `CERT_ISSUED_AT` | BadRequest | gap | |
| CERT-I-001 | integration | POST bulk-issue mixed create/skip | P0 | EXAM_ADMIN JWT + mixed candidates | POST bulk-issue | created/skipped summary + DB state | gap | |
| CERT-I-002 | integration | bulk-issue fails atomically on invalid batch member | P0 | one invalid score/user mismatch | POST bulk-issue | 400 and no partial writes | gap | |
| CERT-I-003 | integration | bulk-issue date validation | P0 | EXAM_ADMIN JWT | invalid date combinations | 400 | gap | |
| CERT-I-004 | integration | bulk-issue role restriction enforced | P0 | disallowed/no JWT | POST bulk-issue | 403/401 | gap | |
| CERT-I-005 | integration | Non-bulk certificate CRUD authz behavior (current) | P1 | authenticated roles | POST/GET/PATCH/DELETE | current behavior captured | gap | authz risk |
| CERT-I-006 | integration | `CERT_CODE` uniqueness behavior | P1 | duplicate custom code attempt | create second cert | conflict/DB error as designed | gap | |
| CERT-I-007 | integration | Certificate soft-delete behavior | P1 | existing cert | DELETE then GET/list | excluded from normal queries | gap | |
| CERT-I-008 | integration | Create endpoint updates linked session completed | P1 | score linked to session | POST create cert | session status persisted completed | gap | |
| CERT-E-001 | e2e | Admin bulk-issues certificates from score flow | P0 | scored candidates ready | execute bulk issue UI flow | summary + cert status updated | gap | |
| CERT-E-002 | e2e | Candidate sees issued certificate in history/verify flow | P1 | cert issued | candidate opens history/verify | certificate visible/downloadable | gap | |
| CERT-E-003 | e2e | Non-admin cannot execute bulk issue action | P1 | candidate/staff login | attempt bulk-issue UI/API action | blocked/403 | gap | |

## Notes / risks flagged for Bug Log later (Batch 5)

- `exam-certificates` non-bulk CRUD เสี่ยง authz กว้างเกิน intent หากไม่มี `@Roles` ระดับ route/controller ชัดเจน
- `score-criteria` band-rules endpoints เสี่ยงให้ทุก authenticated role แก้เกณฑ์ได้ (JWT-only gate)
- `exam-scores.update` branch ที่ไม่ส่ง `lines` ไม่บังคับ recalc total/band อาจเกิดข้อมูลค้างหาก caller ใช้ผิด path
- `score-rubrics` replace-items ใช้ soft-delete + insert ใหม่ทั้งหมด อาจกระทบ consumer ที่ผูก `SRBI_ID` เดิม
- `exam-certificates` email side effect เป็น fire-and-forget; API success ไม่ได้ยืนยันการส่งเมลสำเร็จ
- Duplicate `CERT_CODE` returns 500 (DB unique) rather than mapped ConflictException
- BUG-010: scores page unbounded `fetchExamScores()` blocks enrollments load on large shared DB (SCR-E-001 skip)

---

## Batch 6 — Profile & identity

### user-profile

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PROF-U-001 | unit | `findOne` not found | P0 | Missing profile id | call `findOne` | NotFoundException | gap | |
| PROF-U-002 | unit | `findByUserId` returns existing with relations | P0 | Profile + user + IMAGE | call `findByUserId` | profile + relations loaded | gap | |
| PROF-U-003 | unit | `findByUserId` auto-creates blank profile | P0 | User exists, no profile | call `findByUserId` | create blank; return with relations | gap | Core UX |
| PROF-U-004 | unit | `findByUserId` unknown user | P0 | No user row | call `findByUserId` | NotFoundException | gap | |
| PROF-U-005 | unit | Candidate update clears remark + WAIT_FIXED→UNCHECKED | P0 | Remark set; WAIT_FIXED enrollments | update as candidate | remark null; enrollments updated | gap | Side effect |
| PROF-U-006 | unit | Staff update does not clear remark/enrollments | P0 | Remark set; staff modifier | update as staff | remark kept; no enrollment bulk update | gap | |
| PROF-U-007 | unit | History saved for staff field change | P0 | Changed mapped field; staff | update | historyService.create called | gap | |
| PROF-U-008 | unit | Candidate history skipped without remark/email flag | P0 | Candidate; no remark; not email | update changed fields | no history create | gap | |
| PROF-U-009 | unit | Candidate history saved when hadActiveRemark or isFromEmail | P0 | Candidate + remark OR email flag | update | history created | gap | |
| PROF-U-010 | unit | Duplicate national ID / passport Conflict | P0 | Other user (incl soft-deleted) has ID | update conflicting ID | ConflictException | gap | withDeleted |
| PROF-U-011 | unit | `userImagePath` upserts UserImage | P1 | With/without existing image | update with path | upsert image row | gap | |
| PROF-U-012 | unit | Address trim empty → null; softRemove | P1 | Address blanks; existing profile | update then remove | address null; softRemove | gap | **cut** |
| PROF-I-001 | integration | GET `/api/user-profile/me` JWT | P0 | Candidate JWT | GET me | 200 (auto-create if needed) | covered | |
| PROF-I-002 | integration | PATCH `/api/user-profile/me` persists fields | P0 | Candidate JWT | PATCH fields | 200; DB updated | covered | |
| PROF-I-003 | integration | Candidate PATCH clears remark + resets WAIT_FIXED | P0 | Remark + WAIT_FIXED enrollment | PATCH me | remark null; UNCHECKED | covered | |
| PROF-I-004 | integration | National ID conflict via PATCH me | P0 | Another user owns ID | PATCH conflicting ID | 409 | covered | |
| PROF-I-005 | integration | Admin list/get/create/delete RBAC | P0 | ADMIN vs candidate / no JWT | hit admin routes | ADMIN 2xx; others 403/401 | covered | |
| PROF-I-006 | integration | PATCH `/api/user-profile/:id` any JWT can mutate (current) | P0 | Candidate JWT + foreign profileId | PATCH foreign id | current: 2xx allowed | covered | Authz risk BUG-011 |
| PROF-I-007 | integration | Mixed-role user treated as staff modifier | P1 | JWT roles candidate+staff | PATCH me | remark not auto-cleared | covered | |
| PROF-I-008 | integration | Soft-delete then findOne hidden | P1 | ADMIN; existing profile | DELETE then GET | 404 / excluded | covered | |
| PROF-E-001 | e2e | Candidate edits own profile and sees saved values | P0 | Candidate login | Edit profile UI + reload | values persist | done | B6 E2E |
| PROF-E-002 | e2e | Staff remark → candidate fix clears remark | P0 | Staff set remark; WAIT_FIXED | Candidate edits profile | remark cleared; status advances | done | B6 E2E |
| PROF-E-003 | e2e | Admin views registrant profile edit history | P1 | Prior edit exists | Admin open history UI | history rows visible | done | B6 E2E |

### user-image

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| IMG-U-001 | unit | `findByUserId` returns null when missing | P0 | No row | call findByUserId | null | gap | |
| IMG-U-002 | unit | `upsertByUserId` creates new row | P0 | No row | upsert URL | new row saved | gap | |
| IMG-U-003 | unit | `upsertByUserId` updates existing URL | P0 | Existing row | upsert new URL | same id; URL updated | gap | |
| IMG-U-004 | unit | Empty URL still writable via service | P1 | Existing or new | upsert empty string | persisted as provided | gap | **cut** |
| IMG-I-001 | integration | GET `/api/user-image/me` with JWT | P0 | With/without image | GET me | 200 body or null | covered | |
| IMG-I-002 | integration | PATCH `/api/user-image/me` upserts | P0 | JWT + userImageUrl | PATCH | 200 persisted | covered | |
| IMG-I-003 | integration | PATCH without userImageUrl no-op message | P0 | JWT + `{}` | PATCH | no-op message; no DB write | covered | |
| IMG-I-004 | integration | GET/PATCH me require JWT | P0 | No token | call endpoints | 401 | covered | |
| IMG-E-001 | e2e | Candidate updates profile photo on profile page | P0 | Candidate login | Change photo + save | photo after reload | done | B6 E2E |

### profile-edit-history

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PEH-U-001 | unit | `create` persists history row | P0 | Valid DTO | call create | saved entity | gap | |
| PEH-U-002 | unit | `findByUserProfileId` order DESC | P0 | Multiple rows | call find | newest first | gap | |
| PEH-U-003 | unit | `findLatestImagesByProfileIds` empty → `{}` | P0 | `[]` | call | `{}` | gap | |
| PEH-U-004 | unit | Latest image picks newest userImagePath | P0 | Multiple history JSON rows | call with profileIds | newest path; missing null | gap | |
| PEH-U-005 | unit | Malformed / non-string imagePath skipped | P0 | Bad JSON or non-string | extract via findLatest | continue / null | gap | |
| PEH-U-006 | unit | Dedupes duplicate profileIds in request | P1 | `[1,1,2]` | call | single query; keys 1 & 2 | gap | **cut** |
| PEH-I-001 | integration | GET `/api/profile-edit-history/profile/:id` | P0 | JWT + seeded history | GET | 200 ordered list | covered | |
| PEH-I-002 | integration | POST `/api/profile-edit-history/latest-images` | P0 | JWT + history with image | POST profileIds | map of paths/nulls | covered | |
| PEH-I-003 | integration | latest-images DTO validation | P0 | empty / >1000 / non-int | POST invalid | 400 | covered | |
| PEH-I-004 | integration | History endpoints require JWT | P0 | No token | GET/POST | 401 | covered | |
| PEH-I-005 | integration | Any authenticated role can read any profile history (current) | P1 | Candidate JWT + foreign id | GET history | current: 2xx | covered | Authz risk BUG-012 |
| PEH-E-001 | e2e | After profile edit with history gate, admin sees history | P0 | Staff edit or candidate+remark | Edit → admin history | new row shown | done | B6 E2E |
| PEH-E-002 | e2e | Seat/candidate UI loads latest images without N+1 | P1 | Multiple profiles with images | Open view using latest-images | images correct; batch call | gap | **cut** |

### thaid

> **DEFERRED / CUT (one-shot finish):** ไม่เขียน Unit/Integration/E2E ในรอบนี้ — module เป็น stub public echo ไม่ใช่ business identity flow

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| THAID-U-001 | unit | `handleCallback` approval echoes payload | P0 | Body+query | call service | ok:true + echo | yes | **deferred** |
| THAID-U-002 | unit | `handleCallback` payment empty body/query | P0 | Empty maps | call service | endpoint payment; empty echo | yes | **deferred** |
| THAID-U-003 | unit | Controller toRecord wraps non-object body | P1 | Primitive body | wrap via helper/controller | `{value:…}` or `{}` | gap | **deferred** |
| THAID-I-001 | integration | Public POST `/api/approval` accepts any shape | P0 | No JWT | POST JSON | 200 ok approval | gap | **deferred** |
| THAID-I-002 | integration | Public POST `/api/payment` accepts any shape | P0 | No JWT | POST JSON | 200 ok payment | gap | **deferred** |
| THAID-I-003 | integration | `@All` methods work (GET query echo) | P1 | No JWT | GET `/api/approval?x=1` | query echoed | gap | **deferred** |
| THAID-I-004 | integration | Unauthenticated access allowed (Public) | P0 | No JWT | hit both routes | not 401 | gap | **deferred** |
| THAID-E-001 | e2e | Register/login ThaiD path UI still reachable (smoke) | P1 | FE up | Open login → ThaiD entry | UI renders; no crash | gap | **deferred** |

## Notes / risks flagged for Bug Log later (Batch 6)

- `PATCH /user-profile/:id` เป็น JWT-only → authenticated user อาจแก้โปรไฟล์คนอื่นได้ถ้าทราบ id (PROF-I-006)
- PEH history + latest-images ไม่มี `@Roles` → ทุก JWT อ่านประวัติ/รูปจาก profile อื่นได้ (PEH-I-005)
- Dual image writers: profile `userImagePath` vs `user-image` upsert ไม่ synchronize
- Candidate history silence เมื่อไม่มี remark และไม่ใช่ email link (audit gap by design)
- ID uniqueness includes soft-deleted users (`withDeleted: true`)
- ThaiD module เป็น stub public echo — ไม่ใช่ full ThaiD login/identity sync

## Batch 7 — Reporting (slim: exam-report only)

### exam-report

| ID | Level | Title | Priority | Preconditions | Steps | Expected | Existing coverage | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RPT-U-001 | unit | `buildAttemptMetrics` empty window | P0 | `scoredInWindow=[]` | call util | `repeatByYear` empty; `firstTime=0`; `repeat=0` | gap | Pure util |
| RPT-U-002 | unit | `buildAttemptMetrics` firstTime vs repeat | P0 | Mix `hasPriorScore` | call util | firstTime = distinct scored − distinct repeat | gap | |
| RPT-U-003 | unit | `buildAttemptMetrics` repeatByYear DISTINCT | P0 | Same user 2 scored rows same year both prior | call util | year count = 1 (Set) | gap | |
| RPT-U-004 | unit | `getSummary` YoY + changePercent when prev=0 | P0 | Mock metric/avg; prev 0/missing | call `getSummary` | `changePercent===0` | gap | |
| RPT-U-005 | unit | `getSummary` absent + attendance/absent rates | P0 | registered=10, attended=7 | call `getSummary` | absent=3; rates 70/30 | gap | |
| RPT-U-006 | unit | Future round → attended/absent null | P0 | examDate > today | drive summary/rounds | attended/absent null; registered kept | gap | |
| RPT-U-007 | unit | Score buckets only ≥40; fixed ranges | P0 | Mock bucket rows | call `getSummary` | ranges 40-49…80-100 | gap | <40 excluded |
| RPT-U-008 | unit | `formatRoundLabel` appends `/{year}` | P1 | round=`1`, year=`2026`; already labeled | via public path | no double suffix | gap | |
| RPT-U-009 | unit | attemptProportion firstTime = total−repeat | P0 | total=5, repeat=2 | call | `{firstTime:3,repeat:2}` | gap | |
| RPT-U-010 | unit | targetYear = toYear else latest data year | P1 | years [2024,2025]; ±toYear | call `getSummary` | stats keyed correctly | gap | |
| RPT-I-001 | integration | GET `/api/exam-report/summary` as ADMIN | P0 | Seed + ADMIN JWT | GET summary | 200; shape ok | gap | prefix `B7-RPT-` |
| RPT-I-002 | integration | GET summary as EXECUTIVE | P0 | EXECUTIVE JWT | GET summary | 200 | gap | |
| RPT-I-003 | integration | RBAC deny + unauthenticated | P0 | candidate/staff/finance; no token | GET summary | 403 / 401 | gap | |
| RPT-I-004 | integration | `fromYear`/`toYear` filter on EXAM_DATE year | P0 | Multi-year seed | GET with year range | Only years in range | gap | month/round ignored (known gap) |
| RPT-I-005 | integration | CANCELLED enrollments excluded | P0 | CANCELLED + active | GET summary | Counts exclude CANCELLED | gap | |
| RPT-I-006 | integration | GET `/api/exam-report/options` | P1 | Exams with dates/rounds | GET options | years DESC; 12 months; rounds | gap | |
| RPT-I-007 | integration | GET candidates + scoreLines + attemptStatus | P0 | Scored enrollment + prior | GET candidates | 200; first/repeat correct | gap | |
| RPT-E-001 | e2e | Admin dashboard report loads | P0 | Admin login; seed | Open `/admin/dashboard` | cards/charts render | gap | |
| RPT-E-002 | e2e | Drill-down year → rounds → candidates | P0 | Admin; year with rounds | Dashboard → year → candidates | rows with scores | gap | |
| RPT-E-003 | e2e | Non-admin blocked from report UI | P1 | Candidate login | Visit `/admin/dashboard` | Redirect/deny | gap | |

## Notes / risks flagged for Bug Log later (Batch 7)

- Month/round query params are DTO/UI-only (TODO in service) — known gap; do not assert month filter works
- Repeat = lifetime prior scored attempt (outside year window still counts as repeat)
- Score chart drops scores &lt;40 by design
- Report API ADMIN/EXECUTIVE only; FE dashboard role mismatch possible (RPT-E-003)

## Next gate

**Rollout complete (THAID + Batch7 extras deferred).**  
Phase 6 Flow Report: `tests/BUSINESS_FLOW_TEST_REPORT.md`. Shared-DB cleanup script: `tests/scripts/cleanup-test-data.mjs`.

**Deferred:** THAID entire module; Batch 7 moodle/page-builder/platform-gateway/transaction-* extras.
