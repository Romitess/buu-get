<template>
  <q-page class="page-container history-page">
    <AppBreadcrumbs />
    <AppPageHeader
      title="ประวัติการสอบ"
      subtitle="แสดงประวัติการสอบทั้งหมดของผู้สมัครสอบ รวมถึงรายละเอียดคะแนนที่ผู้สมัครสอบได้รับในแต่ละรอบการสอบ"
    />

    <PageSkeleton v-if="isLoading" :show-header="false">
      <CardSkeleton height="160px" :lines="3" class="q-mb-lg" />
      <TableSkeleton :columns="columns" :rows="6" />
    </PageSkeleton>

    <div v-else-if="enrollment" class="history-content">
      <ProfileSummaryCard :enrollment="enrollment" class="q-mb-lg" />

      <main>
        <BaseTable
          :columns="columns"
          :rows="historyRows"
          :loading="isLoadingHistory"
          :pagination="pagination"
          class="history-table"
        >
          <template v-slot:body-cell-index="{ row }">
            <div class="text-center">{{ row.index }}</div>
          </template>

          <template v-slot:body-cell-examRound="{ row }">
            <div class="text-center">{{ row.examRound }}</div>
          </template>

          <template v-slot:body-cell-examDate="{ row }">
            <div class="text-center">{{ row.examDate }}</div>
          </template>

          <template v-slot:body-cell-langUseScore="{ row }">
            <div class="text-center">{{ row.langUseScore ?? '-' }}</div>
          </template>

          <template v-slot:body-cell-readingScore="{ row }">
            <div class="text-center">{{ row.readingScore ?? '-' }}</div>
          </template>

          <template v-slot:body-cell-totalScore="{ row }">
            <div class="text-center text-weight-bold">{{ row.totalScore ?? '-' }}</div>
          </template>

          <template v-slot:body-cell-bandLevel="{ row }">
            <div class="text-center">{{ row.bandLevel ?? '-' }}</div>
          </template>

          <template v-slot:body-cell-certificate="{ row }">
            <div class="row justify-center no-wrap">
              <ActionButton
                v-if="row.hasCertificate"
                icon="description"
                tooltip="ดูใบ Certificate"
                color="black"
                @click="viewCertificate(row)"
              />
              <span v-else>-</span>
            </div>
          </template>
        </BaseTable>
      </main>
    </div>

    <!-- Dialog for Certificate View Mode -->
    <DialogIssueCertificate
      v-model="showCertDialog"
      :exam-date="selectedExamDate"
      :session-id="enrollment?.SESSION_ID"
      :session-name="computedSessionName"
      :candidates="[]"
      :view-mode="true"
      :candidate-info="selectedCandidateInfo"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import type { QTableColumn } from 'quasar';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import BaseTable from 'src/components/shared/base-table.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import ProfileSummaryCard from 'src/components/shared/profile-summary-card.vue';
import DialogIssueCertificate from 'src/components/exam/dialog-issue-certificate.vue';
import { fetchEnrollmentById } from 'src/services/enrollment.service';
import { fetchExecutiveExamHistory } from 'src/services/executive-test-taker.service';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';
import type { ExecutiveExamScoreLine, ExamHistoryRow } from 'src/types/executive-test-taker.types';
import { formatExamInstanceLabel } from 'src/utils/exam-instance-label';
import { PageSkeleton, CardSkeleton, TableSkeleton } from 'src/components/base/skeleton';

interface CandidateInfo {
  fullname: string;
  userCode: string;
  nationalId: string;
  scoreGrammar: number;
  scoreReading: number;
  scoreTotal: number;
  scoreLines?: ExecutiveExamScoreLine[];
  band: number;
  userPhoto?: string | undefined;
  certIssuedAt?: string | undefined;
  certExpiresAt?: string | undefined;
  certCode?: string | undefined;
}

const route = useRoute();
const $q = useQuasar();

const enrollment = ref<BackendEnrollmentDetail | null>(null);
const historyRows = ref<ExamHistoryRow[]>([]);
const isLoading = ref(true);
const isLoadingHistory = ref(true);

const showCertDialog = ref(false);
const selectedExamDate = ref<string | Date | null>(null);
const selectedCandidateInfo = ref<CandidateInfo | null>(null);

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns = computed<QTableColumn<ExamHistoryRow>[]>(() => [
  {
    name: 'index',
    label: 'ลำดับ',
    field: 'index',
    align: 'center',
    style: 'width: 80px',
  },
  {
    name: 'examRound',
    label: 'ครั้งที่จัดสอบ',
    field: 'examRound',
    align: 'center',
  },
  {
    name: 'examDate',
    label: 'วันที่สอบ',
    field: 'examDate',
    align: 'center',
  },
  {
    name: 'langUseScore',
    label: 'คำศัพท์และไวยากรณ์',
    field: 'langUseScore',
    align: 'center',
  },
  {
    name: 'readingScore',
    label: 'ทักษะการอ่าน',
    field: 'readingScore',
    align: 'center',
  },
  {
    name: 'totalScore',
    label: 'คะแนนรวม',
    field: 'totalScore',
    align: 'center',
  },
  {
    name: 'bandLevel',
    label: 'Level',
    field: 'bandLevel',
    align: 'center',
  },
  {
    name: 'certificate',
    label: 'Certificate',
    field: 'certificateId',
    align: 'center',
    style: 'width: 100px',
  },
]);

const computedSessionName = computed((): string => {
  if (!enrollment.value?.SESSION) return '';
  const exam = enrollment.value.SESSION.EXAM;
  const instance = formatExamInstanceLabel(exam?.EXAM_ROUND, exam?.EXAM_FISCAL_YEAR);
  if (instance) return instance;
  const examDate = exam?.EXAM_DATE;
  const year = examDate ? new Date(examDate).getFullYear() + 543 : new Date().getFullYear() + 543;
  return `1/${year}`;
});

const loadData = async (): Promise<void> => {
  const ermId = Number(route.params.ermId);
  if (!ermId) {
    $q.notify({
      type: 'negative',
      message: 'ไม่พบข้อมูลใบสมัครสอบ',
      position: 'bottom',
    });
    isLoading.value = false;
    isLoadingHistory.value = false;
    return;
  }

  try {
    isLoading.value = true;
    enrollment.value = await fetchEnrollmentById(ermId);
  } catch (err) {
    console.error('Error fetching enrollment detail:', err);
    $q.notify({
      type: 'negative',
      message: 'ดึงข้อมูลประวัติผู้สมัครไม่สำเร็จ',
      position: 'bottom',
    });
  } finally {
    isLoading.value = false;
  }

  try {
    isLoadingHistory.value = true;
    const response = await fetchExecutiveExamHistory(ermId);
    historyRows.value = response.examHistory || [];
    pagination.value.rowsNumber = historyRows.value.length;
  } catch (err) {
    console.error('Error fetching exam history logs:', err);
    $q.notify({
      type: 'negative',
      message: 'ดึงประวัติผลคะแนนสอบไม่สำเร็จ',
      position: 'bottom',
    });
  } finally {
    isLoadingHistory.value = false;
  }
};

const viewCertificate = (row: ExamHistoryRow): void => {
  if (!enrollment.value) return;

  const user = enrollment.value.USER;
  const profile = user?.PROFILE;

  const title = profile?.userTitleTh || '';
  const firstName = profile?.userFullnameTh || '';
  const fullName = `${title}${firstName}`.trim() || profile?.userFullnameEn || '';

  selectedCandidateInfo.value = {
    fullname: fullName,
    userCode: enrollment.value.ERM_TEST_TAKER || '',
    nationalId: user?.USER_NATIONAL_ID || user?.USER_PASSPORT_NO || '-',
    scoreGrammar: row.langUseScore ?? 0,
    scoreReading: row.readingScore ?? 0,
    scoreTotal: row.totalScore ?? 0,
    ...(row.scoreLines ? { scoreLines: row.scoreLines } : {}),
    band: row.bandLevel ?? 0,
    userPhoto:
      user?.USER_IMAGE || profile?.userImagePath || user?.IMAGE?.USER_IMAGE_URL || undefined,
    certIssuedAt: row.certIssuedAt || undefined,
    certExpiresAt: row.certExpiresAt || undefined,
    certCode: row.certCode || undefined,
  };

  selectedExamDate.value = row.examDate;
  showCertDialog.value = true;
};

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
@media (max-width: 1023px) {
  .page-container {
    width: 100% !important;
    min-width: 0 !important;
  }
}

.history-page {
  min-height: 0 !important;
}

.history-table {
  :deep(.q-table__container) {
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
  }
}
</style>
