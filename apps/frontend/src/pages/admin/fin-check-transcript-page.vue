<template>
  <q-page class="page-container fin-check-transcript-page">
    <!-- Breadcrumbs -->
    <app-breadcrumbs />

    <!-- Page Header -->
    <app-page-header :title="t('admin.finCheckTranscript.pageTitle')" />

    <!-- Search and Filters Area -->
    <div class="row q-mb-md items-center justify-between">
      <div class="col-12 col-sm-5">
        <search-bar
          v-model="searchQuery"
          :placeholder="t('admin.finCheckTranscript.searchPlaceholder')"
          class="full-width"
        />
      </div>
      <div class="col-auto">
        <search-user />
      </div>
    </div>

    <!-- Table Card -->
    <q-card flat bordered class="q-mt-sm">
      <q-card-section class="q-pa-none">
        <fin-check-transcript-table
          :rows="filteredRows"
          :loading="isLoading"
          @save-row="handleSaveRow"
        />
      </q-card-section>
    </q-card>

    <!-- Action Bar below Table -->
    <div class="row justify-center q-mt-md">
      <div class="col-12 col-sm-4">
        <fin-save-transcription :disabled="hasUnresolvedRows" :rows="transcriptRows" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import SearchUser from 'src/components/finance/search-user.vue';
import FinSaveTranscription from 'src/components/finance/fin-save-transcription.vue';
import FinCheckTranscriptTable from 'src/components/finance/fin-check-transcript-table.vue';
import { globalImportedRows } from 'src/composables/use-payment-import';
import {
  matchBankReconciles,
  updateBankReconcileRefs,
  type BankReconcileMatchResult,
} from 'src/services/bank-reconcile.service';
import type { PaymentRow } from '../../types/exam.types';

export interface ExtendedPaymentRow extends PaymentRow {
  brId: number;
  tranxId?: number | null;
}

const { t } = useI18n();
const $q = useQuasar();

const searchQuery = ref('');

const transcriptRows = ref<ExtendedPaymentRow[]>([]);
const isLoading = ref(false);

const formatCurrency = (amount: string | number): string => {
  if (!amount) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(num)) return String(amount);
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const loadData = async () => {
  isLoading.value = true;
  try {
    const refsArray: { ref1: string; ref2: string }[] = [];
    globalImportedRows.value.forEach((row) => {
      refsArray.push({
        ref1: row.applicantId && row.applicantId !== '-' ? row.applicantId : '',
        ref2: row.referenceNo && row.referenceNo !== '-' ? row.referenceNo : '',
      });
    });

    let matchedData: BankReconcileMatchResult[] = [];
    if (refsArray.length > 0) {
      matchedData = await matchBankReconciles(refsArray);
    }

    transcriptRows.value = globalImportedRows.value.map((imported) => {
      const matched = matchedData.find((m) => {
        const ref1Match =
          imported.applicantId && imported.applicantId !== '-'
            ? m.TSC_REF1 === imported.applicantId
            : true;
        const ref2Match =
          imported.referenceNo && imported.referenceNo !== '-'
            ? m.TSC_REF2 === imported.referenceNo
            : true;
        // Require at least one to match if both are present
        return ref1Match && ref2Match;
      });

      return {
        brId: imported.brId,
        id: imported.index,
        file_payment_date: imported.paymentDate,
        file_payment_time: imported.paymentTime,
        file_ref: imported.applicantId,
        file_ref2: imported.referenceNo,
        file_payer: imported.payerName,
        file_amount: formatCurrency(imported.amount),
        db_ref: matched?.TSC_REF1 ?? '',
        db_ref2: matched?.TSC_REF2 ?? '',
        db_applicant_name: matched?.APPLICANT_NAME ?? '',
        db_amount: matched?.TRANX_AMOUNT != null ? formatCurrency(matched.TRANX_AMOUNT) : '',
        tranxId: matched ? matched.TRANX_ID : null,
      };
    });
  } catch (err) {
    console.error('Failed to load data:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  void loadData();
});

// Filtered rows based on the search query
const filteredRows = computed(() => {
  if (!searchQuery.value) return transcriptRows.value;
  const query = searchQuery.value.trim().toLowerCase();
  return transcriptRows.value.filter((row) => {
    return (
      row.file_payer.toLowerCase().includes(query) ||
      row.file_ref.includes(query) ||
      row.file_ref2.includes(query) ||
      row.db_ref.includes(query) ||
      row.db_ref2.includes(query) ||
      row.db_applicant_name.toLowerCase().includes(query) ||
      row.db_amount.includes(query)
    );
  });
});

const hasUnresolvedRows = computed(() => {
  return transcriptRows.value.length === 0 || transcriptRows.value.some((row) => !row.db_ref);
});

const handleSaveRow = async ({
  rowId,
  ref1,
  ref2,
}: {
  rowId: number;
  ref1: string;
  ref2: string;
}) => {
  const row = transcriptRows.value.find((r) => r.id === rowId);
  if (row) {
    const normalizedRef1 = ref1.trim();
    const normalizedRef2 = ref2.trim();

    if (!normalizedRef1) {
      $q.notify({
        type: 'warning',
        message: 'กรุณากรอก Ref 1',
        position: 'top',
      });
      return;
    }

    if (row.brId <= 0) {
      row.file_ref = normalizedRef1;
      row.file_ref2 = normalizedRef2;
      const importedRow = globalImportedRows.value.find((item) => item.index === row.id);
      if (importedRow) {
        importedRow.applicantId = normalizedRef1;
        importedRow.referenceNo = normalizedRef2;
      }

      isLoading.value = true;
      try {
        const matchedData = await matchBankReconciles([
          { ref1: normalizedRef1, ref2: normalizedRef2 },
        ]);
        const matched = matchedData.length > 0 ? matchedData[0] : null;
        row.db_ref = matched?.TSC_REF1 ?? '';
        row.db_ref2 = matched?.TSC_REF2 ?? '';
        row.db_applicant_name = matched?.APPLICANT_NAME ?? '';
        row.db_amount = matched?.TRANX_AMOUNT != null ? formatCurrency(matched.TRANX_AMOUNT) : '';
        row.tranxId = matched ? matched.TRANX_ID : null;
        $q.notify({
          type: 'positive',
          message: 'ปรับเลขอ้างอิงแล้ว จะบันทึกพร้อมออกใบเสร็จ',
          position: 'top',
        });
      } catch (err) {
        console.error('Failed to rematch payment refs:', err);
        $q.notify({
          type: 'negative',
          message: 'ไม่สามารถจับคู่เลขอ้างอิงได้',
          position: 'top',
        });
      } finally {
        isLoading.value = false;
      }
      return;
    }

    isLoading.value = true;
    try {
      const updatedBankReconcile = await updateBankReconcileRefs(row.brId, {
        BR_REF1: normalizedRef1,
        BR_REF2: normalizedRef2 || null,
      });

      row.file_ref = updatedBankReconcile.BR_REF1;
      row.file_ref2 = updatedBankReconcile.BR_REF2 ?? '';

      const importedRow = globalImportedRows.value.find((item) => item.brId === row.brId);
      if (importedRow) {
        importedRow.applicantId = row.file_ref;
        importedRow.referenceNo = row.file_ref2;
      }

      const matchedData = await matchBankReconciles([{ ref1: row.file_ref, ref2: row.file_ref2 }]);
      const matched = matchedData.length > 0 ? matchedData[0] : null;

      row.db_ref = matched?.TSC_REF1 ?? '';
      row.db_ref2 = matched?.TSC_REF2 ?? '';
      row.db_applicant_name = matched?.APPLICANT_NAME ?? '';
      row.db_amount = matched?.TRANX_AMOUNT != null ? formatCurrency(matched.TRANX_AMOUNT) : '';
      row.tranxId = matched ? matched.TRANX_ID : null;
      $q.notify({
        type: 'positive',
        message: 'บันทึกข้อมูลไฟล์การเงินสำเร็จ',
        position: 'top',
      });
    } catch (err) {
      console.error('Failed to update bank reconcile refs:', err);
      $q.notify({
        type: 'negative',
        message: 'ไม่สามารถบันทึกข้อมูลไฟล์การเงินได้',
        position: 'top',
      });
    } finally {
      isLoading.value = false;
    }
  }
};
</script>

<style scoped lang="scss">
/* Page specific styles, dialog styles removed to component */
</style>
