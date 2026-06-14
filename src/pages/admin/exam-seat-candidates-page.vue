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
          :icon="isVoucherSent ? 'print' : 'badge'"
          :label="
            isVoucherSent
              ? $t('admin.seatCandidates.printSeatPlan')
              : $t('admin.seatCandidates.printVoucher')
          "
          color="primary"
          class="toolbar-action-btn"
          @click="isVoucherSent ? handlePrintSeatPlan() : handlePrintVoucher()"
        />
        <ExportCsvButton
          :columns="columns"
          :rows="filteredRows"
          file-name-prefix="seat-candidates"
          class="toolbar-action-btn"
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
      >
        <template v-slot:body-cell-tools="{ row }">
          <div class="row justify-center">
            <ActionButton
              v-if="isVoucherSent"
              icon="badge"
              color="black"
              :tooltip="$t('admin.seatCandidates.viewVoucher')"
              @click="handleViewVoucher(row)"
            />
          </div>
        </template>
      </BaseTable>
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
import DialogViewVoucher from 'src/components/exam/dialog-view-voucher.vue';

import BaseTable from 'src/components/shared/base-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSessionTabs from 'src/components/exam/app-exam-session-time.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppButton from 'src/components/base/app-button.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import {
  useExamSeatCandidates,
  type SeatCandidateRow,
} from 'src/composables/use-exam-seat-candidates';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import { EnrollmentStatus } from 'src/types/enrollment.types';
import { bulkIssueVouchers } from 'src/services/voucher.service';
import { updateEnrollmentStatus } from 'src/services/enrollment.service';
import { updateExamSessionStatus } from 'src/services/exam.service';
import type { VoucherData } from 'src/types/voucher';
import { getImageUrl } from 'src/services/image.service';
import {
  EXAM_TYPE_GENERAL,
  EXAM_TYPE_SPECIAL,
  INTERNAL_EXAM_TYPE_SPECIAL,
} from 'src/constants/exam';

const SESSION_STATUS_VOUCHER_SENT = 3;
const SESSION_STATUS_SEAT_ALLOCATED = 2;

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

const examDateLabel = computed((): string => {
  if (!exam.value?.EXAM_DATE) return '-';
  const date = new Date(exam.value.EXAM_DATE);
  if (isNaN(date.getTime())) return exam.value.EXAM_DATE;
  const day = date.getDate();
  const month = getMonthName(date.getMonth());
  const isThai = i18n.locale.value.startsWith('th');
  const year = date.getFullYear() + (isThai ? 543 : 0);
  return `${day} ${month} ${year}`;
});

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

const buildVoucherData = (row: SeatCandidateRow): VoucherData => {
  const enrollment = row.enrollment;
  const profile = enrollment.USER?.PROFILE;
  const title = profile?.userTitleEn || profile?.userTitleTh || '';
  const fullName = profile?.userFullnameEn || profile?.userFullnameTh || '';
  const location = enrollment.SESSION_LOCATION?.LOCATION;
  const voucherCode = enrollment.VOUCHERS?.[0]?.VC_CODE || '-';
  const imagePath =
    enrollment.USER?.IMAGE?.USER_IMAGE_URL ||
    enrollment.USER?.USER_IMAGE ||
    profile?.userImagePath ||
    undefined;

  return {
    id: enrollment.ERM_ID,
    fullName: `${title} ${fullName}`.trim() || '-',
    studentId: enrollment.ERM_TEST_TAKER || '-',
    examName: exam.value?.EXAM_NAME || 'BUU-GET Exam',
    examDate: examDateLabel.value,
    examTime: sessionTime.value,
    examType: getExamRoundTypeLabel(),
    location: location?.LOCATION_NAME || sessionLocation.value,
    locationRoom: location?.LOCATION_ROOM_NO || undefined,
    seatNo: row.seatNumber,
    voucherNo: voucherCode,
    citizenId: enrollment.USER?.USER_NATIONAL_ID || enrollment.USER?.USER_PASSPORT_NO || '-',
    testSession: '-',
    profileImage: imagePath ? getImageUrl(imagePath) : undefined,
    barcodeValue: voucherCode,
  };
};

const handleViewVoucher = (row: SeatCandidateRow): void => {
  $q.dialog({
    component: DialogViewVoucher,
    componentProps: {
      voucherData: buildVoucherData(row),
      candidateCount: candidateCount.value,
    },
  });
};

const handlePrintSeatPlan = (): void => {
  window.print();
};

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns = computed<QTableColumn[]>(() => {
  const baseColumns: QTableColumn[] = [
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

  if (isVoucherSent.value) {
    baseColumns.push({
      name: 'tools',
      label: i18n.t('admin.seatCandidates.table.columns.tools'),
      field: 'tools',
      align: 'center',
      headerClasses: 'tools-column',
      classes: 'tools-column',
    });
  }

  return baseColumns;
});

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
    const hasAllocatedSession = sessions.value.some(
      (session) => Number(session.SS_SESSION_STATUS) >= SESSION_STATUS_SEAT_ALLOCATED,
    );
    if (!hasAllocatedSession) {
      await router.replace({
        name: 'admin-exam-seat-management',
        params: { examId: String(examId) },
      });
      return;
    }

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
.toolbar-action-btn {
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

  :deep(.tools-column) {
    width: 80px !important;
    min-width: 80px !important;
    max-width: 80px !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
}
</style>
