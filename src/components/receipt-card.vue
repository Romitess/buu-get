<template>
  <div class="receipt-container q-mx-auto">
    <!-- Header Section -->
    <div class="row items-start justify-between q-mb-xl">
      <div class="row items-center">
        <q-img
          src="/buu-logo.png"
          style="width: 90px; height: 90px"
          fit="contain"
          class="q-mr-md"
        />
        <div>
          <div class="text-subtitle1 text-weight-bold receipt-org-title">
            {{ buuInfo.nameTH }} {{ buuInfo.nameEN }}
          </div>
          <div class="text-caption text-grey-8 receipt-org-meta">
            {{ buuInfo.addressTH }}<br />
            {{ buuInfo.addressEN }}<br />
            เลขประจำตัวผู้เสียภาษีอากร (Tax ID) {{ buuInfo.taxId }}
          </div>
        </div>
      </div>
      <div class="text-right q-mt-sm">
        <div class="text-subtitle1 text-weight-bold">ใบเสร็จรับเงิน</div>
        <div class="text-subtitle2 text-weight-bold" style="letter-spacing: 1px">RECEIPT</div>
      </div>
    </div>

    <!-- Meta Info Section -->
    <div class="row justify-end q-mb-md">
      <div class="text-caption text-grey-8">วันที่ (Date) {{ formattedDate }}</div>
    </div>

    <div class="q-mb-xl text-caption text-grey-9" style="line-height: 2">
      <div>เลขที่ใบเสร็จรับเงิน (Receipt No.) &nbsp;&nbsp;{{ receipt.receiptNo }}</div>
      <div>ได้รับเงินจาก (Received form) &nbsp;&nbsp;{{ receipt.fullName }}</div>
      <div class="q-mt-sm">
        เลขประจำตัวผู้เสียภาษีอากร (Tax No.) &nbsp;&nbsp;{{ receipt.nationalId }}
      </div>
      <div>ที่อยู่ (Address) &nbsp;&nbsp;{{ receipt.address || '-' }}</div>
    </div>

    <!-- Table Section -->
    <div class="receipt-table-wrapper relative-position q-mb-xl">
      <!-- Watermark -->
      <div class="watermark-container absolute-center">
        <q-img
          src="/buu-logo.png"
          style="width: 300px; opacity: 0.15; filter: grayscale(100%)"
          fit="contain"
        />
      </div>

      <table class="receipt-table">
        <thead>
          <tr>
            <th class="col-no">ลำดับ<br />(No.)</th>
            <th class="col-desc">รายการ<br />(Description)</th>
            <th class="col-amount">จำนวนเงิน/บาท</th>
          </tr>
        </thead>
        <tbody>
          <!-- Item Row -->
          <tr>
            <td class="text-center q-pt-md">1</td>
            <td class="q-pt-md">{{ receipt.examName }}</td>
            <td class="text-right q-pt-md">{{ formatCurrency(receipt.amount) }}</td>
          </tr>
          <!-- Spacer Row to push total down -->
          <tr class="spacer-row">
            <td></td>
            <td></td>
            <td></td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" class="text-left q-px-md">
              รวมเงิน (total) {{ numberToThaiText(receipt.amount) }}
            </td>
            <td class="text-right">{{ formatCurrency(receipt.amount) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Footer Section -->
    <div
      class="row justify-between text-caption text-grey-8"
      style="line-height: 1.6; font-size: 11px"
    >
      <div class="col-9">
        <div>URL ตรวจสอบใบเสร็จอิเล็กทรอนิกส์ E-receipt verification URL</div>
        <div class="q-mb-md">{{ buuInfo.receiptVerifyUrl }}</div>
        <div>หมายเหตุ :</div>
        <div class="q-pl-lg q-mb-sm">
          1. ใบเสร็จรับเงินนี้ได้ดำเนินการด้วยวิธีการทางอิเล็กทรอนิกส์ และผู้ชำระเงินสามารถสแกน QR
          Code นี้เพื่อตรวจสอบความถูกต้อง/<br />
          <span class="text-grey-6"
            >This receipt has been issued by electronic means. The payer can scan the QR code to
            verify its accuracy.</span
          >
        </div>
        <div class="q-pl-lg">
          2. ใบเสร็จรับเงินฉบับนี้จะสมบูรณ์เมื่อได้รับชำระเงินเรียบร้อยแล้ว
          และมีลายมือชื่อของผู้รับเงินครบถ้วน/<br />
          <span class="text-grey-6"
            >This receipt will be valid when the full payment is received and signed by the bill
            collector.</span
          >
        </div>
      </div>

      <div class="col-3 flex column items-end">
        <div class="signature-box flex flex-center q-mb-sm text-grey-7">ภาพลายมือชื่อ</div>
        <div class="text-center q-mb-sm" style="width: 140px">
          ( &nbsp;&nbsp;{{ receipt.fullName }} &nbsp;&nbsp;)<br />
          ผู้รับเงิน (Collector)
        </div>
        <q-img
          v-if="showQr"
          src="/receipt-qr.png"
          style="width: 90px; height: 90px"
          fit="contain"
          class="q-mt-sm"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ReceiptCardProps } from 'src/types/receipt';
import { buuInfo } from 'src/services/university.service';
import { numberToThaiText } from 'src/utils/thai-currency';

const props = withDefaults(defineProps<ReceiptCardProps>(), {
  showQr: true,
});

// Computed properties for formatting
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
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap');

.receipt-container {
  width: 210mm;
  min-height: 297mm;
  margin: 20px auto;
  background-color: var(--surface-card);
  padding: 20mm;
  font-family: 'Sarabun', sans-serif;
  color: var(--receipt-text);
  box-shadow: var(--receipt-shadow);
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
}

.receipt-org-title {
  letter-spacing: 0.5px;
}

.receipt-org-meta {
  line-height: 1.3;
  font-size: 11px;
}

/* Table Styles */
.receipt-table-wrapper {
  width: 100%;
  flex-grow: 1; /* Allow table section to take up available space */
}

.receipt-table {
  width: 100%;
  border-collapse: collapse;
  z-index: 1;
  position: relative;
}

.receipt-table th,
.receipt-table td {
  border: 1px solid var(--receipt-border);
  padding: 10px 15px;
}

.receipt-table th {
  text-align: center;
  font-weight: 500;
  color: var(--receipt-text-light);
  padding: 15px 10px;
  background-color: var(--receipt-header-bg);
}

.receipt-table tbody td {
  border-top: none;
  border-bottom: none;
  vertical-align: top;
}

.spacer-row td {
  height: 400px; /* Increased height to fill A4 space better */
}

.receipt-table tfoot td {
  border-top: 1px solid var(--receipt-border);
  font-weight: 600;
  padding: 15px;
}

.col-no {
  width: 10%;
}

.col-desc {
  width: 70%;
}

.col-amount {
  width: 20%;
}

.watermark-container {
  z-index: 0;
  pointer-events: none;
}

.signature-box {
  width: 140px;
  height: 60px;
  border: 1px solid var(--receipt-signature-border);
  font-size: 12px;
}

/* Print specific styles */
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
    padding: 20mm;
    margin: 0;
    box-shadow: none;
    border: none;
  }
}
</style>
