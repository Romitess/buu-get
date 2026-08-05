# Master Test Plan

รวม Test Case Matrix จากทุก batch (Phase 2+)

## Cumulative counts

| Level | Batch 1 | Total |
|---|---:|---:|
| unit | 99 | 99 |
| integration | 61 | 61 |
| e2e | 13 | 13 |
| **all** | **173** | **173** |

### Batch 1 breakdown

| Module | Unit | Integration | E2E | Total |
|---|---:|---:|---:|---:|
| auth | 32 | 18 | 6 | 50 |
| users | 27 | 21 | 1 | 49 |
| roles | 16 | 14 | 2 | 32 |
| verify | 24 | 8 | 4 | 36 |

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

## Next gate

Phase 2 Batch 1 matrix **done**.  
รอ confirm ก่อน Phase 3: เรียก `unit-test-writer` เฉพาะ Level=unit ของ Batch 1 (auth → users → roles → verify)
