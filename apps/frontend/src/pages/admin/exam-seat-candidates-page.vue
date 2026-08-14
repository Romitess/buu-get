<template>
  <q-page class="page-container seat-candidates-page">
    <q-inner-loading :showing="isPrintingSeatPlan" color="primary">
      <q-spinner-gears size="50px" color="primary" />
      <div class="q-mt-md text-body1 text-weight-medium">กำลังสร้างไฟล์แผนผังที่นั่ง...</div>
    </q-inner-loading>

    <!-- Breadcrumbs -->
    <AppBreadcrumbs />

    <!-- Page Header -->
    <AppPageHeader
      :title="$t('admin.seatCandidates.pageTitle')"
      :subtitle="$t('admin.seatCandidates.pageSubtitle')"
    />

    <!-- Session Time Tabs -->
    <AppExamSessionTabs v-model="selectedSessionId" :sessions="sessionTimeTabs" />

    <!-- Exam Info Card (all rooms in time slot — no room picker) -->
    <AppExamInfoCard
      v-if="exam"
      class="q-mb-md"
      :title="
        formatExamDisplayTitle(exam.EXAM_NAME, exam.EXAM_ROUND, exam.EXAM_FISCAL_YEAR) ||
        exam.EXAM_NAME
      "
      :date="examDateLabel"
      :time="sessionTime"
      :location="sessionLocation"
      :location-options="[]"
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
          icon="edit"
          :label="$t('admin.seatCandidates.editSeats')"
          color="secondary"
          class="toolbar-action-btn"
          :disable="isActionLoading || isPrintingSeatPlan"
          @click="handleEditSeats"
        />
        <span class="toolbar-action-btn-wrap">
          <AppButton
            :icon="isVoucherSent ? 'print' : 'badge'"
            :label="
              isVoucherSent
                ? $t('admin.seatCandidates.printSeatPlan')
                : $t('admin.seatCandidates.printVoucher')
            "
            color="primary"
            class="toolbar-action-btn"
            :loading="isActionLoading || isPrintingSeatPlan"
            :disable="isActionLoading || isPrintingSeatPlan || (!isVoucherSent && !canIssueVoucher)"
            @click="isVoucherSent ? handlePrintSeatPlan() : handlePrintVoucher()"
          />
          <q-tooltip v-if="!isVoucherSent && !canIssueVoucher">
            {{ $t('admin.seatCandidates.printVoucherDisabledHint') }}
          </q-tooltip>
        </span>
        <AppButton
          icon="download"
          :label="$t('admin.seatCandidates.exportByRoom')"
          class="toolbar-action-btn"
          :loading="isExporting"
          :disable="isActionLoading || isExporting"
          @click="handleExportByRoom"
        />
      </div>
    </nav>

    <!-- Table -->
    <main>
      <BaseTable
        :columns="columns"
        :rows="filteredRows"
        :loading="isLoading || isActionLoading || isPrintingSeatPlan"
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

    <Teleport to="body">
      <div v-if="isPrintingSeatPlan" class="seat-print-render-root" aria-hidden="true">
        <section class="seat-plan-print-area seat-print-page">
          <AppExamSeatPlanPrint
            :room-label="printRoomLabel"
            :exam-round="printExamRoundLabel"
            :seats-by-row="printSeatPlanRows"
            :aisle-after-cols="printAisleAfterCols"
            :aisle-after-rows="printAisleAfterRows"
            :seat-direction="printSeatDirection"
            :layout-rows="printSeatRowCount"
            :layout-cols="printSeatColCount"
          />
        </section>

        <section class="seat-list-print-area seat-print-page">
          <div class="seat-list-print">
            <header class="seat-list-print__header">
              <h1>ใบรายชื่อผู้เข้าสอบ</h1>
              <p v-if="printExamRoundLabel">ครั้งที่ {{ printExamRoundLabel }}</p>
              <p>{{ printRoomLabel }}</p>
            </header>

            <table class="seat-list-print__table">
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>เลขประจำตัวผู้สอบ</th>
                  <th>คำนำหน้า</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>Full Name</th>
                  <th>ที่นั่ง</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in printCandidateRows" :key="row.ermId">
                  <td>{{ row.index }}</td>
                  <td>{{ row.nationalId }}</td>
                  <td>{{ row.titleTh }}</td>
                  <td class="text-left">{{ row.fullnameTh }}</td>
                  <td class="text-left">{{ row.fullnameEn }}</td>
                  <td>{{ row.seatNumber }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Teleport>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import { date, useQuasar } from 'quasar';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import DialogIssueTicket from 'src/components/exam/dialog-issue-ticket.vue';
import DialogViewVoucher from 'src/components/exam/dialog-view-voucher.vue';

import BaseTable from 'src/components/shared/base-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import { downloadMultiSheetXlsx, groupRowsByKey } from 'src/utils/export-table-xlsx';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSessionTabs from 'src/components/exam/app-exam-session-time.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppButton from 'src/components/base/app-button.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import AppExamSeatPlanPrint from 'src/components/exam/app-exam-seat-plan-print.vue';
import {
  useExamSeatCandidates,
  type SeatCandidateRow,
} from 'src/composables/use-exam-seat-candidates';
import type { SeatCell, SeatStatus } from 'src/composables/use-exam-seat-management';
import type { BackendLocation } from 'src/types/exam';
import { formatExamDisplayTitle, formatExamInstanceLabel } from 'src/utils/exam-instance-label';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';
import { bulkIssueVouchers } from 'src/services/voucher.service';
import { fetchEnrollmentById } from 'src/services/enrollment.service';
import type { VoucherData } from 'src/types/voucher';
import { getImageUrl } from 'src/services/image.service';
import {
  EXAM_TYPE_GENERAL,
  EXAM_TYPE_SPECIAL,
  INTERNAL_EXAM_TYPE_SPECIAL,
} from 'src/constants/exam';

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
const isActionLoading = ref(false);

const {
  exam,
  sessions,
  sessionTimeTabs,
  activeSessionLocation,
  activeSessionSeatSnapshot,
  activeLocation,
  isLoading,
  searchQuery,
  selectedSessionId,
  selectedSessionLocationId,
  roomOptions,
  filteredRows,
  roomTableRows,
  candidateCount,
  sessionTime,
  sessionLocation,
  sessionCapacity,
  sessionEnrollments,
  seatedTimeSlotEnrollments,
  activeSessionIds,
  isVoucherSent,
  canIssueVoucher,
  getTimeTabSessionId,
  fetchData,
  applyVoucherIssuedState,
} = useExamSeatCandidates();

const isPrintingSeatPlan = ref(false);
const isExporting = ref(false);
type PrintLocationSeat = NonNullable<BackendLocation['SEATS']>[number];

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
  examName:
    formatExamDisplayTitle(
      exam.value?.EXAM_NAME,
      exam.value?.EXAM_ROUND,
      exam.value?.EXAM_FISCAL_YEAR,
    ) ||
    exam.value?.EXAM_NAME ||
    'BUU-GET Exam',
  examDate: examDateLabel.value,
  examTime: sessionTime.value,
  examType: getExamRoundTypeLabel(),
  location: sessionLocation.value,
  seatNo: 'XX',
  voucherNo: 'ENG2026-001',
  citizenId: 'X-XXXX-XXXXX-XX-X',
  testSession: 'X/XXXX',
  barcodeValue: 'XXXXXXXX',
}));

const startIssuingTickets = async (): Promise<void> => {
  if (!canIssueVoucher.value) {
    $q.notify({
      type: 'warning',
      message: i18n.t('admin.seatCandidates.printVoucherDisabledHint'),
      position: 'top',
      timeout: 2500,
    });
    throw new Error('Not all applicants have seats');
  }

  if (!seatedTimeSlotEnrollments.value || seatedTimeSlotEnrollments.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'ไม่พบรายชื่อผู้เข้าสอบในรอบนี้',
      position: 'top',
      timeout: 2500,
    });
    throw new Error('No enrollments in current session');
  }

  isActionLoading.value = true;
  $q.loading.show({ message: 'กำลังออกใบเข้าห้องสอบ...' });

  try {
    const resolvedRoute = router.resolve({ name: 'exam-history' });
    const historyUrl = new URL(
      resolvedRoute.href,
      import.meta.env.VITE_APP_URL || window.location.origin,
    ).href;

    const ermIds = seatedTimeSlotEnrollments.value
      .filter((enrollment) => enrollment && enrollment.ERM_ID)
      .map((enrollment) => enrollment.ERM_ID);

    const examName =
      formatExamDisplayTitle(
        exam.value?.EXAM_NAME,
        exam.value?.EXAM_ROUND,
        exam.value?.EXAM_FISCAL_YEAR,
      ) ||
      exam.value?.EXAM_NAME ||
      'BUU-GET Exam';

    const result = await bulkIssueVouchers({
      ermIds,
      examName,
      historyUrl,
      sessionIds: activeSessionIds.value,
    });

    const updatedSessionIds =
      result.updatedSessionIds.length > 0 ? result.updatedSessionIds : activeSessionIds.value;

    applyVoucherIssuedState(updatedSessionIds, ermIds);

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
    throw error;
  } finally {
    isActionLoading.value = false;
    $q.loading.hide();
  }
};

const handleEditSeats = (): void => {
  const examId = Number(route.params.examId);
  if (isNaN(examId) || examId <= 0) return;

  void router.push({
    name: 'admin-exam-seat-management',
    params: { examId: String(examId) },
    query: {
      sessionId: String(selectedSessionId.value),
      ...(selectedSessionLocationId.value !== null
        ? { sessionLocationId: String(selectedSessionLocationId.value) }
        : {}),
    },
  });
};

const handlePrintVoucher = (): void => {
  if (!canIssueVoucher.value) {
    $q.notify({
      type: 'warning',
      message: i18n.t('admin.seatCandidates.printVoucherDisabledHint'),
      position: 'top',
      timeout: 2500,
    });
    return;
  }

  $q.dialog({
    component: DialogIssueTicket,
    componentProps: {
      sessionDetails: {
        date: examDateLabel.value,
        time: sessionTime.value,
        room: sessionLocation.value,
        studentCount: seatedTimeSlotEnrollments.value.length,
      },
      voucherData: voucherPreviewData.value,
      onConfirm: startIssuingTickets,
    },
  });
};

const buildVoucherData = (row: SeatCandidateRow, freshEnrollment = row.enrollment): VoucherData => {
  const enrollment = freshEnrollment;
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
    examName:
      formatExamDisplayTitle(
        exam.value?.EXAM_NAME,
        exam.value?.EXAM_ROUND,
        exam.value?.EXAM_FISCAL_YEAR,
      ) ||
      exam.value?.EXAM_NAME ||
      'BUU-GET Exam',
    examDate: examDateLabel.value,
    examTime: sessionTime.value,
    examType: getExamRoundTypeLabel(),
    location: location?.LOCATION_NAME || sessionLocation.value,
    locationRoom: location?.LOCATION_ROOM_NO || undefined,
    seatNo: enrollment.ERM_SEAT_LABEL || row.seatNumber,
    voucherNo: voucherCode,
    citizenId: enrollment.USER?.USER_NATIONAL_ID || enrollment.USER?.USER_PASSPORT_NO || '-',
    testSession:
      formatExamInstanceLabel(exam.value?.EXAM_ROUND, exam.value?.EXAM_FISCAL_YEAR) || '-',
    profileImage: imagePath ? getImageUrl(imagePath) : undefined,
    // Code128 payload = Test Taker ID for door scanners / attendance
    barcodeValue: enrollment.ERM_TEST_TAKER || '',
  };
};

const handleViewVoucher = async (row: SeatCandidateRow): Promise<void> => {
  isActionLoading.value = true;
  try {
    const enrollment = await fetchEnrollmentById(row.ermId);
    $q.dialog({
      component: DialogViewVoucher,
      componentProps: {
        voucherData: buildVoucherData(row, enrollment),
        candidateCount: candidateCount.value,
      },
    });
  } catch (error) {
    console.error('Failed to load voucher data:', error);
    $q.notify({
      type: 'negative',
      message: 'ไม่สามารถโหลดข้อมูลตั๋วได้ กรุณาลองใหม่อีกครั้ง',
      position: 'top',
    });
  } finally {
    isActionLoading.value = false;
  }
};

const printLocation = computed(() => activeLocation.value);

const getLocationAisleAfter = (): { after_cols: number[]; after_rows: number[] } => {
  const location = printLocation.value;
  const combined = location?.LOCATION_AISLE_AFTER_COL ?? [];

  return {
    after_cols: [
      ...(location?.AISLE_AFTER_COLS ?? []),
      ...combined
        .filter((item): item is { type: 'column'; index: number } => {
          return typeof item === 'object' && item.type === 'column';
        })
        .map((item) => item.index),
      ...combined.filter((item): item is number => typeof item === 'number'),
    ],
    after_rows: [
      ...(location?.AISLE_AFTER_ROWS ?? []),
      ...combined
        .filter((item): item is { type: 'row'; index: number } => {
          return typeof item === 'object' && item.type === 'row';
        })
        .map((item) => item.index),
    ],
  };
};

const printAisleAfterCols = computed(
  (): number[] =>
    activeSessionLocation.value?.AISLE_AFTER?.after_cols ?? getLocationAisleAfter().after_cols,
);
const printAisleAfterRows = computed(
  (): number[] =>
    activeSessionLocation.value?.AISLE_AFTER?.after_rows ?? getLocationAisleAfter().after_rows,
);
const printSeatDirection = computed(
  (): 'HORIZONTAL' | 'VERTICAL' =>
    activeSessionLocation.value?.LOCATION_SEAT_DIRECTION ??
    printLocation.value?.LOCATION_SEAT_DIRECTION ??
    printLocation.value?.SEAT_DIRECTION ??
    'HORIZONTAL',
);

const printSeatRowCount = computed((): number => {
  if (activeSessionLocation.value?.TOTAL_ROWS != null) {
    return activeSessionLocation.value.TOTAL_ROWS;
  }

  const locationRows = printLocation.value?.LOCATION_TOTAL_ROWS ?? 0;
  const maxSeatRow = Math.max(
    0,
    ...(printLocation.value?.SEATS ?? []).map((seat) => seat.LS_ROW_NO),
  );

  return Math.max(locationRows, maxSeatRow);
});

const printSeatColCount = computed((): number => {
  if (activeSessionLocation.value?.TOTAL_COLS != null) {
    return activeSessionLocation.value.TOTAL_COLS;
  }

  const locationCols = printLocation.value?.LOCATION_TOTAL_COLS ?? 0;
  const maxSeatCol = Math.max(
    0,
    ...(printLocation.value?.SEATS ?? []).map((seat) => seat.LS_COL_NO),
  );

  return Math.max(locationCols, maxSeatCol);
});

const printSeatGuideLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const getPrintSeatLabel = (rowNo: number, colNo: number): string => {
  if (printSeatDirection.value === 'VERTICAL') {
    return `${printSeatGuideLetters[colNo - 1] ?? colNo}${rowNo}`;
  }

  return `${printSeatGuideLetters[rowNo - 1] ?? rowNo}${colNo}`;
};

const printExamRoundLabel = computed((): string =>
  formatExamInstanceLabel(exam.value?.EXAM_ROUND, exam.value?.EXAM_FISCAL_YEAR),
);

const printRoomLabel = computed((): string => {
  const location = printLocation.value;
  if (!location) return sessionLocation.value;

  const roomNo = location.LOCATION_ROOM_NO ? ` ห้อง ${location.LOCATION_ROOM_NO}` : '';
  const floorNo =
    location.LOCATION_FLOOR_NO !== null && location.LOCATION_FLOOR_NO !== undefined
      ? ` ชั้น ${location.LOCATION_FLOOR_NO}`
      : '';

  return `${location.LOCATION_NAME}${roomNo}${floorNo}`;
});

const printSeatPlanRows = computed((): SeatCell[][] => {
  const seats = printLocation.value?.SEATS ?? [];
  const snapshotByLabel = new Map(
    activeSessionSeatSnapshot.value
      .filter((seat) => seat.label)
      .map((seat) => [seat.label as string, seat]),
  );
  if (printSeatRowCount.value === 0 || printSeatColCount.value === 0) return [];

  const rows = Array.from({ length: printSeatRowCount.value }, (): SeatCell[] => []);
  const seatsByPosition = new Map<string, PrintLocationSeat>();
  const seatsByLabel = new Map<string, PrintLocationSeat>();

  seats.forEach((seat) => {
    seatsByPosition.set(`${seat.LS_ROW_NO}-${seat.LS_COL_NO}`, seat);
    if (seat.LS_SEAT_LABEL) {
      seatsByLabel.set(seat.LS_SEAT_LABEL, seat);
    }
  });

  for (let rowNo = 1; rowNo <= printSeatRowCount.value; rowNo += 1) {
    for (let colNo = 1; colNo <= printSeatColCount.value; colNo += 1) {
      const label = getPrintSeatLabel(rowNo, colNo);
      const seat = seatsByLabel.get(label) ?? seatsByPosition.get(`${rowNo}-${colNo}`);
      const snapshotSeat = snapshotByLabel.get(label);
      let status: SeatStatus = 'available';
      if (snapshotSeat?.status === 'BROKEN') {
        status = 'broken';
      } else if (snapshotSeat?.status === 'BLOCKED') {
        status = 'blocked';
      } else {
        const statusCode = Number(seat?.LS_SEAT_STATUS ?? 0);
        if (statusCode === 1) {
          status = 'broken';
        } else if (statusCode === 2) {
          status = 'blocked';
        }
      }

      rows[rowNo - 1]?.push({
        id: seat ? String(seat.LS_ID) : `virtual-${rowNo}-${colNo}`,
        label,
        status,
        rowNo,
        colNo,
        student: null,
      });
    }
  }

  return rows;
});

const printCandidateRows = computed((): SeatCandidateRow[] =>
  roomTableRows.value.map((row, index) => ({
    ...row,
    index: index + 1,
  })),
);

const handleExportByRoom = (): void => {
  if (filteredRows.value.length === 0) {
    $q.notify({
      message: i18n.t('components.exportCsv.noData'),
      color: 'warning',
    });
    return;
  }

  isExporting.value = true;
  try {
    const sheets = groupRowsByKey(filteredRows.value, (row) => row.roomLabel);
    const timestamp = date.formatDate(Date.now(), 'YYYY-MM-DD');
    downloadMultiSheetXlsx({
      columns: columns.value,
      sheets,
      fileName: `seat-candidates_${timestamp}.xlsx`,
    });
  } catch (error) {
    console.error('Failed to export seat candidates by room:', error);
    $q.notify({
      message: i18n.t('components.exportCsv.loadError'),
      color: 'negative',
      icon: 'warning',
    });
  } finally {
    isExporting.value = false;
  }
};

const cleanupSeatPlanPrint = (): void => {
  isPrintingSeatPlan.value = false;
};

const canvasToJpegDataUrl = (canvas: HTMLCanvasElement): string =>
  canvas.toDataURL('image/jpeg', 0.92);

const renderPrintPageToCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> =>
  html2canvas(element, {
    scale: 1.25,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

const handlePrintSeatPlan = async (): Promise<void> => {
  isPrintingSeatPlan.value = true;

  await nextTick();
  await new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });

  try {
    const printPages = [...document.querySelectorAll<HTMLElement>('.seat-print-page')];
    if (printPages.length === 0) {
      throw new Error('Seat print pages not found');
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    for (const [pageIndex, printPage] of printPages.entries()) {
      if (pageIndex > 0) {
        pdf.addPage('a4', 'portrait');
      }

      const canvas = await renderPrintPageToCanvas(printPage);
      pdf.addImage(canvasToJpegDataUrl(canvas), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    pdf.autoPrint();

    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const printWindow = window.open(pdfUrl, '_blank');

    if (!printWindow) {
      pdf.save('seat-plan.pdf');
      URL.revokeObjectURL(pdfUrl);
    } else {
      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
    }
  } catch (error) {
    console.error('Error printing seat plan:', error);
    $q.notify({
      type: 'negative',
      message: 'ไม่สามารถพิมพ์แผนผังที่นั่งได้',
      position: 'top',
    });
  } finally {
    cleanupSeatPlanPrint();
  }
};

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns = computed<QTableColumn[]>(() => {
  const nameWidth = isVoucherSent.value ? 11 : 16;
  const baseColumns: QTableColumn[] = [
    {
      name: 'index',
      label: i18n.t('admin.seatCandidates.table.columns.index'),
      field: 'index',
      align: 'center',
      style: 'width: 6%',
    },
    {
      name: 'nationalId',
      label: i18n.t('admin.seatCandidates.table.columns.nationalId'),
      field: 'nationalId',
      align: 'center',
      style: 'width: 14%',
    },
    {
      name: 'titleTh',
      label: i18n.t('admin.seatCandidates.table.columns.prefix'),
      field: 'titleTh',
      align: 'center',
      style: 'width: 8%',
    },
    {
      name: 'fullnameTh',
      label: i18n.t('admin.seatCandidates.table.columns.fullName'),
      field: 'fullnameTh',
      align: 'left',
      style: `width: ${nameWidth}%`,
    },
    {
      name: 'fullnameEn',
      label: i18n.t('admin.seatCandidates.table.columns.fullNameEn'),
      field: 'fullnameEn',
      align: 'left',
      style: `width: ${nameWidth}%`,
    },
    {
      name: 'roomLabel',
      label: i18n.t('admin.seatCandidates.table.columns.room'),
      field: 'roomLabel',
      align: 'left',
      style: 'width: 18%',
    },
    {
      name: 'seatNumber',
      label: i18n.t('admin.seatCandidates.table.columns.seatNumber'),
      field: 'seatNumber',
      align: 'center',
      style: 'width: 12%',
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

onBeforeUnmount(() => {
  cleanupSeatPlanPrint();
});
</script>

<style scoped lang="scss">
.toolbar-action-btn-wrap {
  display: inline-flex;

  @media (max-width: $breakpoint-xs-max) {
    width: 100%;
  }
}

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

.seat-print-render-root {
  position: fixed;
  top: 0;
  left: -9999px;
  z-index: -1;
  pointer-events: none;
}

.seat-print-page {
  width: 794px;
  height: 1123px;
  padding: 40px 36px;
  box-sizing: border-box;
  background: #ffffff;
  color: #111111;
  overflow: hidden;
}

.seat-list-print {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: Sarabun, Arial, sans-serif;
}

.seat-list-print__header {
  flex-shrink: 0;
  padding: 0 0 12px;
  margin-bottom: 18px;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
}

.seat-list-print__header h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
}

.seat-list-print__header p {
  margin: 4px 0 0;
  color: #343434;
  font-size: 15px;
  line-height: 1.35;
}

.seat-list-print__table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 15px;
}

.seat-list-print__table th,
.seat-list-print__table td {
  height: 34px;
  padding: 6px 8px;
  border: 1px solid #d6d6d6;
  text-align: center;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seat-list-print__table th {
  background: #e7f3ff;
  color: #0d47a1;
  font-weight: 700;
}

.seat-list-print__table th:nth-child(1),
.seat-list-print__table td:nth-child(1) {
  width: 64px;
}

.seat-list-print__table th:nth-child(3),
.seat-list-print__table td:nth-child(3),
.seat-list-print__table th:nth-child(6),
.seat-list-print__table td:nth-child(6) {
  width: 110px;
}

.seat-list-print__table .text-left {
  text-align: left;
}
</style>
