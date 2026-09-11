# คู่มือทดสอบ Mock QR Bill Payment (buu-get)

คู่มือสำหรับ QA / Dev ทดสอบการจำลองจ่ายเงินผ่าน QR Bill Payment **โดยไม่ต่อธนาคารจริง**  
โหมดเป้าหมาย: `PAYMENT_MODE=mock`

อ้างอิงโค้ดหลัก:

| ส่วน | Path |
|------|------|
| Public bank callback | `apps/backend/src/modules/bank-callbacks/bank-callback.controller.ts` |
| Mock pay | `apps/backend/src/modules/bank-callbacks/services/mock-bank.service.ts` |
| Approval / Payment | `bill-approval.service.ts` / `bill-payment.service.ts` |
| Intent + QR | `apps/backend/src/modules/transactions/transactions.service.ts` |
| UI ประวัติสอบ | `apps/frontend/src/pages/user/exam-history-page.vue` |
| Dialog จ่ายเงิน | `apps/frontend/src/components/exam/app-payment-dialog.vue` |
| e2e | `apps/backend/test/e2e/bank-callback.e2e-spec.ts` |
| Unit util | `apps/backend/src/modules/bank-callbacks/utils/bank-callback.util.spec.ts` |

---

## 1. จุดประสงค์

- ยืนยันว่า flow **approval → payment** ทำงานครบ (สถานะธุรกรรม / enrollment / log)
- ทดสอบได้ทั้ง **UI (ปุ่มจำลองจ่าย)** และ **API ตรง** (`POST /api/approval`, `POST /api/payment`)
- ไม่ต้องมีธนาคารจริง / ไม่ต้องสแกน QR จริง

---

## 2. Prerequisites

### 2.1 Migration

รันจาก `apps/backend` (หรือให้ app boot ด้วย `migrationsRun: true`):

```bash
cd apps/backend
npm run migration:run
```

Migration ที่เกี่ยวข้อง:

| Timestamp | ไฟล์ | หน้าที่ |
|-----------|------|---------|
| `1789780345000` | `CreateBankRequestLogTables` | `FIN_T_REQUEST_APPROVAL`, `FIN_T_REQUEST_PAYMENT` (คอลัมน์/ลำดับตรง Lifelong) |
| `1789780345200` / `5300` | Align / Reorder bank request logs | rebuild ลำดับคอลัมน์ให้ตรง `lifelong_dev.sql` |
| `1789780345100` | `AddUserAndSessionCodes` | `BUU_GET_T_USER.USER_CODE`, `EXAM_T_SESSIONS.SESSION_CODE` |

### 2.2 Env (ชื่อตัวแปรเท่านั้น — อย่าใส่ค่า secret ในเอกสาร/แชท)

| ตัวแปร | ค่าที่ต้องใช้ตอนเทส mock | หมายเหตุ |
|--------|---------------------------|----------|
| `PAYMENT_MODE` | `mock` | ถ้าเป็น `csv` → callback ได้ 503 และ UI ไม่มีปุ่มจำลองจ่าย |
| `BANK_API_USER` | ตั้งค่า | ใช้ตรวจ credential ใน approval/payment |
| `BANK_API_PASSWORD` | ตั้งค่า | ใช้ตรวจ credential ใน approval/payment |
| `BANK_TAX_ID` | ตั้งค่า | ใช้สร้าง QR payload |
| `BANK_SUFFIX` | ตั้งค่า | ต่อท้าย taxId ใน QR |
| `BANK_COM_CODE` | ไม่บังคับ | default ใน mock ≈ `BUU` |
| `BANK_PROD_CODE` | ไม่บังคับ | default ใน mock ≈ `GET` |

ค่าที่รองรับของ `PAYMENT_MODE`: `csv` | `mock` | `realtime_bank`

### 2.3 ข้อมูลทดสอบขั้นต่ำ

- ผู้ใช้มี `USER_CODE` แล้ว
- รอบสอบมี `SESSION_CODE` แล้ว
- มี enrollment สถานะ **UNPAID** (`EXAM_T_ENROLLMENTS.ERM_STATUS = 0`)
- มี `FIN_T_PAYMENT_CONFIG` ที่ใช้สร้าง intent ได้ (UI ส่ง `pcId`)

---

## 3. Mapping สถานะ (สั้น)

```text
FIN_T_TRANSACTIONS.TRANX_PAYMENT_STATUS
  PENDING (0) ──approval──► APPROVED (1) ──payment──► PAID (3)

EXAM_T_ENROLLMENTS.ERM_STATUS
  UNPAID (0) ──payment เท่านั้น──► PAID (1)
```

| ขั้น | Transaction | Enrollment |
|------|-------------|------------|
| สร้าง intent `POST /api/transactions` | `PENDING` | ยัง `UNPAID` |
| หลัง `POST /api/approval` สำเร็จ | `APPROVED` | ยัง `UNPAID` |
| หลัง `POST /api/payment` สำเร็จ | `PAID` (+ match) | `PAID` |

หมายเหตุ: `POST /api/transactions/:id/mock-pay` เรียก approval แล้ว payment ต่อกันในครั้งเดียว

---

## 4. REF1 / REF2

| Ref | แหล่ง | ตาราง.คอลัมน์ | รูปแบบ | ตัวอย่าง |
|-----|--------|----------------|--------|----------|
| **REF1** | รหัสสมาชิก | `BUU_GET_T_USER.USER_CODE` | `{ปีงบ พ.ศ. 4}{1 ไทย\|2 ต่างชาติ}{รัน 5}` | `2569200001` |
| **REF2** | รหัสรอบสอบ | `EXAM_T_SESSIONS.SESSION_CODE` | `{1 ทั่วไป\|2 พิเศษ}{ปีงบ ค.ศ. 4}{รัน 3}` | `22026001` |

เก็บบน refs:

- ตาราง: `FIN_T_TRANSACTIONS_REFS`
- คอลัมน์: `TSC_REF1`, `TSC_REF2`

QR Bill Payment payload (โดยประมาณ):

```text
|{BANK_TAX_ID}{BANK_SUFFIX}\r{REF1}\r{REF2}\r{amountInSatang}
```

Util: `apps/backend/src/common/utils/member-session-codes.util.ts`

---

## 5. Manual UI Test (mock)

**เงื่อนไข:** backend ตั้ง `PAYMENT_MODE=mock` แล้ว restart, login เป็นเจ้าของ enrollment ที่ยัง UNPAID

| # | ขั้นตอน | ผลที่คาดหวัง |
|---|---------|---------------|
| 1 | เปิดหน้าประวัติสอบ (`/…/exam-history`) | เห็นรายการรอชำระ |
| 2 | กดชำระเงิน | เรียก `POST /api/transactions` → ได้ `TRANX_ID`, QR, REF1/REF2, `paymentMode: mock` |
| 3 | กรอก/ยืนยันข้อมูลใบเสร็จ (dialog ข้อมูลใบเสร็จ) | เปิดต่อเป็น payment session |
| 4 | ระบบเรียก `POST /api/transactions/:id/start-session` | ได้ expiry (~30 นาที), เปิด dialog QR |
| 5 | ตรวจ dialog | แสดงยอด, REF1/REF2, QR, **ปุ่ม «จำลองว่าจ่ายเงินสำเร็จ»** (ไม่ใช่ Save QR) |
| 6 | (ทางเลือก) รอ poll | UI เรียก `GET /api/transactions/:id/payment-status` ทุก ~10 วินาที |
| 7 | กดปุ่มจำลองจ่าย | เรียก `POST /api/transactions/:id/mock-pay` (JWT) |
| 8 | หลังสำเร็จ | แจ้งชำระสำเร็จ, ปิด dialog, ประวัติสอบอัปเดตเป็นจ่ายแล้ว |

Checklist สั้นหลัง UI สำเร็จ:

- [ ] `TRANX_PAYMENT_STATUS = PAID (3)`
- [ ] `ERM_STATUS = PAID (1)`
- [ ] มี log ใน `FIN_T_REQUEST_APPROVAL` และ `FIN_T_REQUEST_PAYMENT` อย่างละ **2 แถว** ต่อ callback (request + response; แถว response มี `RESPCODE = 0`)
- [ ] **ยังไม่มี** ใบเสร็จอัตโนมัติจาก bank callback

---

## 6. API Test (Postman / cURL)

Base URL ตัวอย่าง: `http://localhost:3000/api`  
ธุรกิจ error ส่วนใหญ่คืน **HTTP 200** — ดูที่ `respCode`  
โหมด `csv` → `POST /approval` และ `POST /payment` ได้ **HTTP 503**

### 6.1 เตรียม intent (JWT)

```http
POST /api/transactions
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "ermId": <ERM_ID>,
  "pcId": <PC_ID>,
  "amount": 1500
}
```

จากนั้น (ถ้าจะให้มี expiry เหมือน UI):

```http
POST /api/transactions/<TRANX_ID>/start-session
Authorization: Bearer <JWT>
```

จดค่า: `TRANX_ID`, `REF1` (= USER_CODE), `REF2` (= SESSION_CODE), `amount`

### 6.2 Approval แล้ว Payment (public)

**DT-01 — Approval**

```bash
curl -X POST "http://localhost:3000/api/approval" \
  -H "Content-Type: application/json" \
  -d "{
    \"user\": \"<BANK_API_USER>\",
    \"password\": \"<BANK_API_PASSWORD>\",
    \"comCode\": \"BUU\",
    \"prodCode\": \"GET\",
    \"command\": \"approve\",
    \"bankCode\": \"014\",
    \"bankRef\": \"BK202609091200001\",
    \"dateTime\": \"20260909120000\",
    \"effDate\": \"20260909\",
    \"amount\": \"1500\",
    \"channel\": \"mobile\",
    \"cusName\": \"ทดสอบ ระบบ\",
    \"ref1\": \"<USER_CODE>\",
    \"ref2\": \"<SESSION_CODE>\",
    \"ref3\": \"\",
    \"ref4\": \"\"
  }"
```

Expected (สำเร็จ):

```json
{
  "tranxId": <TRANX_ID>,
  "bankRef": "BK202609091200001",
  "respCode": "0",
  "respMsg": "Successful",
  "balance": "1500",
  "cusName": "ทดสอบ ระบบ",
  "info": ""
}
```

**DT-03 — Payment** (ใส่ `tranxId` จาก approval)

```bash
curl -X POST "http://localhost:3000/api/payment" \
  -H "Content-Type: application/json" \
  -d "{
    \"user\": \"<BANK_API_USER>\",
    \"password\": \"<BANK_API_PASSWORD>\",
    \"comCode\": \"BUU\",
    \"prodCode\": \"GET\",
    \"command\": \"payment\",
    \"bankCode\": \"014\",
    \"bankRef\": \"BK202609091200001\",
    \"tranxId\": \"<TRANX_ID>\",
    \"dateTime\": \"20260909120130\",
    \"effDate\": \"20260909\",
    \"amount\": \"1500\",
    \"channel\": \"mobile\",
    \"cusName\": \"ทดสอบ ระบบ\",
    \"ref1\": \"<USER_CODE>\",
    \"ref2\": \"<SESSION_CODE>\",
    \"ref3\": \"\",
    \"ref4\": \"\"
  }"
```

Expected: `respCode": "0"`

### 6.3 ทางลัด mock (JWT, เฉพาะ `PAYMENT_MODE=mock`)

```http
POST /api/transactions/<TRANX_ID>/mock-pay
Authorization: Bearer <JWT ของเจ้าของ enrollment>
```

Response โครงประมาณ:

```json
{
  "approval": { "respCode": "0", "tranxId": <id>, "...": "..." },
  "payment":  { "respCode": "0", "tranxId": <id>, "...": "..." }
}
```

### 6.4 Poll สถานะ (JWT)

```http
GET /api/transactions/<TRANX_ID>/payment-status
Authorization: Bearer <JWT>
```

Expected หลังจ่ายสำเร็จ: `paid: true`, `paymentStatus` = PAID, `message` ≈ `ชำระเงินสำเร็จ`

---

## 7. Happy path checklist (DT-01…DT-05) — ปรับชื่อตาราง buu-get

ใช้ enrollment + txn ที่สร้างจาก intent แล้ว

| ID | ลำดับ | Action | Input สำคัญ | Expected |
|----|--------|--------|-------------|----------|
| **DT-01** | 1 | `POST /api/approval` | ref1=`USER_CODE`, ref2=`SESSION_CODE`, amount ตรง `TRANX_AMOUNT`, dateTime ยังไม่หมดอายุ | HTTP 200, `respCode=0`, ได้ `tranxId` |
| **DT-02** | 2 | ตรวจ DB | — | `FIN_T_REQUEST_APPROVAL` มี **2 แถว** (request + response `RESPCODE=0`); txn เป็น `APPROVED`; enrollment ยัง `UNPAID` |
| **DT-03** | 3 | `POST /api/payment` | `tranxId` จาก DT-01, amount/ref ตรง | HTTP 200, `respCode=0` |
| **DT-04** | 4 | ตรวจ DB | — | txn `PAID`; `EXAM_T_ENROLLMENTS.ERM_STATUS=PAID`; `FIN_T_REQUEST_PAYMENT` มี **2 แถว** (request + response `RESPCODE=0`); refs มี `TSC_BANK_REF` |
| **DT-05** | 5 | `GET /api/transactions/:id/payment-status` (หรือ UI poll) | `TRANX_ID` | `paid=true`, ข้อความชำระสำเร็จ |

> เหมือน Lifelong: log เป็น **2 แถวต่อ 1 callback** — แถว request (`REQUEST_DATA`, ไม่มี `RESPCODE`) + แถว response (`RESPCODE`/`RESPMSG`)

---

## 8. Negative cases (DT-N01…DT-N13)

`respCode` อ้างอิง `apps/backend/src/modules/bank-callbacks/constants/bank-resp-codes.ts`

| ID | API | เงื่อนไข (buu-get) | Expected `respCode` | หมายเหตุ |
|----|-----|---------------------|---------------------|----------|
| **DT-N01** | ทั้งคู่ | `user`/`password` ไม่ตรง `BANK_API_*` | `101` | Invalid username/password |
| **DT-N02** | approval | ref1/ref2 ไม่มีใน `FIN_T_TRANSACTIONS_REFS` | `104` | Invalid reference |
| **DT-N03** | approval | มี ref แต่ txn ไม่ใช่ `PENDING`/`APPROVED` (เช่น EXPIRED) | `104` | ไม่มี txn เปิดรับ approve |
| **DT-N04** | approval | amount ≠ `TRANX_AMOUNT` | `108` | Invalid price or amount |
| **DT-N05** | approval | `dateTime` เกิน `TRANX_EXPIRES_AT` หรือ parse ไม่ได้ | `999` | Bill Payment Expired *(เทียบ Lifelong PAYENDDATE)* |
| **DT-N06** | approval | ที่นั่งเต็ม: จำนวน enrollment ที่ไม่ CANCELLED ≥ `EXAM_T_SESSIONS.SS_CAPACITY` | `999` | msg มักลงท้าย `.` *(เทียบ Lifelong NUMPAY/NUMOPEN)* |
| **DT-N07** | approval | `ERM_STATUS` ไม่ใช่ UNPAID (จ่ายแล้ว) | `106` | Transaction number duplicate |
| **DT-N08** | payment | `tranxId` ไม่มี / ไม่ใช่ตัวเลข | `105` | Invalid transaction number |
| **DT-N09** | payment | `tranxId` ถูก แต่ ref1/ref2 ไม่ตรงแถว refs | `104` | Invalid reference |
| **DT-N10** | payment | amount ไม่ตรง | `108` | Invalid price or amount |
| **DT-N11** | payment | ยิงซ้ำหลัง `TRANX_PAYMENT_STATUS=PAID` | `103` | over limit |
| **DT-N12** | payment | enrollment ไม่ UNPAID แต่ txn ยังไม่ PAID | `106` | duplicate |
| **DT-N13** | ทั้งคู่ | Method ไม่ใช่ POST (เช่น GET) | **HTTP 405** | ไม่ดู `respCode` |

เคสเพิ่มเฉพาะ mock UI/API:

| เคส | Expected |
|-----|----------|
| `POST /mock-pay` เมื่อ `PAYMENT_MODE≠mock` | HTTP 503 |
| `POST /mock-pay` ด้วย JWT คนละเจ้าของ enrollment | HTTP 403 |
| `POST /approval` เมื่อ `PAYMENT_MODE=csv` | HTTP 503 |

---

## 9. Automated tests

จาก `apps/backend`:

```bash
cd apps/backend

# Unit — util (QR, amount, dateTime, mask, resp mapping)
npm test -- bank-callback.util

# e2e — routing / mode gate / mock-pay / payment-status (มี mock services)
npm run test:e2e -- bank-callback.e2e-spec
```

ไฟล์:

- `apps/backend/src/modules/bank-callbacks/utils/bank-callback.util.spec.ts`
- `apps/backend/test/e2e/bank-callback.e2e-spec.ts`

---

## 10. SQL checklist หลังจ่ายสำเร็จ

แทนที่ `:ref1`, `:ref2`, `:tranxId` ด้วยค่าจริง

```sql
-- ธุรกรรม
SELECT TRANX_ID, ERM_ID, TRANX_AMOUNT, TRANX_PAYMENT_STATUS, TRANX_MATCH_STATUS,
       TRANX_PAID_AT, TRANX_EXPIRES_AT, TRANX_QR_CODE
FROM FIN_T_TRANSACTIONS
WHERE TRANX_ID = :tranxId;

-- อ้างอิง REF
SELECT TSR_ID, TRANX_ID, TSC_REF1, TSC_REF2, TSC_BANK_REF
FROM FIN_T_TRANSACTIONS_REFS
WHERE TRANX_ID = :tranxId;
-- หรือ WHERE TSC_REF1 = :ref1 AND TSC_REF2 = :ref2;

-- Enrollment
SELECT ERM_ID, USER_ID, SESSION_ID, ERM_STATUS
FROM EXAM_T_ENROLLMENTS
WHERE ERM_ID = (SELECT ERM_ID FROM FIN_T_TRANSACTIONS WHERE TRANX_ID = :tranxId);

-- Log approval (ล่าสุด)
SELECT ID, REF1, REF2, TRANXID, BANKREF, RESPCODE, RESPMSG, AMOUNT, CREATEDATE
FROM FIN_T_REQUEST_APPROVAL
WHERE REF1 = :ref1 AND REF2 = :ref2
ORDER BY CREATEDATE DESC, ID DESC
LIMIT 5;

-- Log payment (ล่าสุด)
SELECT ID, REF1, REF2, TRANXID, BANKREF, RESPCODE, RESPMSG, AMOUNT, CREATEDATE
FROM FIN_T_REQUEST_PAYMENT
WHERE REF1 = :ref1 AND REF2 = :ref2
ORDER BY CREATEDATE DESC, ID DESC
LIMIT 5;

-- ประวัติสถานะ (ถ้าต้องการ)
SELECT TSH_ID, TRANX_ID, TSH_FROM, TSH_TO, TSH_API_TYPE, TSH_RESP_CODE, TSH_RESP_MESSAGE
FROM FIN_T_TRANSACTION_STATUS_HISTORY
WHERE TRANX_ID = :tranxId
ORDER BY TSH_ID;

-- ใบเสร็จ — ไม่ควรมีแถวใหม่อัตโนมัติจาก callback
SELECT RC_ID, TRANX_ID, RC_STATUS
FROM FIN_T_RECEIPTS
WHERE TRANX_ID = :tranxId;
```

ค่าที่คาดหลัง happy path:

| ตรวจ | ค่า |
|------|-----|
| `TRANX_PAYMENT_STATUS` | `3` (PAID) |
| `ERM_STATUS` | `1` (PAID) |
| `FIN_T_REQUEST_*` ต่อ callback | **2 แถว** (request + response; response มี `RESPCODE=0`) |
| `FIN_T_RECEIPTS` จาก callback | ว่าง / ไม่สร้างใหม่ |

---

## 11. สิ่งที่ไม่ต้องคาดหวัง

| ข้อ | รายละเอียด |
|-----|------------|
| ไม่มีธนาคารจริง | mock ไม่เรียก outbound ไปธนาคาร |
| ไม่สร้างใบเสร็จอัตโนมัติจาก callback | เหมือน Lifelong — path approval/payment ไม่สร้าง `FIN_T_RECEIPTS` |
| CSV เป็นคนละเส้น | `PAYMENT_MODE=csv` ใช้ Save QR → `PATCH …/confirm`; callback public ปิด (503) |
| Dialog ข้อมูลใบเสร็จใน mock | UI ยังถามข้อมูลใบเสร็จก่อนโชว์ QR แต่ **mock-pay ไม่ได้ยืนยันออกใบเสร็จให้อัตโนมัติ** |
| HTTP status ของ business error | มักเป็น 200 + `respCode` ไม่ใช่ 4xx |

---

## 12. Troubleshooting

| อาการ | สาเหตุที่เป็นไปได้ | แก้ |
|-------|---------------------|-----|
| ไม่มีปุ่ม «จำลองว่าจ่ายเงินสำเร็จ» มีแค่ Save QR | `PAYMENT_MODE=csv` (หรือ frontend ได้ `paymentMode` เป็น csv) | ตั้ง `PAYMENT_MODE=mock` แล้ว restart backend |
| `POST /api/approval` ได้ 503 | โหมด csv | เปลี่ยนเป็น `mock` หรือ `realtime_bank` |
| `mock-pay` ได้ 503 | ไม่ใช่โหมด mock | ตั้ง `PAYMENT_MODE=mock` |
| สร้าง txn ไม่ได้ / ไม่มี REF | ขาด `USER_CODE` หรือ `SESSION_CODE` | รัน migration codes + ให้ allocator สร้างรหัส; หรือ seed ผู้ใช้/รอบสอบที่มีรหัส |
| approval `104` | ref ไม่ตรง หรือยังไม่มี `FIN_T_TRANSACTIONS_REFS` | สร้าง intent ใหม่จาก UI/`POST /transactions` |
| approval `999` | เลย `TRANX_EXPIRES_AT` หรือที่นั่งเต็ม | เรียก `start-session` ใหม่ / ตรวจ `SS_CAPACITY` |
| approval `101` | credential ไม่ตรง env | ตรวจ `BANK_API_USER` / `BANK_API_PASSWORD` |
| UI poll ไม่ขึ้นสำเร็จ | mock-pay ล้ม หรือ poll ยังไม่ครบรอบ 10 วิ | ดู Network: `mock-pay` + `payment-status`; กดจำลองจ่ายแล้วควรปิด dialog ทันทีถ้าสำเร็จ |
| `mock-pay` 403 | JWT ไม่ใช่เจ้าของ enrollment | login user ที่เป็นเจ้าของ ERM |

---

## ภาคผนวก A — Endpoint สรุป

| Method | Path | Auth | ใช้เมื่อ |
|--------|------|------|---------|
| `POST` | `/api/transactions` | JWT | สร้าง PENDING + refs + QR |
| `POST` | `/api/transactions/:id/start-session` | JWT | ตั้ง expiry ~30 นาที |
| `POST` | `/api/transactions/:id/mock-pay` | JWT | จำลอง approval→payment (`mock` เท่านั้น) |
| `GET` | `/api/transactions/:id/payment-status` | JWT | Poll สถานะ |
| `PATCH` | `/api/transactions/:tranxId/confirm` | JWT | ยืนยันจ่ายแบบ CSV (ไม่ใช่ mock path) |
| `POST` | `/api/approval` | Public | Bank / Postman จำลองธนาคาร |
| `POST` | `/api/payment` | Public | Bank / Postman จำลองธนาคาร |

---

## ภาคผนวก B — ลำดับรันแนะนำ (รอบเดียว)

1. ตั้ง env mock + migration  
2. Seed / เตรียม user+session ที่มี code + enrollment UNPAID  
3. รัน negative approval ที่ไม่ทำลาย seed ได้ก่อน (N01–N06 ตามความเหมาะสม)  
4. Reset / สร้าง intent ใหม่ → DT-01…DT-05  
5. บนข้อมูลหลังสำเร็จ → N07, N11  
6. Seed ใหม่ → N08–N10, N12  
7. ตรวจ N13 (method) และ UI manual หนึ่งรอบ
