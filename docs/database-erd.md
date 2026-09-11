# BUU GET — Database ERD (Mermaid)

Source of truth: TypeORM entity files under `apps/backend/src/modules/*/entities/`
and the entity list in `apps/backend/src/database/data-source.ts`.

**Totals:** TypeORM entities in `data-source.ts` · junctions: `USER_ROLES` (legacy auth), `PERSON_ROLES` (staff roles)

Attribute comments are taken from TypeORM `comment:` options and rendered with Mermaid
attribute-comment syntax (`type name PK "comment"`).

Paste the full `erDiagram` below into [Mermaid Live Editor](https://mermaid.live/),
GitHub Markdown, or Notion Mermaid charts.

---

## Notes

| Topic | Detail |
|-------|--------|
| Attribute comments | Shown in entity boxes via `"..."` after each attribute (Mermaid ERD syntax) |
| Soft delete | Most tables use `DELETED_AT`, including `FIN_T_TRANSACTIONS`. |
| No soft delete | `EXAM_T_PASSCODES`, `EXAM_T_PASSCODE_LOGS`, `BUU_GET_T_MOODLE_SYNC_LOG`, `BUU_GET_T_USER_IMAGE`, `FIN_T_TRANSACTION_STATUS_HISTORY` |
| Logical FKs only | `BUU_GET_T_PROFILE_EDIT_HISTORY.USER_PROFILE_ID` / `MODIFIER_ID` — columns exist, no `@ManyToOne` |
| Score rubrics | `Exam.SRB_ID` → `BUU_GET_T_SCORE_RUBRICS`; `EXAM_T_SCORE_LINES` snapshots rubric items via `SRBI_ID` |
| Junction columns | `USER_ROLES` uses TypeORM auto-style names: `bUUGETTUSERUSERID`, `bUUGETTROLEROLEID`. `PERSON_ROLES` uses explicit `PSN_ID` / `ROLE_ID`. |
| Identity split | `BUU_GET_T_USER` = applicants; `MSG_T_PERSON` = staff. Staff roles live on `PERSON_ROLES`. `USER_ROLES` remains legacy auth/JWT until PERSON login exists. |
| Isolated tables | `BUU_GET_T_PAGE_CONFIGS`, `BUU_GET_T_EXAM_RULE_VOUCHERS`, `BUU_GET_T_SCORE_CRITERIA` have no ORM relations |
| Cascade | Passcode / passcode-log → exam/passcode use `onDelete: CASCADE`. `Exam.SESSIONS` and `ScoreRubric.ITEMS` / `ExamScore.LINES` use persist cascade |

### Cardinality legend

| Symbol | Meaning |
|--------|---------|
| `\|\|--\|\|` | One-to-one |
| `\|\|--o{` | One-to-many (one required, many optional) |

### Attribute comment syntax

```text
type column_name PK "คำอธิบายจาก TypeORM comment"
```

Comments must not contain `"` (converted to `'` if present in source).

---

## Entity inventory

| Table | Entity class | File | In `data-source.ts`? |
|-------|--------------|------|----------------------|
| `BUU_GET_T_USER` | `User` | `users/entities/user.entity.ts` | Yes |
| `BUU_GET_T_ROLE` | `Role` | `roles/entities/role.entity.ts` | Yes |
| `USER_ROLES` | *(junction via `@JoinTable`)* | owned by `User` | N/A |
| `MSG_T_PERSON` | `MsgPerson` | `msg-persons/entities/msg-person.entity.ts` | Yes |
| `PERSON_ROLES` | *(junction via `@JoinTable`)* | owned by `MsgPerson` | N/A |
| `BUU_GET_T_USER_PROFILE` | `UserProfile` | `user-profile/entities/user-profile.entity.ts` | Yes |
| `BUU_GET_T_USER_IMAGE` | `UserImage` | `user-image/entities/user-image.entity.ts` | Yes |
| `BUU_GET_T_PROFILE_EDIT_HISTORY` | `ProfileEditHistory` | `profile-edit-history/entities/profile-edit-history.entity.ts` | Yes |
| `BUU_GET_T_MOODLE_SYNC_LOG` | `MoodleSyncLog` | `moodle-sync-logs/entities/moodle-sync-log.entity.ts` | Yes |
| `FIN_T_FUND_SOURCES` | `FundSource` | `fund-sources/entities/fund-source.entity.ts` | Yes |
| `BUU_GET_T_SCORE_RUBRICS` | `ScoreRubric` | `score-rubrics/entities/score-rubric.entity.ts` | Yes |
| `BUU_GET_T_SCORE_RUBRIC_ITEMS` | `ScoreRubricItem` | `score-rubrics/entities/score-rubric-item.entity.ts` | Yes |
| `EXAM_T_EXAM` | `Exam` | `exam/entities/exam.entity.ts` | Yes |
| `EXAM_T_SESSIONS` | `ExamSession` | `exam-sessions/entities/exam-session.entity.ts` | Yes |
| `EXAM_T_LOCATIONS` | `ExamLocation` | `exam-locations/entities/exam-location.entity.ts` | Yes |
| `EXAM_T_LOCATION_SEATS` | `ExamLocationSeat` | `exam-location-seats/entities/exam-location-seat.entity.ts` | Yes |
| `EXAM_T_SESSION_LOCATIONS` | `ExamSessionLocation` | `exam-session-locations/entities/exam-session-location.entity.ts` | Yes |
| `EXAM_T_BLOCKED_SEATS` | `ExamBlockedSeat` | `exam-blocked-seats/entities/exam-blocked-seat.entity.ts` | Yes |
| `EXAM_T_PASSCODES` | `ExamPasscode` | `exam/entities/exam-passcode.entity.ts` | Yes |
| `EXAM_T_PASSCODE_LOGS` | `ExamPasscodeLog` | `exam/entities/exam-passcode-log.entity.ts` | Yes |
| `EXAM_T_ENROLLMENTS` | `ExamEnrollment` | `exam-enrollments/entities/exam-enrollment.entity.ts` | Yes |
| `EXAM_T_VOUCHERS` | `ExamVoucher` | `exam-vouchers/entities/exam-voucher.entity.ts` | Yes |
| `EXAM_T_ATTENDANCES` | `ExamAttendance` | `exam-attendances/entities/exam-attendance.entity.ts` | Yes |
| `EXAM_T_SCORES` | `ExamScore` | `exam-scores/entities/exam-score.entity.ts` | Yes |
| `EXAM_T_SCORE_LINES` | `ExamScoreLine` | `exam-scores/entities/exam-score-line.entity.ts` | Yes |
| `EXAM_T_CERTIFICATES` | `ExamCertificate` | `exam-certificates/entities/exam-certificate.entity.ts` | Yes |
| `FIN_T_PAYMENT_CONFIG` | `PaymentConfig` | `payment-configs/entities/payment-config.entity.ts` | Yes |
| `FIN_T_TRANSACTIONS` | `Transaction` | `transactions/entities/transaction.entity.ts` | Yes |
| `FIN_T_TRANSACTION_PROFILE` | `TransactionProfile` | `transaction-profiles/entities/transaction-profile.entity.ts` | Yes |
| `FIN_T_TRANSACTIONS_REFS` | `TransactionRef` | `transaction-refs/entities/transaction-ref.entity.ts` | Yes |
| `FIN_T_TRANSACTION_STATUS_HISTORY` | `TransactionStatusHistory` | `transaction-status-history/entities/transaction-status-history.entity.ts` | Yes |
| `FIN_T_RECEIPTS` | `Receipt` | `receipts/entities/receipt.entity.ts` | Yes |
| `FIN_T_VOIDED_RECEIPTS` | `VoidedReceipt` | `voided-receipts/entities/voided-receipt.entity.ts` | Yes |
| `FIN_T_BANK_RECONCILES` | `BankReconcile` | `bank-reconciles/entities/bank-reconcile.entity.ts` | Yes |
| `FIN_T_BANK_RECONCILE_EDIT_LOGS` | `BankReconcileEditLog` | `bank-reconciles/entities/bank-reconcile-edit-log.entity.ts` | Yes |
| `BUU_GET_T_PAGE_CONFIGS` | `PageConfig` | `page-builder/entities/page-config.entity.ts` | Yes |
| `BUU_GET_T_EXAM_RULE_VOUCHERS` | `ExamRuleVoucher` | `exam-rule-vouchers/entities/exam-rule-voucher.entity.ts` | Yes |
| `BUU_GET_T_SCORE_CRITERIA` | `ScoreCriteria` | `score-criteria/entities/score-criteria.entity.ts` | Yes |

---

## Full ERD (single diagram with attribute comments)

```mermaid
erDiagram
  %% ===== Users / roles / profile / Moodle =====
  BUU_GET_T_USER ||--o{ USER_ROLES : "bUUGETTUSERUSERID"
  BUU_GET_T_ROLE ||--o{ USER_ROLES : "bUUGETTROLEROLEID"
  MSG_T_PERSON ||--o{ PERSON_ROLES : "PSN_ID"
  BUU_GET_T_ROLE ||--o{ PERSON_ROLES : "ROLE_ID"
  BUU_GET_T_USER ||--|| BUU_GET_T_USER_PROFILE : "USER_ID"
  BUU_GET_T_USER ||--|| BUU_GET_T_USER_IMAGE : "USER_ID"
  BUU_GET_T_USER ||--o{ BUU_GET_T_MOODLE_SYNC_LOG : "USER_ID"
  BUU_GET_T_USER_PROFILE ||--o{ BUU_GET_T_PROFILE_EDIT_HISTORY : "USER_PROFILE_ID logical"
  BUU_GET_T_USER ||--o{ BUU_GET_T_PROFILE_EDIT_HISTORY : "MODIFIER_ID logical"

  %% ===== Score rubrics =====
  BUU_GET_T_SCORE_RUBRICS ||--o{ BUU_GET_T_SCORE_RUBRIC_ITEMS : "SRB_ID"
  BUU_GET_T_SCORE_RUBRICS ||--o{ EXAM_T_EXAM : "SRB_ID"

  %% ===== Exam structure =====
  FIN_T_FUND_SOURCES ||--o{ EXAM_T_EXAM : "FUND_SOURCE_ID"
  EXAM_T_EXAM ||--o{ EXAM_T_SESSIONS : "EXAM_ID"
  EXAM_T_EXAM ||--o{ EXAM_T_PASSCODES : "EXAM_ID"
  EXAM_T_EXAM ||--o{ EXAM_T_PASSCODE_LOGS : "EXAM_ID"
  EXAM_T_PASSCODES ||--o{ EXAM_T_PASSCODE_LOGS : "PASSCODE_ID"
  EXAM_T_LOCATIONS ||--o{ EXAM_T_LOCATION_SEATS : "LOCATION_ID"
  EXAM_T_LOCATIONS ||--o{ EXAM_T_SESSION_LOCATIONS : "LOCATION_ID"
  EXAM_T_SESSIONS ||--o{ EXAM_T_SESSION_LOCATIONS : "SS_ID"
  EXAM_T_LOCATION_SEATS ||--o{ EXAM_T_BLOCKED_SEATS : "LS_ID"
  EXAM_T_SESSIONS ||--o{ EXAM_T_BLOCKED_SEATS : "SS_ID"

  %% ===== Enrollment lifecycle =====
  BUU_GET_T_USER ||--o{ EXAM_T_ENROLLMENTS : "USER_ID"
  EXAM_T_SESSIONS ||--o{ EXAM_T_ENROLLMENTS : "SESSION_ID"
  EXAM_T_SESSION_LOCATIONS ||--o{ EXAM_T_ENROLLMENTS : "SL_ID"
  EXAM_T_ENROLLMENTS ||--o{ EXAM_T_VOUCHERS : "ERM_ID"
  EXAM_T_ENROLLMENTS ||--o{ EXAM_T_ATTENDANCES : "ERM_ID"
  EXAM_T_ENROLLMENTS ||--|| EXAM_T_SCORES : "ERM_ID"
  EXAM_T_SCORES ||--o{ EXAM_T_SCORE_LINES : "SCORES_ID"
  BUU_GET_T_SCORE_RUBRIC_ITEMS ||--o{ EXAM_T_SCORE_LINES : "SRBI_ID"
  EXAM_T_SCORES ||--o{ EXAM_T_CERTIFICATES : "SCORES_ID"
  BUU_GET_T_USER ||--o{ EXAM_T_CERTIFICATES : "USER_ID"

  %% ===== Finance / payments =====
  EXAM_T_ENROLLMENTS ||--|| FIN_T_TRANSACTIONS : "ERM_ID"
  FIN_T_PAYMENT_CONFIG ||--o{ FIN_T_TRANSACTIONS : "PC_ID"
  FIN_T_TRANSACTIONS ||--|| FIN_T_TRANSACTION_PROFILE : "TRANX_ID"
  FIN_T_TRANSACTIONS ||--|| FIN_T_TRANSACTIONS_REFS : "TRANX_ID"
  FIN_T_TRANSACTIONS ||--o{ FIN_T_TRANSACTION_STATUS_HISTORY : "TRANX_ID"
  FIN_T_TRANSACTIONS ||--o{ FIN_T_RECEIPTS : "TRANX_ID"
  FIN_T_RECEIPTS ||--|| FIN_T_VOIDED_RECEIPTS : "RC_ID"
  BUU_GET_T_USER ||--o{ FIN_T_VOIDED_RECEIPTS : "VR_BY"
  FIN_T_TRANSACTIONS ||--o{ FIN_T_BANK_RECONCILES : "TRANX_ID"
  BUU_GET_T_USER ||--o{ FIN_T_BANK_RECONCILES : "CREATED_BY"
  FIN_T_BANK_RECONCILES ||--o{ FIN_T_TRANSACTIONS_REFS : "BR_ID"
  FIN_T_BANK_RECONCILES ||--o{ FIN_T_BANK_RECONCILE_EDIT_LOGS : "BR_ID"
  BUU_GET_T_USER ||--o{ FIN_T_BANK_RECONCILE_EDIT_LOGS : "CHANGED_BY"

  %% ===== Entity attributes (comments from TypeORM) =====
  BUU_GET_T_USER {
    int USER_ID PK "รหัสผู้สมัคร"
    varchar USER_CODE UK "รหัสประจำสมัคร"
    varchar USER_NATIONAL_ID UK "หมายเลขบัตรประชาชน 13 หลัก"
    varchar USER_PASSPORT_NO UK "หมายเลขหนังสือเดินทาง"
    varchar USER_EMAIL UK "อีเมลของผู้ใช้"
    varchar USER_PASSWORD "รหัสผ่านเข้ารหัส"
    varchar USER_STATUS "สถานะผู้ใช้ (ACTIVE, INACTIVE, BLOCKED)"
    int USER_MOODLE_ID UK "รหัสผู้ใช้ฝั่ง Moodle"
    datetime CREATED_AT "วันที่สร้างบัญชี"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ"
  }
  BUU_GET_T_ROLE {
    int ROLE_ID PK "รหัสบทบาท"
    varchar ROLE_NAME "ชื่อบทบาท"
    varchar ROLE_DESCRIPTION "คำอธิบายบทบาท"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
    datetime DELETED_AT "วันที่ลบ"
  }
  USER_ROLES {
    int bUUGETTUSERUSERID FK "FK to BUU_GET_T_USER.USER_ID"
    int bUUGETTROLEROLEID FK "FK to BUU_GET_T_ROLE.ROLE_ID"
  }
  MSG_T_PERSON {
    varchar PSN_ID PK "รหัสบุคลากร"
    varchar PRF_NAMETH "ชื่อคำนำหน้า (ไทย)"
    varchar PRF_NAMEEN "ชื่อคำนำหน้า (อังกฤษ)"
    varchar PSN_FNAMETH "ชื่อ (ไทย)"
    varchar PSN_FNAMEEN "ชื่อ (อังกฤษ)"
    varchar PSN_LNAMETH "นามสกุล (ไทย)"
    varchar PSN_LNAMEEN "นามสกุล (อังกฤษ)"
    varchar PSN_EMAIL_BUU "อีเมลของมหาวิทยาลัย"
    varchar PSN_RETIRE "สถานะการทำงาน; N=ทำงาน , Y=ลาออก"
    varchar PSN_TECHNIQUE "ตำแหน่งทางวิชาการ/สายงาน"
    varchar PSN_USERNAME "ชื่อผู้ใช้"
  }
  PERSON_ROLES {
    varchar PSN_ID FK "FK to MSG_T_PERSON.PSN_ID"
    int ROLE_ID FK "FK to BUU_GET_T_ROLE.ROLE_ID"
  }
  BUU_GET_T_USER_PROFILE {
    int USER_PROFILE_ID PK "รหัสโปรไฟล์ผู้ใช้"
    int USER_ID FK "รหัสผู้ใช้"
    varchar USER_TITLE_TH "คำนำหน้าชื่อภาษาไทย"
    varchar USER_FULLNAME_TH "ชื่อ-นามสกุล ภาษาไทย"
    varchar USER_TITLE_EN "คำนำหน้าชื่อภาษาอังกฤษ"
    varchar USER_FULLNAME_EN "ชื่อ-นามสกุล ภาษาอังกฤษ"
    date USER_DATE_OF_BIRTH "วันเกิด"
    varchar USER_PHONE "เบอร์โทรศัพท์"
    varchar USER_EDUCATION "ระดับการศึกษา"
    varchar USER_FACULTY "คณะ"
    varchar USER_INSTITUTION "ชื่อสถานศึกษา"
    varchar USER_COUNTRY "ประเทศ"
    varchar USER_ADDRESS "ที่อยู่"
    boolean USER_THAID_SYNCED "วันที่ซิงค์กับTHAID"
    varchar USER_REMARK "หมายเหตุถึงผู้สมัคร/แจ้งแก้ไขข้อมูล"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
    datetime DELETED_AT "วันที่ลบ"
  }
  BUU_GET_T_USER_IMAGE {
    int USER_IMAGE_ID PK "รหัสรูปภาพผู้ใช้งาน"
    int USER_ID FK "รหัสผู้ใช้งาน"
    text USER_IMAGE_URL "URL หรือ path ของรูปภาพผู้ใช้งาน (จาก platform-gateway)"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
  }
  BUU_GET_T_PROFILE_EDIT_HISTORY {
    int PROFILE_EDIT_HISTORY_ID PK "รหัสประวัติการแก้ไข"
    int USER_PROFILE_ID "รหัสโปรไฟล์ (FK)"
    int MODIFIER_ID "ผู้ดำเนินการแก้ไข (FK)"
    varchar MODIFIER_NAME "ชื่อผู้ดำเนินการแก้ไข"
    varchar MODIFIER_ROLE "สถานะ/บทบาทผู้แก้ไข (เช่น เจ้าหน้าที่, ผู้สมัครสอบ)"
    varchar MODIFIED_FIELDS "ส่วนที่แก้ไข (เช่น ที่อยู่สำหรับจัดส่งเอกสาร)"
    text OLD_VALUES "ค่าเดิม (JSON)"
    text NEW_VALUES "ค่าใหม่ (JSON)"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ"
  }
  BUU_GET_T_MOODLE_SYNC_LOG {
    int ML_ID PK "รหัสล็อกซิงก์ Moodle"
    int USER_ID FK "รหัสผู้สมัคร (Foreign Key)"
    enum ML_ACTION "การทำงานที่ซิงก์"
    varchar ML_WS_FUNCTION "ฟังก์ชันเว็บบอร์ด / เว็บเซอร์วิส Moodle"
    varchar ML_REQUEST_URL "URL ที่ส่งคำขอ"
    json ML_REQUEST_PAYLOAD "Payload คำขอ"
    json ML_RESPONSE_BODY "Body คำตอบกลับ"
    varchar ML_HTTP_METHOD "HTTP Method (GET, POST, etc.)"
    int ML_HTTP_STATUS "HTTP Response Status Code"
    text ML_ERROR_MASSAGE "รายละเอียดข้อผิดพลาด (ถ้ามี)"
    varchar ML_REF_TYPE "ประเภทอ้างอิง"
    int ML_REF_ID "ID อ้างอิงระบบภายใน"
    int ML_MOODLE_REF_ID "ID อ้างอิงระบบ Moodle"
    datetime CREATED_AT "เวลาที่สร้างล็อก"
  }
  FIN_T_FUND_SOURCES {
    int FS_ID PK "รหัสแหล่งทุน"
    varchar FS_ACCOUNT_CODE "รหัสบัญชี"
    varchar FS_NAME "ชื่อแหล่งทุน"
    boolean FS_OPEN_STATUS "สถานะการเปิดใช้ 1= เปิดใช้งาน, 0 = ปิดใช้งาน"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  BUU_GET_T_SCORE_RUBRICS {
    int SRB_ID PK "รหัสชุดเกณฑ์คะแนน"
    varchar SRB_NAME_TH "ชื่อชุดเกณฑ์คะแนน (ภาษาไทย)"
    varchar SRB_NAME_EN "ชื่อชุดเกณฑ์คะแนน (ภาษาอังกฤษ)"
    boolean SRB_IS_DEFAULT "ชุดเกณฑ์เริ่มต้นของระบบ"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  BUU_GET_T_SCORE_RUBRIC_ITEMS {
    int SRBI_ID PK "รหัสรายการในชุดเกณฑ์คะแนน"
    int SRB_ID FK "รหัสชุดเกณฑ์คะแนน"
    varchar SRBI_NAME_TH "ชื่อหมวดคะแนน (ภาษาไทย)"
    varchar SRBI_NAME_EN "ชื่อหมวดคะแนน (ภาษาอังกฤษ)"
    varchar SRBI_CODE "รหัสภายใน (เช่น LANG_USE, READING)"
    decimal SRBI_MAX_SCORE "คะแนนเต็มต่อหมวด"
    int SRBI_SORT_ORDER "ลำดับการแสดงผล"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  EXAM_T_EXAM {
    int EXAM_ID PK "รหัสข้อสอบ"
    varchar EXAM_NAME "ชื่อข้อสอบ"
    varchar EXAM_ROUND "ครั้งที่จัดสอบ"
    varchar EXAM_FISCAL_YEAR "ปีงบประมาณ"
    varchar EXAM_TYPE "ประเภทข้อสอบ"
    varchar EXAM_FORMAT "รูปแบบข้อสอบ"
    decimal EXAM_FEE "ค่าสมัครสอบ"
    date EXAM_DATE "วันที่สอบ"
    datetime EXAM_REG_START_DATE "วันที่เปิดรับสมัคร"
    datetime EXAM_REG_END_DATE "วันที่ปิดรับสมัคร"
    datetime EXAM_PAY_START_DATE "วันที่เปิดให้ชำระเงิน"
    datetime EXAM_PAY_END_DATE "วันที่ปิดให้ชำระเงิน"
    boolean EXAM_PUBLISHED "สถานะการเผยแพร่"
    varchar EXAM_MOODLE_COURSE_ID "รหัสวิชาใน moodle"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
    datetime DELETED_AT "วันที่ลบ"
    int FUND_SOURCE_ID FK "รหัสแหล่งทุน"
    int SRB_ID FK "รหัสชุดเกณฑ์คะแนน"
  }
  EXAM_T_SESSIONS {
    int SS_ID PK "รหัสรอบสอบ"
    int EXAM_ID FK "รหัสการสอบ"
    time SS_START_TIME "เวลาเริ่มสอบ"
    time SS_END_TIME "เวลาสิ้นสุดการสอบ"
    int SS_CAPACITY "จำนวนที่นั่ง"
    tinyint SS_SESSION_STATUS "สถานะรอบสอบ (0:DRAFT, 1:OPEN, 2:SEAT_ALLOCATED, 3:VOUCHER_SENT, 4:COMPLETED, 5:CANCELLED)"
    datetime CREATED_AT "วันที่สร้างรอบสอบ"
    datetime UPDATED_AT "วันที่แก้ไขรอบสอบ"
    datetime DELETED_AT "วันที่ลบรอบสอบ"
  }
  EXAM_T_LOCATIONS {
    int LOCATION_ID PK "รหัสสถานที่จัดสอบ"
    varchar LOCATION_NAME "ชื่อสถานที่จัดสอบ"
    varchar LOCATION_ROOM_NO "เลขที่ห้องสอบ"
    int LOCATION_FLOOR_NO "ชั้น"
    int LOCATION_TOTAL_ROWS "จำนวนแถวทั้งหมด"
    int LOCATION_TOTAL_COLS "จำนวนคอลัมน์ทั้งหมด"
    int LOCATION_SEAT_CAPACITY "ความจุที่นั่งทั้งหมด"
    enum LOCATION_SEAT_DIRECTION "ทิศทางการจัดเรียงที่นั่ง (HORIZONTAL, VERTICAL)"
    json LOCATION_AISLE_AFTER_COL "Aisle positions after row or column indexes"
    datetime CREATED_AT "วันที่สร้างสถานที่จัดสอบ"
    datetime UPDATED_AT "วันที่แก้ไขสถานที่จัดสอบ"
    datetime DELETED_AT "วันที่ลบสถานที่จัดสอบ"
  }
  EXAM_T_LOCATION_SEATS {
    int LS_ID PK "รหัสที่นั่งในห้องสอบ"
    int LOCATION_ID FK "รหัสสถานที่จัดสอบ (FK)"
    int LS_ROW_NO "แถวที่"
    int LS_COL_NO "คอลัมน์ที่"
    varchar LS_SEAT_LABEL "Label ที่นั่ง"
    tinyint LS_SEAT_STATUS "สถานะที่นั่ง (0:AVAILABLE, 1:BROKEN, 2:BLOCKED)"
    int LS_SORT_ORDER "ลำดับการเรียง"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
    datetime DELETED_AT "วันที่ลบ"
  }
  EXAM_T_SESSION_LOCATIONS {
    int SL_ID PK "รหัส Session-Location"
    int LOCATION_ID FK "รหัสสถานที่จัดสอบ (FK)"
    int SS_ID FK "รหัสรอบสอบ (FK)"
    varchar SS_NAME "ชื่อกรรมการคุมสอบประจำห้องสอบ"
    int TOTAL_ROWS "จำนวนแถวทั้งหมด"
    int TOTAL_COLS "จำนวนคอลัมน์ทั้งหมด"
    json AISLE_AFTER "ข้อมูลทางเดินหลังจากคอลัมน์/แถว"
    enum LOCATION_SEAT_DIRECTION "ทิศทางการจัดเรียงที่นั่ง (HORIZONTAL, VERTICAL)"
    int LOCATION_SEAT_CAPACITY "ความจุที่นั่งทั้งหมด"
    json SEATS_SNAPSHOT "ผังที่นั่ง snapshot"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
    datetime DELETED_AT "วันที่ลบ"
  }
  EXAM_T_BLOCKED_SEATS {
    int BLOCK_ID PK "รหัส bloc  k"
    int LS_ID FK "รหัสที่นั่งในห้องสอบ (FK)"
    int SS_ID FK "รหัสรอบสอบ (FK)"
    tinyint BLOCK_STATUS "สถานะการ block (0:AVAILABLE, 1:BROKEN, 2:BLOCKED)"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
    datetime DELETED_AT "วันที่ลบ"
  }
  EXAM_T_PASSCODES {
    int PASSCODE_ID PK "รหัสตาราง passcode"
    int EXAM_ID FK "รหัสข้อสอบ"
    varchar NATIONAL_ID "รหัสประชาชน"
    varchar FULL_NAME "ชื่อ-นามสกุล"
    varchar PASSCODE "รหัสเข้าสอบ"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
  }
  EXAM_T_PASSCODE_LOGS {
    int LOG_ID PK "รหัสตาราง log การใช้งาน passcode"
    int EXAM_ID FK "รหัสข้อสอบ"
    int PASSCODE_ID FK "รหัส passcode ที่ถูกใช้"
    varchar FULL_NAME "ชื่อ-นามสกุลของผู้ใช้งาน"
    varchar PASSCODE "passcode ที่ถูกใช้"
    datetime USED_AT "วันที่-เวลาที่ใช้งาน"
  }
  EXAM_T_ENROLLMENTS {
    int ERM_ID PK "รหัสผู้สมัคร"
    int USER_ID FK "รหัสผู้ใช้"
    int SESSION_ID FK "รหัสรอบสอบ"
    int SL_ID FK "รหัส Session-Location (FK)"
    varchar ERM_SEAT_LABEL "เลขที่นั่งสอบ/รหัสที่นั่งสอบ"
    int ERM_SORT_ORDER "ลำดับการเรียงที่นั่ง"
    varchar ERM_TEST_TAKER "Exam test taker code"
    tinyint ERM_STATUS "สถานะการชำระเงิน (0:UNPAID, 1:PAID, 2:SEAT_ASSIGNED, 3:SEAT_PUBLISHED, 4:ATTENDED, 5:CANCELLED)"
    tinyint ERM_VERIFY_STATUS "สถานะการตรวจสอบ (0:UNCHECKED, 1:PASS, 2:WAIT_FIXED, 3:CANCELLED)"
    tinyint ERM_PHYSICAL_STATUS "สถานะทางกายภาพ/ข้อมูลผู้สมัคร (0: พระภิกษุ / นักบวช, 2: บุคคลทุพพลภาพ, 3: ผู้ตั้งครรภ์, 4: ผู้พิการรณ์, 5: ทั่วไป)"
    datetime ERM_AT "วันที่ตรวจสอบ"
    int ERM_MOODLE_ENROLL_ID "รหัส enrol ฝั่ง Moodle (เติมโดย worker)"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
    datetime DELETED_AT "วันที่ลบ"
  }
  EXAM_T_VOUCHERS {
    int VC_ID PK "เลขที่บัตรสอบ"
    int ERM_ID FK "รหัสผู้สมัคร"
    varchar VC_CODE "รหัสบัตรสอบ"
    datetime CREATED_AT "วันที่สร้างบัตรสอบ"
    datetime UPDATED_AT "วันที่แก้ไขบัตรสอบ"
    datetime DELETED_AT "วันที่ลบบัตรสอบ"
  }
  EXAM_T_ATTENDANCES {
    int ATTEND_ID PK "รหัสผู้เข้าสอบ"
    int ERM_ID FK "รหัสผู้สมัคร"
    datetime ATTEND_CHECK_IN_TIME "วันที่เข้าสอบ"
    tinyint ATTEND_STATUS "สถานะการเข้าสอบ (0:MISSING, 1:INTIME)"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
    datetime DELETED_AT "วันที่ลบ"
  }
  EXAM_T_SCORES {
    int SCORES_ID PK "รหัสคะแนนสอบ"
    int ERM_ID FK "รหัสผู้สมัคร"
    decimal SC_LANG_USE_SCORE "คะแนน Language Use"
    decimal SC_READING_SCORE "คะแนน Reading"
    decimal SC_TOTAL_SCORE "คะแนนรวม"
    varchar SC_BAND_LEVEL "ระดับ CEFR"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
    datetime DELETED_AT "วันที่ลบ"
  }
  EXAM_T_SCORE_LINES {
    int SCL_ID PK "รหัสคะแนนรายหมวด"
    int SCORES_ID FK "รหัสคะแนนสอบ"
    int SRBI_ID FK "รหัสรายการในชุดเกณฑ์ (อ้างอิง)"
    varchar SCL_NAME_TH "ชื่อหมวดคะแนน snapshot (ภาษาไทย)"
    varchar SCL_NAME_EN "ชื่อหมวดคะแนน snapshot (ภาษาอังกฤษ)"
    decimal SCL_MAX_SCORE "คะแนนเต็ม snapshot"
    int SCL_SORT_ORDER "ลำดับการแสดงผล snapshot"
    decimal SCL_SCORE "คะแนนที่ได้"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
    datetime DELETED_AT "วันที่ลบ"
  }
  EXAM_T_CERTIFICATES {
    int CERT_ID PK "รหัสใบรับรอง"
    int SCORES_ID FK "รหัสคะแนนสอบ"
    int USER_ID FK "รหัสผู้ใช้"
    datetime CERT_ISSUED_AT "วันที่ออกใบรับรอง"
    datetime CERT_EXPIRES_AT "วันที่ใบรับรองหมดอายุ"
    varchar CERT_CODE UK "รหัสใบรับรอง (uuid สำหรับตรวจสอบย้อนกลับ)"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไข"
    datetime DELETED_AT "วันที่ลบ"
  }
  FIN_T_PAYMENT_CONFIG {
    int PC_ID PK "รหัส config นี้"
    varchar PROVIDER_NAME "ชื่อผู้ให้บริการ"
    varchar PC_COMP_CODE "รหัสบริษัทที่ตกลงกับธนาคารไว้"
    varchar PC_PROD_CODE "รหัสสินค้า/บริการที่ตกลงกับธนาคารไว้"
    boolean PC_IS_ACTIVE "เปิด/ปิด config"
    datetime PC_EFFECTIVE_FROM "วันที่เริ่มใช้ config นี้"
    datetime PC_EFFECTIVE_TO "วันที่หมดอายุ"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  FIN_T_TRANSACTIONS {
    int TRANX_ID PK "รหัสธุรกรรม"
    int ERM_ID FK "รหัสผู้สมัคร (Foreign Key)"
    int PC_ID FK "รหัสการตั้งค่าการชำระเงิน (Foreign Key)"
    decimal TRANX_AMOUNT "จำนวนเงิน"
    varchar TRANX_QR_CODE "Generated QR payment reference"
    int TRANX_PAYMENT_METHOD "สถานะ/ช่องทางการชำระเงิน"
    int TRANX_MATCH_STATUS "สถานะการจับคู่ตรวจสอบยอดเงิน (0:UNMATCH, 1:MATCH, 2:MISSING)"
    varchar TRANX_BANK_CODE "รหัสธนาคาร"
    int TRANX_CHANNEL "ช่องทาง"
    int TRANX_PAYMENT_STATUS "สถานะการชำระเงิน (PENDING, APPROVED, REJECTED, PAID, PAYMENT_FAILED, EXPIRED, REVERSED, REFUND, RECEIPT_VOIDED)"
    datetime TRANX_BANK_DATETIME "วันเวลาธนาคาร"
    datetime TRANX_EFFECTIVE_DATE "วันที่มีผล"
    datetime TRANX_EXPIRES_AT "วันหมดอายุ"
    datetime TRANX_PAID_AT "วันที่ชำระเงิน"
    datetime TRANX_REJECTED_AT "วันที่ปฏิเสธ"
    datetime TRANX_CREATED_AT "วันที่สร้าง"
    datetime TRANX_UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  FIN_T_TRANSACTION_PROFILE {
    int TP_ID PK "รหัสโปรไฟล์ธุรกรรม"
    int TRANX_ID FK "รหัสธุรกรรม (Foreign Key)"
    varchar TP_NAME "ชื่อผู้เสียภาษี/ชื่อในใบเสร็จ"
    text TP_ADDRESS "ที่อยู่ออกใบเสร็จ"
    varchar TP_PHONE "เบอร์โทรศัพท์"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  FIN_T_TRANSACTIONS_REFS {
    int TSR_ID PK "รหัสอ้างอิงธุรกรรม"
    int TRANX_ID FK "รหัสธุรกรรม (Foreign Key)"
    int BR_ID FK "รหัส Bank Reconcile (Foreign Key)"
    varchar TSC_REF1 "เลขประจำตัวผู้สมัครเลขอ้างอิง 1"
    varchar TSC_REF2 "เลขสมัครสอบอ้างอิง 2"
    varchar TSC_REF3 "เลขอ้างอิง 3"
    varchar TSC_REF4 "เลขอ้างอิง 4"
    varchar TSC_BANK_REF "เลขอ้างอิงธนาคาร"
    varchar TSC_PARTNER_REF "เลขอ้างอิงพาร์ทเนอร์"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  FIN_T_TRANSACTION_STATUS_HISTORY {
    int TSH_ID PK "รหัส log นี้"
    int TRANX_ID FK "รหัสธุรกรรม (Foreign Key)"
    varchar TSH_FROM "สถานะก่อนเปลี่ยน (NULL = เพิ่งสร้างใหม่)"
    varchar TSH_TO "สถานะหลังเปลี่ยน"
    int TSH_API_TYPE "ประเภท API (1=APPROVE, 2=PAYMENT, 3=INQUIRY, 4=REVERSAL)"
    varchar TSH_RESP_CODE "รหัสผลลัพธ์ที่ได้จากธนาคาร"
    varchar TSH_RESP_MESSAGE "ข้อความอธิบายผลลัพธ์"
    datetime CREATED_AT "เวลาที่เกิดการเปลี่ยนสถานะ"
  }
  FIN_T_RECEIPTS {
    int RC_ID PK "รหัสใบเสร็จ"
    int TRANX_ID FK "รหัสธุรกรรม (Foreign Key)"
    bigint RC_TAX_ID "เลขประจำตัวผู้เสียภาษี"
    varchar RC_NAME "ชื่อบนใบเสร็จ"
    varchar RC_PHONE "เบอร์โทรบนใบเสร็จ"
    text RC_ADDRESS "ที่อยู่บนใบเสร็จ"
    varchar RC_SIGNATURE_ID "รหัสลายเซ็น"
    varchar RC_VERIFY_CODE UK "รหัสตรวจสอบใบเสร็จ"
    int RC_STATUS "สถานะใบเสร็จ (0=UNISSUED, 1=ISSUED, 2=VOIDED)"
    datetime RC_ISSUED_AT "วันที่ออกใบเสร็จ"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  FIN_T_VOIDED_RECEIPTS {
    int VR_ID PK "รหัสการยกเลิกใบเสร็จ"
    int RC_ID FK,UK "รหัสใบเสร็จ (Foreign Key)"
    int VR_BY FK "รหัสผู้ยกเลิก (Foreign Key)"
    text VR_REASON "เหตุผลการยกเลิก"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  FIN_T_BANK_RECONCILES {
    int BR_ID PK "รหัส Bank Reconcile"
    int TRANX_ID FK "รหัสธุรกรรม (Foreign Key)"
    int CREATED_BY FK "รหัสผู้สร้าง (Foreign Key)"
    varchar BR_REF1 "Ref 1"
    varchar BR_REF2 "Ref 2"
    varchar BR_REF3 "Ref 3"
    varchar BR_REF4 "Ref 4"
    decimal BR_AMOUNT "จำนวนเงิน"
    varchar BR_PAID_BY "จ่ายโดย"
    varchar BR_IMPORT_KEY_HASH "Hash สำหรับตรวจสอบรายการนำเข้าซ้ำจากไฟล์ธนาคาร"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  FIN_T_BANK_RECONCILE_EDIT_LOGS {
    int BREL_ID PK "รหัสประวัติการแก้ไขรายการกระทบยอดธนาคาร"
    int BR_ID FK "รหัส Bank Reconcile (Foreign Key)"
    int CHANGED_BY FK "รหัสผู้แก้ไข (Foreign Key)"
    json OLD_SNAPSHOT "ข้อมูลก่อนแก้ไข"
    json NEW_SNAPSHOT "ข้อมูลหลังแก้ไข"
    json CHANGED_FIELDS "รายชื่อ field ที่เปลี่ยนแปลง"
    text CHANGE_REASON "ตำแหน่ง Ref ที่ถูกแก้ไข"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  BUU_GET_T_PAGE_CONFIGS {
    int PCF_ID PK "รหัสหน้า"
    json PCF_CONTENT "โครงสร้าง sections + boxes ทั้งหมดของหน้า"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  BUU_GET_T_EXAM_RULE_VOUCHERS {
    int EXRV_ID PK "รหัสข้อปฏิบัติ"
    text CONTENT_TH "ข้อความข้อปฏิบัติ (ภาษาไทย)"
    text CONTENT_EN "ข้อความข้อปฏิบัติ (ภาษาอังกฤษ)"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
  BUU_GET_T_SCORE_CRITERIA {
    int SCR_ID PK "รหัสเกณฑ์คะแนน"
    text SCR_CONTENT "ข้อมูล Band Rules เก็บเป็น JSON"
    boolean SCR_ACTIVE "ชุดที่เปิดใช้งาน (เปิดได้ครั้งละ 1 ชุด)"
    datetime CREATED_AT "วันที่สร้าง"
    datetime UPDATED_AT "วันที่แก้ไขล่าสุด"
    datetime DELETED_AT "วันที่ลบ (Soft Delete)"
  }
```
