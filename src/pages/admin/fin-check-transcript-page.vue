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
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import SearchUser from 'src/components/finance/search-user.vue';
import FinSaveTranscription from 'src/components/finance/fin-save-transcription.vue';
import FinCheckTranscriptTable from 'src/components/finance/fin-check-transcript-table.vue';
import { globalImportedRows } from 'src/composables/use-payment-import';
import { fetchMatchedEnrollments } from 'src/services/enrollment.service';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import type { PaymentRow } from '../../types/exam.types';

const { t } = useI18n();

const searchQuery = ref('');

const transcriptRows = ref<PaymentRow[]>([]);
const isLoading = ref(false);
const allEnrollments = ref<BackendEnrollmentDetail[]>([]);

const formatCurrency = (amount: string | number): string => {
  if (!amount) return '-';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;
  if (isNaN(num)) return String(amount);
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const findMatchingEnrollment = (ref1: string, ref2: string) => {
  return allEnrollments.value.find(
    (e) =>
      e.USER?.USER_NATIONAL_ID === ref1 || String(e.ERM_ID) === ref1 || String(e.ERM_ID) === ref2,
  );
};

const loadData = async () => {
  isLoading.value = true;
  try {
    // Extract unique references from imported rows
    const uniqueRefs = new Set<string>();
    globalImportedRows.value.forEach((row) => {
      if (row.applicantId && row.applicantId !== '-') uniqueRefs.add(row.applicantId);
      if (row.referenceNo && row.referenceNo !== '-') uniqueRefs.add(row.referenceNo);
    });

    const refsArray = Array.from(uniqueRefs);

    // Call the new optimized API endpoint to fetch only matched records
    if (refsArray.length > 0) {
      allEnrollments.value = await fetchMatchedEnrollments(refsArray);
    } else {
      allEnrollments.value = [];
    }

    transcriptRows.value = globalImportedRows.value.map((imported) => {
      const matched = findMatchingEnrollment(imported.applicantId, imported.referenceNo);

      return {
        id: imported.index,
        file_payment_date: imported.paymentDate,
        file_payment_time: imported.paymentTime,
        file_ref: imported.applicantId,
        file_ref2: imported.referenceNo,
        file_payer: imported.payerName,
        file_amount: formatCurrency(imported.amount),
        db_ref: matched ? matched.USER?.USER_NATIONAL_ID || String(matched.ERM_ID) : '',
        db_ref2: matched ? String(matched.ERM_ID) : '',
        db_name: matched ? matched.USER?.PROFILE?.userFullnameTh || '-' : '',
        db_amount: matched?.SESSION?.EXAM?.EXAM_FEE
          ? formatCurrency(matched.SESSION.EXAM.EXAM_FEE)
          : '',
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
      row.db_name.toLowerCase().includes(query) ||
      row.db_ref.includes(query) ||
      row.db_ref2.includes(query)
    );
  });
});

const hasUnresolvedRows = computed(() => {
  return transcriptRows.value.length === 0 || transcriptRows.value.some((row) => !row.db_ref);
});

const handleSaveRow = ({ rowId, ref1, ref2 }: { rowId: number; ref1: string; ref2: string }) => {
  const row = transcriptRows.value.find((r) => r.id === rowId);
  if (row) {
    row.file_ref = ref1;
    row.file_ref2 = ref2;

    // Re-match against the modified refs
    const matched = findMatchingEnrollment(ref1, ref2);

    row.db_ref = matched ? matched.USER?.USER_NATIONAL_ID || String(matched.ERM_ID) : '';
    row.db_ref2 = matched ? String(matched.ERM_ID) : '';
    row.db_name = matched ? matched.USER?.PROFILE?.userFullnameTh || '-' : '';
    row.db_amount = matched?.SESSION?.EXAM?.EXAM_FEE
      ? formatCurrency(matched.SESSION.EXAM.EXAM_FEE)
      : '';
  }
};
</script>

<style scoped lang="scss">
/* Page specific styles, dialog styles removed to component */
</style>
