-- =============================================================================
-- Reset การจ่ายเงิน + ย้อนสถานะ enrollment
-- ERM_ID = 2153  (buu-get)
-- =============================================================================
-- สิ่งที่ทำ:
--   1) ลบ log bank callback (approval/payment) ตาม REF1/REF2 ของ txn
--   2) ลบใบเสร็จ / voided / status history / refs / profile ที่ผูก TRANX
--   3) ปลดลิงก์ bank reconcile (ไม่ลบไฟล์ reconcile ทั้งก้อน)
--   4) ลบแถว FIN_T_TRANSACTIONS ของ ERM นี้
--   5) ตั้ง EXAM_T_ENROLLMENTS.ERM_STATUS = 0 (UNPAID)
--
-- คำเตือน: รันบน DB ที่ตั้งใจจริงเท่านั้น — สำรองข้อมูลก่อนถ้าเป็น prod
-- =============================================================================

SET @erm_id := 2153;

-- -----------------------------------------------------------------------------
-- 0) Preview (รันก่อนเสมอ)
-- -----------------------------------------------------------------------------
SELECT e.ERM_ID, e.USER_ID, e.SESSION_ID, e.ERM_STATUS, e.CREATED_AT
FROM EXAM_T_ENROLLMENTS e
WHERE e.ERM_ID = @erm_id;

SELECT t.TRANX_ID, t.ERM_ID, t.TRANX_AMOUNT, t.TRANX_PAYMENT_STATUS,
       t.TRANX_PAID_AT, t.TRANX_MATCH_STATUS, t.DELETED_AT
FROM FIN_T_TRANSACTIONS t
WHERE t.ERM_ID = @erm_id;

SELECT r.TSR_ID, r.TRANX_ID, r.TSC_REF1, r.TSC_REF2, r.TSC_BANK_REF, r.BR_ID
FROM FIN_T_TRANSACTIONS_REFS r
WHERE r.TRANX_ID IN (SELECT TRANX_ID FROM FIN_T_TRANSACTIONS WHERE ERM_ID = @erm_id);

SELECT a.ID, a.REF1, a.REF2, a.TRANXID, a.RESPCODE, a.RESPMSG, a.CREATEDATE
FROM FIN_T_REQUEST_APPROVAL a
WHERE (a.REF1, a.REF2) IN (
  SELECT r.TSC_REF1, r.TSC_REF2
  FROM FIN_T_TRANSACTIONS_REFS r
  INNER JOIN FIN_T_TRANSACTIONS t ON t.TRANX_ID = r.TRANX_ID
  WHERE t.ERM_ID = @erm_id
);

SELECT p.ID, p.REF1, p.REF2, p.TRANXID, p.RESPCODE, p.RESPMSG, p.CREATEDATE
FROM FIN_T_REQUEST_PAYMENT p
WHERE (p.REF1, p.REF2) IN (
  SELECT r.TSC_REF1, r.TSC_REF2
  FROM FIN_T_TRANSACTIONS_REFS r
  INNER JOIN FIN_T_TRANSACTIONS t ON t.TRANX_ID = r.TRANX_ID
  WHERE t.ERM_ID = @erm_id
);

SELECT rc.RC_ID, rc.TRANX_ID, rc.RC_STATUS, rc.RC_NO
FROM FIN_T_RECEIPTS rc
WHERE rc.TRANX_ID IN (SELECT TRANX_ID FROM FIN_T_TRANSACTIONS WHERE ERM_ID = @erm_id);

-- -----------------------------------------------------------------------------
-- 1) Reset (ลบข้อมูลจ่าย + ย้อน UNPAID)
-- -----------------------------------------------------------------------------
START TRANSACTION;

-- temp: TRANX ของ ERM นี้
DROP TEMPORARY TABLE IF EXISTS tmp_erm_tranx;
CREATE TEMPORARY TABLE tmp_erm_tranx AS
SELECT TRANX_ID
FROM FIN_T_TRANSACTIONS
WHERE ERM_ID = @erm_id;

-- temp: REF1/REF2 สำหรับลบ callback log
DROP TEMPORARY TABLE IF EXISTS tmp_erm_refs;
CREATE TEMPORARY TABLE tmp_erm_refs AS
SELECT DISTINCT r.TSC_REF1 AS REF1, r.TSC_REF2 AS REF2
FROM FIN_T_TRANSACTIONS_REFS r
INNER JOIN tmp_erm_tranx x ON x.TRANX_ID = r.TRANX_ID
WHERE r.TSC_REF1 IS NOT NULL AND r.TSC_REF2 IS NOT NULL;

-- 1.1 bank callback logs
DELETE a
FROM FIN_T_REQUEST_APPROVAL a
INNER JOIN tmp_erm_refs rf ON rf.REF1 = a.REF1 AND rf.REF2 = a.REF2;

DELETE p
FROM FIN_T_REQUEST_PAYMENT p
INNER JOIN tmp_erm_refs rf ON rf.REF1 = p.REF1 AND rf.REF2 = p.REF2;

-- 1.2 voided receipts → receipts
DELETE vr
FROM FIN_T_VOIDED_RECEIPTS vr
INNER JOIN FIN_T_RECEIPTS rc ON rc.RC_ID = vr.RC_ID
INNER JOIN tmp_erm_tranx x ON x.TRANX_ID = rc.TRANX_ID;

DELETE rc
FROM FIN_T_RECEIPTS rc
INNER JOIN tmp_erm_tranx x ON x.TRANX_ID = rc.TRANX_ID;

-- 1.3 ปลดลิงก์ bank reconcile (คงแถว reconcile ไว้) แล้วลบ refs ทั้งแถว
-- หมายเหตุ: TSC_BANK_REF เป็น NOT NULL — ห้าม SET NULL ต้อง DELETE แถว refs
UPDATE FIN_T_BANK_RECONCILES br
INNER JOIN tmp_erm_tranx x ON x.TRANX_ID = br.TRANX_ID
SET br.TRANX_ID = NULL;

-- 1.4 status history / profile / refs (ลบ record การจ่ายเงินทิ้ง)
DELETE h
FROM FIN_T_TRANSACTION_STATUS_HISTORY h
INNER JOIN tmp_erm_tranx x ON x.TRANX_ID = h.TRANX_ID;

DELETE tp
FROM FIN_T_TRANSACTION_PROFILE tp
INNER JOIN tmp_erm_tranx x ON x.TRANX_ID = tp.TRANX_ID;

DELETE r
FROM FIN_T_TRANSACTIONS_REFS r
INNER JOIN tmp_erm_tranx x ON x.TRANX_ID = r.TRANX_ID;

-- 1.5 transactions
DELETE t
FROM FIN_T_TRANSACTIONS t
INNER JOIN tmp_erm_tranx x ON x.TRANX_ID = t.TRANX_ID;

-- 1.6 ย้อนสถานะ enrollment → UNPAID (0)
UPDATE EXAM_T_ENROLLMENTS
SET ERM_STATUS = 0,
    UPDATED_AT = NOW()
WHERE ERM_ID = @erm_id;

-- ตรวจก่อน commit
SELECT e.ERM_ID, e.ERM_STATUS
FROM EXAM_T_ENROLLMENTS e
WHERE e.ERM_ID = @erm_id;

SELECT COUNT(*) AS remaining_tranx
FROM FIN_T_TRANSACTIONS
WHERE ERM_ID = @erm_id;

COMMIT;
-- ถ้าผลไม่ถูก: ROLLBACK; แทน COMMIT;

-- Soft reset ไม่แนะนำ: TSC_BANK_REF เป็น NOT NULL และต้องการลบ record การจ่ายเงินทิ้ง
-- ใช้บล็อก DELETE ด้านบนเท่านั้น
