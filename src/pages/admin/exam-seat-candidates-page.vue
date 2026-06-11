<template>
  <q-page class="page-container seat-candidates-page">
    <!-- Breadcrumbs -->
    <AppBreadcrumbs />

    <!-- Page Header -->
    <AppPageHeader
      :title="$t('admin.seatCandidates.pageTitle')"
      :subtitle="$t('admin.seatCandidates.pageSubtitle')"
    />

    <!-- Session Time Tabs -->
    <AppExamSessionTabs v-model="selectedSessionId" :sessions="sessionTimeTabs" />

    <!-- Exam Info Card -->
    <AppExamInfoCard
      v-if="exam"
      v-model:selected-location-id="selectedSessionLocationId"
      class="q-mb-md"
      :title="exam.EXAM_NAME"
      :date="examDateLabel"
      :time="sessionTime"
      :location="sessionLocation"
      :location-options="roomOptions"
      :applicant-count="candidateCount"
      :total-capacity="sessionCapacity"
      hide-paid
      hide-main-separator
      is-admin
    />

    <!-- Toolbar: Search + Action Buttons -->
    <nav class="toolbar-section row items-center q-mb-md q-gutter-md">
      <SearchBar v-model="searchQuery" class="col-12 col-sm-auto" />

      <q-space class="gt-xs" />

      <div class="row q-gutter-sm col-12 col-sm-auto justify-end">
        <AppButton
          v-if="!isVoucherSent"
          icon="badge"
          :label="$t('admin.seatCandidates.printVoucher')"
          color="primary"
          class="action-btn"
          @click="handlePrintVoucher"
        />
        <ExportCsvButton
          :columns="columns"
          :rows="filteredRows"
          file-name-prefix="seat-candidates"
          class="action-btn"
        />
      </div>
    </nav>

    <!-- Table -->
    <main>
      <BaseTable
        :columns="columns"
        :rows="filteredRows"
        :loading="isLoading"
        :pagination="pagination"
        class="seat-candidates-table"
        @request="onRequest"
      />
    </main>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import DialogIssueTicket from 'src/components/exam/dialog-issue-ticket.vue';

import BaseTable from 'src/components/shared/base-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSessionTabs from 'src/components/exam/app-exam-session-time.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppButton from 'src/components/base/app-button.vue';
import { useExamSeatCandidates } from 'src/composables/use-exam-seat-candidates';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import { EnrollmentStatus } from 'src/types/enrollment.types';
import { bulkIssueVouchers } from 'src/services/voucher.service';
import { updateEnrollmentStatus } from 'src/services/enrollment.service';
import { updateExamSessionStatus } from 'src/services/exam.service';
import { formatThaiLongDate } from 'src/utils/thai-date';
import type { VoucherData } from 'src/types/voucher';
import {
  EXAM_TYPE_GENERAL,
  EXAM_TYPE_SPECIAL,
  INTERNAL_EXAM_TYPE_SPECIAL,
} from 'src/constants/exam';

const SESSION_STATUS_VOUCHER_SENT = 3;

const getExamRoundTypeLabel = (): string => {
  const examType = exam.value?.EXAM_TYPE?.trim().toLowerCase();
  if (examType === INTERNAL_EXAM_TYPE_SPECIAL || examType === EXAM_TYPE_SPECIAL.toLowerCase()) {
    return EXAM_TYPE_SPECIAL;
  }
  return EXAM_TYPE_GENERAL;
};

const route = useRoute();
const router = useRouter();
const i18n = useI18n();
const $q = useQuasar();

const {
  exam,
  sessions,
  sessionTimeTabs,
  isLoading,
  searchQuery,
  selectedSessionId,
  selectedSessionLocationId,
  roomOptions,
  filteredRows,
  candidateCount,
  sessionTime,
  sessionLocation,
  sessionCapacity,
  sessionEnrollments,
  activeSessionIds,
  isVoucherSent,
  getTimeTabSessionId,
  fetchData,
} = useExamSeatCandidates();

// Resolves a localized month name by 0-based index from i18n (type-safe, no cast)
const getMonthName = (monthIndex: number): string => i18n.t(`common.months[${monthIndex}]`);

const examDateLabel = computed((): string =>
  exam.value ? formatThaiLongDate(exam.value.EXAM_DATE, getMonthName) : '-',
);

const voucherPreviewData = computed<VoucherData>(() => ({
  id: sessionEnrollments.value[0]?.ERM_ID ?? 0,
  fullName: 'XX. XXXXXX XXXXXX',
  studentId: 'XXXXXXXX',
  examName: exam.value?.EXAM_NAME || 'BUU-GET Exam',
  examDate: examDateLabel.value,
  examTime: sessionTime.value,
  examType: getExamRoundTypeLabel(),
  location: sessionLocation.value,
  seatNo: 'XX',
  voucherNo: 'ENG2026-001',
  citizenId: 'X-XXXX-XXXXX-XX-X',
  testSession: 'X/XXXX',
  barcodeValue: 'ENG2026-001',
}));

const startIssuingTickets = async (): Promise<void> => {
  if (!sessionEnrollments.value || sessionEnrollments.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'ไม่พบรายชื่อผู้เข้าสอบในรอบนี้',
      position: 'top',
      timeout: 2500,
    });
    return;
  }

  $q.loading.show({
    message: 'กำลังออกบัตรประจำตัวสอบและจัดส่งอีเมลแจ้งเตือนผู้เข้าสอบทั้งหมด...',
  });

  try {
    // Resolve the exact absolute URL correctly using Vue Router (handles Hash mode / History mode automatically)
    const resolvedRoute = router.resolve({ name: 'exam-history' });
    const historyUrl = new URL(
      resolvedRoute.href,
      import.meta.env.VITE_APP_URL || window.location.origin,
    ).href;

    const ermIds = sessionEnrollments.value
      .filter((enrollment) => enrollment && enrollment.ERM_ID)
      .map((enrollment) => enrollment.ERM_ID);

    const examName = exam.value?.EXAM_NAME || 'BUU-GET Exam';

    // Perform bulk voucher issuance and bulk email dispatch in a single optimized request
    await bulkIssueVouchers({
      ermIds,
      examName,
      historyUrl,
    });

    await Promise.all(
      sessionEnrollments.value.map((enrollment) =>
        updateEnrollmentStatus(enrollment.ERM_ID, {
          ERM_STATUS: EnrollmentStatus.SEAT_PUBLISHED,
        }),
      ),
    );

    await Promise.all(
      activeSessionIds.value.map((sessionId) =>
        updateExamSessionStatus(sessionId, SESSION_STATUS_VOUCHER_SENT),
      ),
    );

    const examId = Number(route.params.examId);
    if (!isNaN(examId) && examId > 0) {
      await fetchData(examId);
    }

    $q.notify({
      type: 'positive',
      message: 'ออกบัตรประจำตัวและส่งอีเมลหาผู้เข้าสอบทุกคนสำเร็จเรียบร้อยแล้ว!',
      icon: 'check_circle',
      position: 'top',
      timeout: 3000,
      actions: [{ icon: 'close', color: 'white' }],
    });
  } catch (error) {
    console.error('Failed to issue tickets:', error);
    $q.notify({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการออกบัตรหรือส่งอีเมล กรุณาลองใหม่อีกครั้ง',
      icon: 'report_problem',
      position: 'top',
      timeout: 3500,
      actions: [{ icon: 'close', color: 'white' }],
    });
  } finally {
    $q.loading.hide();
  }
};

const handlePrintVoucher = (): void => {
  $q.dialog({
    component: DialogIssueTicket,
    componentProps: {
      sessionDetails: {
        date: examDateLabel.value,
        time: sessionTime.value,
        room: sessionLocation.value,
        studentCount: candidateCount.value,
      },
      voucherData: voucherPreviewData.value,
    },
  }).onOk(() => {
    void startIssuingTickets();
  });
};

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns: QTableColumn[] = [
  {
    name: 'index',
    label: i18n.t('admin.seatCandidates.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 8%',
  },
  {
    name: 'nationalId',
    label: i18n.t('admin.seatCandidates.table.columns.nationalId'),
    field: 'nationalId',
    align: 'center',
    style: 'width: 20%',
  },
  {
    name: 'titleTh',
    label: i18n.t('admin.seatCandidates.table.columns.prefix'),
    field: 'titleTh',
    align: 'center',
    style: 'width: 10%',
  },
  {
    name: 'fullnameTh',
    label: i18n.t('admin.seatCandidates.table.columns.fullName'),
    field: 'fullnameTh',
    align: 'left',
    style: 'width: 35%; padding-left: 16%',
  },
  {
    name: 'seatNumber',
    label: i18n.t('admin.seatCandidates.table.columns.seatNumber'),
    field: 'seatNumber',
    align: 'center',
    style: 'width: 15%',
    classes: 'text-weight-bold',
  },
];

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

watch(filteredRows, (newVal) => {
  pagination.value.rowsNumber = newVal.length;
});

watch(exam, (newExam) => {
  if (newExam?.SESSIONS?.length && !selectedSessionId.value) {
    const firstSession = newExam.SESSIONS[0];
    if (firstSession) {
      selectedSessionId.value = firstSession.SS_ID;
    }
  }
});

watch(
  [selectedSessionId, roomOptions],
  () => {
    const firstRoomId = roomOptions.value[0]?.value ?? null;
    if (firstRoomId === null) {
      selectedSessionLocationId.value = null;
      return;
    }

    if (!roomOptions.value.some((option) => option.value === selectedSessionLocationId.value)) {
      selectedSessionLocationId.value = firstRoomId;
    }
  },
  { immediate: true },
);

const loadData = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (!isNaN(examId) && examId > 0) {
    await fetchData(examId);
    const routeSessionId = Number(route.query.sessionId);
    if (
      !isNaN(routeSessionId) &&
      sessions.value.some((session) => session.SS_ID === routeSessionId)
    ) {
      selectedSessionId.value = getTimeTabSessionId(routeSessionId) ?? routeSessionId;
    }

    const routeSessionLocationId = Number(route.query.sessionLocationId);
    if (
      !isNaN(routeSessionLocationId) &&
      roomOptions.value.some((option) => option.value === routeSessionLocationId)
    ) {
      selectedSessionLocationId.value = routeSessionLocationId;
    }

    pagination.value.rowsNumber = filteredRows.value.length;
  }
};

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.action-btn {
  height: 40px;
  min-width: 160px;

  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
  }
}

.seat-candidates-table {
  :deep(.q-table__container) {
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
  }
}
</style>
