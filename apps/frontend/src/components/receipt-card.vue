<template>
  <div class="receipt-container q-mx-auto">
    <!-- ═══════════════════════════════════════════════
         HEADER: Logo + Org Info (left) | Title + Date (right)
    ════════════════════════════════════════════════ -->
    <div class="receipt-header">
      <!-- Left: Logo + University info -->
      <div class="receipt-header-left">
        <img src="/buu-logo.png" class="receipt-logo" alt="BUU Logo" />
        <div class="receipt-org-info">
          <div class="receipt-org-title">{{ buuInfo.nameTH }} {{ buuInfo.nameEN }}</div>
          <div class="receipt-org-meta">
            {{ buuInfo.addressTH }}<br />
            {{ buuInfo.addressEN }}<br />
            {{ t('exam.card.taxIdLabel') }} {{ buuInfo.taxId }}
          </div>
        </div>
      </div>

      <!-- Right: Title stacked, date below -->
      <div class="receipt-header-right">
        <div class="receipt-title-th">{{ receiptTitleTh }}</div>
        <div class="receipt-title-en">{{ receiptTitleEn }}</div>
      </div>
    </div>

    <!-- Date row: right-aligned, below header -->
    <div class="receipt-date-row">{{ t('exam.card.date') }} {{ formattedDate }}</div>

    <!-- ═══════════════════════════════════════════════
         META INFO: Receipt No / Received From (group 1)
                    Tax No / Address (group 2)
    ════════════════════════════════════════════════ -->
    <div class="receipt-meta-group">
      <div class="receipt-meta-line">
        <span class="receipt-meta-label">{{ t('exam.card.receiptNo') }}</span>
        <span class="receipt-meta-value">{{ receipt.receiptNo }}</span>
      </div>
      <div class="receipt-meta-line">
        <span class="receipt-meta-label">{{ t('exam.card.receivedFrom') }}</span>
        <span class="receipt-meta-value">{{ receipt.fullName }}</span>
      </div>
    </div>

    <div class="receipt-meta-group receipt-meta-group--second">
      <div class="receipt-meta-line">
        <span class="receipt-meta-label">{{ t('exam.card.taxNo') }}</span>
        <span class="receipt-meta-value">{{ receipt.nationalId }}</span>
      </div>
      <div class="receipt-meta-line">
        <span class="receipt-meta-label">{{ t('exam.card.address') }}</span>
        <span class="receipt-meta-value">{{ receipt.address || '-' }}</span>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════
         TABLE
    ════════════════════════════════════════════════ -->
    <div class="receipt-table-wrapper">
      <!-- Watermark inside table area -->
      <div class="watermark-container">
        <img src="/buu-logo.png" class="receipt-watermark" alt="Watermark Logo" />
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th class="col-no">
              {{ t('exam.card.tableNoLabel') }}<br />
              ({{ t('exam.card.tableNoShort') }})
            </th>
            <th class="col-desc">
              {{ t('exam.card.tableDescLabel') }}<br />
              ({{ t('exam.card.tableDescShort') }})
            </th>
            <th class="col-amount">{{ t('exam.card.tableAmount') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr class="data-row">
            <td class="text-center">1</td>
            <td>{{ t('exam.card.itemDescription') }}</td>
            <td class="text-right">{{ formatCurrency(receipt.amount) }}</td>
          </tr>
          <!-- spacer pushes tfoot down — 3 cells รักษา border แต่ละ column -->
          <tr class="spacer-row">
            <td class="spacer-cell"></td>
            <td class="spacer-cell"></td>
            <td class="spacer-cell"></td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="total-label-cell">
              {{ t('exam.card.totalLabel') }} {{ numberToThaiText(receipt.amount) }}
            </td>
            <td class="total-amount-cell text-right">
              {{ formatCurrency(receipt.amount) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- ═══════════════════════════════════════════════
         FOOTER: URL + Notes (left) | Signature + Name + QR (right)
    ════════════════════════════════════════════════ -->
    <div class="receipt-footer">
      <!-- Left: URL & Notes -->
      <div class="receipt-footer-left">
        <div class="footer-line">{{ t('exam.card.verifyUrl') }}</div>
        <div class="footer-line footer-url q-mb-sm">{{ buuInfo.receiptVerifyUrl }}</div>
        <div class="footer-line q-mb-xs">{{ t('exam.card.notes') }}</div>
        <div class="footer-note q-mb-xs">
          {{ t('exam.card.note1') }}<br />
          <span class="footer-note-en">{{ t('exam.card.note1En') }}</span>
        </div>
        <div class="footer-note">
          {{ t('exam.card.note2') }}<br />
          <span class="footer-note-en">{{ t('exam.card.note2En') }}</span>
        </div>
      </div>

      <!-- Right: Signature box → Name → QR -->
      <div class="receipt-footer-right">
        <div class="signature-box">{{ t('exam.card.signatureBox') }}</div>
        <div class="collector-name">
          ( {{ receipt.fullName }} )<br />
          {{ t('exam.card.collector') }}
        </div>
        <img
          v-if="showQr && receipt.qrDataUrl"
          :src="receipt.qrDataUrl"
          class="receipt-qr"
          alt="Receipt QR"
        />
        <div v-if="receipt.verifyCode" class="verify-code-text">{{ receipt.verifyCode }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { ReceiptCardProps } from 'src/types/receipt';
import { buuInfo } from 'src/services/university.service';
import { numberToThaiText } from 'src/utils/thai-currency';

const props = withDefaults(defineProps<ReceiptCardProps>(), {
  showQr: true,
  isCopy: false,
});

const { t } = useI18n();

const receiptTitleTh = computed<string>(() =>
  props.isCopy ? 'สำเนาใบเสร็จรับเงิน' : t('exam.card.title'),
);

const receiptTitleEn = computed<string>(() => (props.isCopy ? 'RECEIPT COPY' : 'RECEIPT'));

const formattedDate = computed(() => {
  if (!props.receipt.transactionDate) return 'xx/xx/xxxx';
  const date = new Date(props.receipt.transactionDate);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
});

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
</script>

<style scoped>
/* ──────────────────────────────────────────────────
   ROOT CONTAINER  (A4)
────────────────────────────────────────────────── */
.receipt-container {
  width: 210mm;
  min-height: 297mm;
  margin: 20px auto;
  background-color: var(--surface-card);
  padding: 16mm 16mm 14mm;
  font-family: var(--font-family-base);
  color: var(--receipt-text);
  font-size: 12px;
  box-shadow: var(--receipt-shadow);
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* ──────────────────────────────────────────────────
   HEADER
────────────────────────────────────────────────── */
.receipt-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.receipt-header-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.receipt-logo {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  object-fit: contain;
}

.receipt-org-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.receipt-org-title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.3px;
  line-height: 1.4;
}

.receipt-org-meta {
  font-size: 11px;
  color: var(--receipt-text-light, #555);
  line-height: 1.5;
}

/* Right block: title */
.receipt-header-right {
  text-align: right;
  flex-shrink: 0;
}

.receipt-title-th {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.3px;
  line-height: 1.4;
}

.receipt-title-en {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
  line-height: 1.3;
}

/* Date row: flush right, below header block */
.receipt-date-row {
  text-align: right;
  font-size: 11.5px;
  color: var(--receipt-text-light, #555);
  margin-bottom: 14px;
  margin-top: 2px;
}

/* ──────────────────────────────────────────────────
   META INFO
────────────────────────────────────────────────── */
.receipt-meta-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11.5px;
  color: var(--receipt-text, #222);
}

/* Gap between group 1 and group 2 */
.receipt-meta-group--second {
  margin-top: 10px;
  margin-bottom: 14px;
}

.receipt-meta-group:first-of-type {
  margin-bottom: 0;
}

.receipt-meta-line {
  display: flex;
  align-items: baseline;
}

.receipt-meta-label {
  /* fixed width so values align */
  min-width: 220px;
  font-size: 11.5px;
  color: var(--receipt-text, #222);
  line-height: 1.8;
}

.receipt-meta-value {
  flex: 1;
  font-size: 11.5px;
  line-height: 1.8;
  white-space: pre-wrap;
}

/* ──────────────────────────────────────────────────
   TABLE
────────────────────────────────────────────────── */
.receipt-table-wrapper {
  position: relative;
  width: 100%;
  height: 150mm; /* เพิ่มจาก 120mm → 150mm */
  flex-shrink: 0;
  margin-bottom: 10px;
}

/* Watermark sits behind the table */
.watermark-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
}

.receipt-watermark {
  width: 200px;
  opacity: 0.13;
  filter: grayscale(100%);
  object-fit: contain;
}

.receipt-table {
  width: 100%;
  border-collapse: collapse;
  position: relative;
  z-index: 1;
  /* ใช้ table-layout fixed + height 100% เพื่อให้ tbody ยืดได้ */
  table-layout: fixed;
}

/* All cells share base border */
.receipt-table th,
.receipt-table td {
  border: 1px solid var(--receipt-border, #bbb);
  padding: 10px 14px;
  font-size: 12px;
}

/* THEAD */
.receipt-table thead th {
  text-align: center;
  font-weight: 600;
  background-color: transparent;
  color: var(--receipt-text, #222);
  padding: 12px 14px;
  line-height: 1.4;
}

/* TBODY data row */
.receipt-table tbody td {
  vertical-align: top;
  border-top: none;
  border-bottom: none;
}

/* SPACER ROW — 150mm ≈ 567px − thead(44) − data-row(44) − tfoot(46) ≈ 433px */
.spacer-row .spacer-cell {
  height: 390px;
  padding: 0;
  border-top: none;
  border-bottom: none;
}

/* TFOOT */
.receipt-table tfoot td {
  border-top: 1px solid var(--receipt-border, #bbb);
  border-bottom: 1px solid var(--receipt-border, #bbb);
  font-weight: 600;
}

.total-label-cell {
  padding: 12px 14px;
}

.total-amount-cell {
  padding: 12px 14px;
}

/* Column widths */
.col-no {
  width: 10%;
}
.col-desc {
  width: 70%;
}
.col-amount {
  width: 20%;
}

/* ──────────────────────────────────────────────────
   FOOTER
────────────────────────────────────────────────── */
.receipt-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  font-size: 11px;
  line-height: 1.3;
  color: var(--receipt-text-light, #555);
}

.receipt-footer-left {
  flex: 1;
}

.footer-line {
  font-size: 11px;
  line-height: 1.3;
}

.footer-url {
  color: var(--receipt-text, #222);
}

.footer-note {
  padding-left: 14px;
  font-size: 11px;
  line-height: 1.3;
  margin-bottom: 2px;
}

.footer-note-en {
  color: #888;
}

/* Right column */
.receipt-footer-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 150px;
}

.signature-box {
  width: 150px;
  height: 54px;
  border: 1px solid var(--receipt-signature-border, #aaa);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--receipt-text-light, #777);
  margin-bottom: 4px;
}

.collector-name {
  text-align: center;
  font-size: 11px;
  line-height: 1.3;
  color: var(--receipt-text, #222);
  margin-bottom: 4px;
  width: 150px;
}

.receipt-qr {
  width: 90px;
  height: 90px;
  object-fit: contain;
}

.verify-code-text {
  margin-top: 4px;
  font-size: 8px;
  line-height: 1.2;
  max-width: 150px;
  word-break: break-all;
  text-align: center;
  color: #334155;
  font-weight: 600;
}

/* ──────────────────────────────────────────────────
   PRINT
────────────────────────────────────────────────── */
@media print {
  @page {
    size: A4;
    margin: 0;
  }

  body {
    margin: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .receipt-container {
    width: 210mm;
    height: 297mm;
    padding: 16mm 16mm 14mm;
    margin: 0;
    box-shadow: none;
    border: none;
  }
}
</style>
