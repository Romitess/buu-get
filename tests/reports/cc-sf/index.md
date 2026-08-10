# CC-SF Test Form Reports

> Generated from `tests/MASTER_TEST_PLAN.md` + Pass/Fail overlay from `PROGRESS.md` / `BUG_LOG.md`
> Generated at: 2026-08-07T08:59:08.631Z

| Batch | Folder | Cases | Pass | Fail | Skip | 128 PDF | 129 PDF |
|---|---|---:|---:|---:|---:|---|---|
| 1 Auth & Access | [`Batch-01-Auth`](./Batch-01-Auth/) | 173 | 170 | 1 | 2 | [128](./Batch-01-Auth/CC-SF-03-128-ตารางรายการ.pdf) | [129](./Batch-01-Auth/CC-SF-03-129-แบบฟอร์มการทดสอบ.pdf) |
| 2 Money / Payment | [`Batch-02-Money`](./Batch-02-Money/) | 198 | 196 | 1 | 1 | [128](./Batch-02-Money/CC-SF-03-128-ตารางรายการ.pdf) | [129](./Batch-02-Money/CC-SF-03-129-แบบฟอร์มการทดสอบ.pdf) |
| 3 Enrollment & Voucher | [`Batch-03-Enrollment`](./Batch-03-Enrollment/) | 150 | 150 | 0 | 0 | [128](./Batch-03-Enrollment/CC-SF-03-128-ตารางรายการ.pdf) | [129](./Batch-03-Enrollment/CC-SF-03-129-แบบฟอร์มการทดสอบ.pdf) |
| 4 Exam lifecycle | [`Batch-04-ExamLifecycle`](./Batch-04-ExamLifecycle/) | 56 | 51 | 4 | 1 | [128](./Batch-04-ExamLifecycle/CC-SF-03-128-ตารางรายการ.pdf) | [129](./Batch-04-ExamLifecycle/CC-SF-03-129-แบบฟอร์มการทดสอบ.pdf) |
| 5 Scores & Certificates | [`Batch-05-ScoresCert`](./Batch-05-ScoresCert/) | 71 | 69 | 2 | 0 | [128](./Batch-05-ScoresCert/CC-SF-03-128-ตารางรายการ.pdf) | [129](./Batch-05-ScoresCert/CC-SF-03-129-แบบฟอร์มการทดสอบ.pdf) |
| 6 Profile & identity | [`Batch-06-Profile`](./Batch-06-Profile/) | 41 | 41 | 0 | 0 | [128](./Batch-06-Profile/CC-SF-03-128-ตารางรายการ.pdf) | [129](./Batch-06-Profile/CC-SF-03-129-แบบฟอร์มการทดสอบ.pdf) |
| 7 Exam report | [`Batch-07-ExamReport`](./Batch-07-ExamReport/) | 20 | 20 | 0 | 0 | [128](./Batch-07-ExamReport/CC-SF-03-128-ตารางรายการ.pdf) | [129](./Batch-07-ExamReport/CC-SF-03-129-แบบฟอร์มการทดสอบ.pdf) |

**รวม:** 709 เคส · ผ่าน 697 · ไม่ผ่าน 8 · ข้าม 4

## หมายเหตุสถานะ

- ค่าเริ่มต้นของเคสใน batch ที่ rollout แล้ว = **ผ่าน** (ตามหลักฐาน PROGRESS ไม่ได้รันเทสใหม่ทั้งชุดตอนสร้างรายงานนี้)
- เคสที่ skip เพราะบั๊กผลิตภัณฑ์ (VERIFY-E-001, BR-E-002, SCR-E-001, …) = **ไม่ผ่าน** พร้อมอ้าง BUG
- เคสที่ skip เพราะข้อจำกัด env/fixture (AUTH-I-013, VERIFY-I-007, BR-I-003, EXAM-I-002) = **ข้าม (skip)**
- PROF-I-006 / PEH-I-005 = **ผ่าน** ตามพฤติกรรมปัจจุบันที่ assert ไว้ พร้อมบันทึก BUG-011/012
- ตัดออก: THAID-*, PROF-U-012, IMG-U-004, PEH-U-006, PEH-E-002 และ Batch 7 extras

## Regenerate

```bash
node tests/scripts/generate-cc-sf-reports.mjs
```
