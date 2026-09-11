# พอร์ตระบบจ่ายเงิน Bank Callback จาก Lifelong → buu-get

สรุปสิ่งที่ต้องทำเพื่อให้ **buu-get** เรียก API / สร้างตาราง / เก็บข้อมูล **แบบ lifelong** (QR Bill Payment: approval → payment)

เอกสาร flow + data test ต้นทาง (lifelong): `.qa/knowledge/payment-flow-datatest.md` ใน repo lifelong2

---

## สถานะปัจจุบัน (สั้นๆ)

| ระบบ | สถานะ |
|------|--------|
| **Lifelong** | มี realtime แล้ว: `POST /api/approval`, `POST /api/payment` + ตาราง log + QR Bill Payment |
| **buu-get** | จ่ายเงินหลักยังเป็น **CSV reconcile**; มี `FIN_T_TRANSACTIONS` + refs แล้ว แต่ยังไม่มี inbound bank API แบบ lifelong |

ใน buu-get มี `PaymentProvider` (stub CSV) พร้อมจุดเสียบ bank ภายหลัง — ยังไม่ mark PAID จาก webhook

---

## Mapping ตาราง (จาก dump lifelong2)

อย่า copy ชื่อ `LLT*` ตรงๆ — map เข้า schema เดิมของ buu-get แล้ว **เก็บคอลัมน์ให้เหมือน dump** (`lifelong.sql`)

แหล่งจริงของ schema log: dump `lifelong_dev.sql` ตาราง `LLTREQUESTAPPROVAL`, `LLTREQUESTPAYMENT`, `LLTTRANSACTIONPAY`

| Lifelong | buu-get | หมายเหตุ |
|----------|---------|----------|
| `LLTENROLL` (PAYSTATUS, REF1/2, amount) | Exam enrollment + สถานะจ่าย | Source of truth ว่าจ่ายแล้วหรือยัง |
| `LLTTRANSACTIONPAY` | `FIN_T_TRANSACTIONS` + `FIN_T_TRANSACTIONS_REFS` | อย่าสร้างตารางซ้ำ — map ฟิลด์ด้านล่าง |
| `LLTREQUESTAPPROVAL` | `FIN_T_REQUEST_APPROVAL` | log **2 แถว** ต่อ callback (request + response); คอลัมน์/ลำดับตรง `lifelong_dev.sql` |
| `LLTREQUESTPAYMENT` | `FIN_T_REQUEST_PAYMENT` | เหมือน approval; payment มีแค่ `PRINT1` (ไม่มี PRINT2–7) |
| `LLTPAYMENT` (offline) | `BankReconcile` (CSV) | คนละ path — คงไว้คู่ขนาน |

สถานะบน transaction:

```text
PENDING ──approval (optional)──► APPROVED ──payment──► PAID
```

(lifelong: approval ไม่ mark paid; payment ค่อยตั้งจ่ายแล้ว)

### `LLTREQUESTAPPROVAL` → `FIN_T_REQUEST_APPROVAL`

เก็บชนิด/ความยาวตาม dump — อย่าแปลงเป็น varchar กว้างเกินจำเป็น

| Lifelong | Type | buu-get |
|----------|------|---------|
| `ID` | int PK AI | `ID` |
| `REF1` | varchar(20) | `REF1` |
| `REF2` | varchar(20) | `REF2` |
| `TRANXID` | varchar(20) | `TRANXID` (เก็บค่าที่คืนธนาคาร เป็น string) |
| `USER` | varchar(20) | `USER` |
| `PASSWORD` | varchar(20) | `PASSWORD` (เก็บเหมือน lifelong; `REQUEST_DATA` ยัง mask) |
| `COMCODE` | varchar(10) | `COMCODE` |
| `PRODCODE` | varchar(10) | `PRODCODE` |
| `COMMAND` | varchar(20) | `COMMAND` |
| `BANKCODE` | int | `BANKCODE` |
| `BANKREF` | varchar(20) | `BANKREF` |
| `DATETIME` | varchar(14) | `DATETIME` (`yyyyMMddHHmmss`) |
| `EFFDATE` | varchar(8) | `EFFDATE` (`yyyyMMdd`) |
| `AMOUNT` | decimal(18,2) | `AMOUNT` |
| `CHANNEL` | varchar(20) | `CHANNEL` |
| `CUSNAME` | varchar(60) | `CUSNAME` |
| `INFO` | varchar(50) | `INFO` |
| `REF3` | varchar(20) | `REF3` |
| `REF4` | varchar(20) | `REF4` |
| `RESPCODE` | int | `RESPCODE` |
| `RESPMSG` | varchar(100) | `RESPMSG` |
| `BALANCE` | decimal(18,2) | `BALANCE` |
| `PRINT1`–`PRINT7` | varchar(40) | `PRINT1`–`PRINT7` (ข้อความบน slip คืนธนาคาร) |
| `REQUEST_DATA` | varchar(4000) | `REQUEST_DATA` |
| `CREATEDATE` | datetime | `CREATEDATE` |
| `SHOW_MSG` | varchar(1) | `SHOW_MSG` (poll UI — มีใน `lifelong_dev.sql`) |

ลำดับคอลัมน์ต้องตรง dump (ดู entity / migration `1789780345000` / `5300`)  
Index เพิ่มของ buu-get (lifelong มีแค่ PK): `(REF1, REF2)`, `BANKREF`, `TRANXID`

### `LLTREQUESTPAYMENT` → `FIN_T_REQUEST_PAYMENT`

ชุดเดียวกับ approval **ยกเว้น**:

| ต่างจาก approval | Lifelong | buu-get |
|------------------|----------|---------|
| `INFO` | varchar(255) | `INFO` varchar(255) |
| `PRINT*` | มีแค่ `PRINT1` varchar(40) | เก็บแค่ `PRINT1` — อย่าสร้าง PRINT2–7 |

คอลัมน์อื่น (`USER`, `PASSWORD`, `TRANXID` varchar(20), `BANKCODE` int, `AMOUNT`/`BALANCE` decimal(18,2), `RESPCODE` int, …) ต้องเหมือน dump

### `LLTTRANSACTIONPAY` → `FIN_T_TRANSACTIONS` + refs

| Lifelong | buu-get | หมายเหตุ |
|----------|---------|----------|
| `ID` | `TRANX_ID` | PK ของ buu-get; ค่านี้คือ `tranxId` คืนธนาคาร |
| `TRANXID` varchar(20) | `TRANX_ID` (int) แปลงเป็น string ตอนส่ง/ลง log | ไม่ต้องมีคอลัมน์ string ซ้ำบน txn |
| `ENROLL_ID` | `ERM_ID` | |
| `ENROLL_REF1` varchar(7) | `FIN_T_TRANSACTIONS_REFS.TSC_REF1` | รหัสผู้สมัคร (ตัวเลข) |
| `ENROLL_REF2` varchar(13) | `TSC_REF2` | รหัสรายการ + random |
| `ENROLL_AMOUNT` | `TRANX_AMOUNT` decimal(18,2) | lifelong เป็น int; buu-get เก็บทศนิยมตามยอดจริง |
| `TRAN_STATUS` (`Y` = มีการดำเนินการ) | `TRANX_PAYMENT_STATUS` | `PENDING`/`APPROVED`/`PAID`/… |
| `CREATEUSER` / `UPDATEUSER` / `UPDATEPROG` | ไม่มีบน txn | ไม่ต้อง copy — ใช้ `FIN_T_TRANSACTION_STATUS_HISTORY` |
| `CREATEDATE` / `UPDATEDATE` | `TRANX_CREATED_AT` / `TRANX_UPDATED_AT` | |
| `UPDATEDATEQR` | `TRANX_QR_CODE` + `TRANX_UPDATED_AT` | ไม่สร้างคอลัมน์ซ้ำ; เวลา gen QR อัปเดตทั้งคู่ |

---

## Checklist สิ่งที่ต้องทำ

### 1) Schema / เก็บข้อมูล

1. ออกแบบ mapping สถานะ lifelong ↔ `TRANX_PAYMENT_STATUS`
2. Migration ตาราง log ให้ **ชนิด/คอลัมน์ตรง dump** (`USER`, `PASSWORD`, `PRINT*`, `AMOUNT` decimal, `RESPCODE` int, `TRANXID` varchar) — 1 แถว = request+response
3. ตรวจ/เติม refs, amount, pay window ให้ครบบน txn (`ENROLL_REF1/2` ↔ `TSC_REF1/2`)
4. ใส่ index ที่จำเป็น: `(REF1, REF2)`, `TRANXID`, `BANKREF` (lifelong dump มีแค่ PK)
5. แยก path realtime กับ CSV ไม่ให้ชนกัน

### 2) API ให้ธนาคารเรียก (สัญญาเหมือน lifelong)

6. เปิด `POST /api/approval` และ `POST /api/payment` (สาธารณะ, ไม่ใช้ JWT session)
7. Request/Response body ให้ตรงสเปกธนาคาร (ฟิลด์เดียวกับ lifelong)
8. ตอบ HTTP 200 เสมอใน business case — ดูที่ `respCode`
9. Auth: ย้าย credentials ไป env/secret (อย่า hardcode แบบ lifelong)
10. ลงทะเบียน URL sandbox/prod กับธนาคาร

**สัญญาหลัก**

```text
Approval: ตรวจบิล → คืน tranxId → ยังไม่ PAID → เขียน log
Payment:  รับ tranxId → mark PAID → อัปเดต enrollment → เขียน log
```

`respCode` ที่ควรรองรับ: `0, 101, 103, 104, 105, 106, 108, 999`

### 3) Business logic

11. สร้างบิล/QR ตอนกดจ่าย (เทียบ `genpaycourse`): สร้าง/reuse txn PENDING + refs
12. Gen QR รูปแบบ Bill Payment: `|{taxId}{suffix}\r{ref1}\r{ref2}\r{amount}00`
13. Implement approval: auth → refs → ยังไม่จ่าย → มี txn เปิด → วันจ่าย → โควต้า → amount
14. Implement payment: หา `TRANX_ID` + ตรวจ refs → อัปเดต PAID + enrollment
15. ใช้ DB transaction / lock + idempotency (อย่า copy บั๊ก lifelong)
16. ตัดสินใจเรื่องใบเสร็จ: realtime สร้างทันที หรือรอ finance (lifelong realtime ไม่สร้าง `LLTPAYMENT`)

### 4) เสียบในโค้ด buu-get

17. สร้าง adapter เช่น `BillPaymentBankAdapter` บน `PaymentProvider`
18. `createIntent` → สร้าง txn + QR จริง
19. HTTP approval/payment เรียก logic ใน adapter/service
20. Feature flag เช่น `PAYMENT_MODE=csv|realtime_bank`

### 5) Frontend

21. หน้าจ่าย: แสดง REF1/REF2, amount, QR จริง, วันปิดรับเงิน
22. Poll สถานะ (เทียบ `checkpayment`) + โชว์ข้อความจากตาราง log
23. ปิดปุ่มจำลองจ่ายบน env ที่ต่อธนาคารจริง

### 6) Config / Ops / Test

24. Env: user/password ธนาคาร, taxId, suffix, comCode, prodCode
25. คง CSV reconcile ช่วง transition
26. ใช้ data test จาก lifelong เป็นชุดเทส base (happy + negative)
27. เทส sandbox กับธนาคารก่อนตัด realtime เป็นทางหลัก

---

## ลำดับทำแนะนำ

```text
1. Mapping + migration ตาราง log
2. Gen QR + refs ให้ตรงสเปก
3. /api/approval + /api/payment + adapter
4. ผูกอัปเดต enrollment / PAID
5. Frontend poll
6. ลงทะเบียน URL ธนาคาร + รัน data test
7. เปิด realtime คู่ CSV → สลับเมื่อมั่นใจ
```

---

## สิ่งที่ “เหมือน lifelong” ต้องได้ครบ

- [ ] ธนาคารเรียก approval แล้วได้ `tranxId`
- [ ] ธนาคารเรียก payment แล้วสถานะเป็นจ่ายแล้ว
- [ ] มี log request/response ทั้งสองขั้น
- [ ] QR เป็น Bill Payment (taxId + ref1 + ref2 + amount)
- [ ] UI รอ/poll แล้วรู้ว่าสำเร็จหรือ error จาก log
- [ ] Path CSV/offline ยังใช้ได้แยกจาก realtime

---

## อ้างอิงโค้ด

| Lifelong | buu-get |
|----------|---------|
| `ApprovalController`, `PaymentController` | สร้าง module/controller ใหม่ หรือต่อ `PaymentProvider` |
| `PrivilegeController@genpaycourse` | flow สร้าง txn + QR ใน `TransactionsService` / adapter |
| `Lltrequestapproval/payment` models | entity + migration ตาราง log ใหม่ |
| `routes/api.php` | NestJS public routes + throttle |
