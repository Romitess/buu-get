<template>
  <q-page class="page-container scores-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.scoreManagement.pageTitle')"
      :subtitle="$t('admin.scoreManagement.pageSubtitle')"
    />

    <AppExamSessionTabs v-model="selectedSessionId" :sessions="sessionTimeTabs" />

    <AppExamInfoCard
      v-if="exam"
      v-model:selected-location-id="selectedSessionLocationId"
      class="q-mb-md"
      :title="exam.EXAM_ROUND ? `${exam.EXAM_NAME} ${exam.EXAM_ROUND}` : exam.EXAM_NAME"
      :date="examDateLabel"
      :time="selectedSessionTime"
      :location="selectedSessionLocation"
      :location-options="roomOptions"
      :applicant-count="sessionTotalCount"
      :total-capacity="currentRoomCapacity"
      hide-paid
      hide-main-separator
      count-with-capacity
      is-admin
    />

    <nav class="toolbar-section row items-center q-mb-md q-gutter-md">
      <SearchBar
        v-model="searchQuery"
        :placeholder="$t('admin.registrantManagement.searchPlaceholder')"
        class="search-bar col-12 col-md-auto"
      />
      <q-space class="gt-sm" />
      <div class="row q-gutter-sm col-12 col-md-auto justify-end">
        <template v-if="hasSavedScores">
          <AppButton
            color="primary"
            class="action-btn text-weight-bold br-sm"
            icon="note"
            label="ออกใบ Certificate"
            @click="issueCertificates"
          />
          <ExportCsvButton
            :columns="columns"
            :rows="scoreRows"
            :file-name-prefix="exportCsvFileNamePrefix"
            class="action-btn text-weight-bold br-sm"
          />
        </template>
        <template v-else>
          <q-btn
            color="negative"
            class="action-btn text-weight-bold br-sm"
            unelevated
            label="ลบข้อมูลทั้งหมด"
            @click="confirmClearImportedScores"
          />
          <q-btn
            color="primary"
            class="action-btn text-weight-bold br-sm"
            unelevated
            icon="file_upload"
            label="IMPORT"
            @click="showImportDialog = true"
          />
        </template>
      </div>
    </nav>

    <main>
      <BaseTable
        :columns="columns"
        :rows="scoreRows"
        :loading="isLoading"
        :pagination="pagination"
        class="scores-table"
        @request="onRequest"
      >
        <template v-slot:body-cell-tools="{ row }">
          <div class="row justify-center q-gutter-x-sm no-wrap">
            <ActionButton
              v-if="row.hasSavedCertificate"
              icon="description"
              tooltip="ดูใบ Certificate"
              color="black"
              @click="viewIssuedCertificate(row)"
            />
          </div>
        </template>
      </BaseTable>
    </main>

    <div class="row justify-center q-mt-lg">
      <q-btn
        color="primary"
        class="save-score-btn text-weight-bold br-sm"
        unelevated
        label="บันทึกคะแนน"
        :disable="!hasImportedScores"
        @click="showSaveConfirmDialog = true"
      />
    </div>

    <q-dialog v-model="showImportDialog">
      <q-card class="import-dialog-card q-pa-sm">
        <q-card-section>
          <div class="text-h6 text-weight-bold q-mb-lg">
            {{ $t('admin.scoreManagement.importDialog.title') }}
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-card
                flat
                bordered
                class="import-option-card full-height column flex-center q-pa-xl text-center cursor-pointer"
                v-ripple
                @click="handleCsvOptionClick"
              >
                <q-icon name="description" size="56px" color="primary" class="q-mb-md" />
                <div class="text-subtitle1 text-weight-bold text-dark q-mb-sm">
                  {{ $t('admin.scoreManagement.importDialog.csvOption.title') }}
                </div>
                <div class="text-caption text-grey-7 wrap-text">
                  {{ $t('admin.scoreManagement.importDialog.csvOption.description') }}
                </div>
              </q-card>
            </div>

            <div class="col-12 col-sm-6">
              <q-card
                flat
                bordered
                class="import-option-card full-height column flex-center q-pa-xl text-center cursor-pointer"
                v-ripple
              >
                <q-icon name="menu_book" size="56px" color="primary" class="q-mb-md" />
                <div class="text-subtitle1 text-weight-bold text-dark q-mb-sm">
                  {{ $t('admin.scoreManagement.importDialog.moodleOption.title') }}
                </div>
                <div class="text-caption text-grey-7 wrap-text">
                  {{ $t('admin.scoreManagement.importDialog.moodleOption.description') }}
                </div>
              </q-card>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <DialogCsvImport
      v-model="showUploadDialog"
      @file-selected="processScoreFile"
      @url-submitted="handleUrlUpload"
      @download-sample="openSampleDialog"
    />

    <q-dialog v-model="showSampleDialog" class="sample-dialog">
      <q-card class="sample-dialog-card">
        <q-card-section class="row items-start q-pb-md">
          <div class="sample-dialog-title">ตัวอย่างไฟล์ผลสอบ สำหรับ Upload คะแนน</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup class="text-grey-7" />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <BaseTable
            :columns="sampleColumns"
            :rows="sampleRows"
            :pagination="samplePagination"
            class="sample-table"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-px-lg q-pb-lg">
          <q-btn
            unelevated
            no-caps
            label="ดาวน์โหลดตัวอย่าง"
            class="download-sample-btn"
            @click="downloadSampleFile"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <DialogActionConfirm
      v-model="showSaveConfirmDialog"
      title="ยืนยันการบันทึกข้อมูล"
      message="คุณต้องการบันทึกข้อมูลทั้งหมดใช่หรือไม่"
      confirm-label="ยืนยัน"
      cancel-label="ยกเลิก"
      confirm-color="primary"
      @confirm="saveScores"
    />

    <DialogActionConfirm
      v-model="showClearConfirmDialog"
      title="ยืนยันการลบข้อมูล"
      message="คุณต้องการลบข้อมูลทั้งหมดใช่หรือไม่"
      confirm-label="ยืนยัน"
      cancel-label="ยกเลิก"
      confirm-color="primary"
      @confirm="clearImportedScores"
    />

    <DialogIssueCertificate
      v-model="showIssueCertificateDialog"
      :exam-date="exam?.EXAM_DATE"
      :session-id="selectedSessionId"
      :session-name="selectedSessionName"
      :candidates="candidatesWithScores"
      :view-mode="isViewMode"
      :candidate-info="selectedCandidateInfo"
      @issued="loadData"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import BaseTable from 'src/components/shared/base-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import DialogCsvImport from 'src/components/exam/dialog-csv-import.vue';
import DialogActionConfirm from 'src/components/exam/dialog-action-confirm.vue';
import DialogIssueCertificate from 'src/components/exam/dialog-issue-certificate.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSessionTabs from 'src/components/exam/app-exam-session-time.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import AppButton from 'src/components/base/app-button.vue';
import ActionButton from 'src/components/shared/action-button.vue';
import { fetchExamById } from 'src/services/exam.service';
import { fetchRawEnrollmentsByExamId } from 'src/services/enrollment.service';
import {
  createExamScore,
  fetchExamScores,
  updateExamScore,
  type BackendExamScore,
  type SaveExamScorePayload,
} from 'src/services/exam-score.service';
import type { BackendExam, BackendLocation, BackendSession } from 'src/types/exam';
import type { BackendEnrollmentDetail, EnrollmentTableRow } from 'src/types/enrollment.types';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

interface ScoreTableRow extends EnrollmentTableRow {
  scoreGrammar: number;
  scoreReading: number;
  scoreTotal: number;
  band: number;
  hasImportedScore: boolean;
  hasScore: boolean;
  hasSavedCertificate: boolean;
}

interface ScoreDraft {
  scoreGrammar: number;
  scoreReading: number;
  scoreTotal: number;
  band: number;
}

interface SessionLocationOption {
  SL_ID: number;
  LOCATION_ID: number;
  SS_ID: number;
  SS_NAME?: string | null;
  LOCATION: BackendLocation;
}

const route = useRoute();
const $q = useQuasar();
const i18n = useI18n();

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

const isLoading = ref(false);
const exam = ref<BackendExam | null>(null);
const enrollments = ref<BackendEnrollmentDetail[]>([]);
const examScores = ref<BackendExamScore[]>([]);
const searchQuery = ref('');
const selectedSessionId = ref<number | null>(null);
const selectedSessionLocationId = ref<number | null>(null);
const scoreDraftByEnrollmentId = ref<Record<number, ScoreDraft>>({});
const importedEnrollmentIds = ref<Set<number>>(new Set());
const showImportDialog = ref(false);
const showUploadDialog = ref(false);
const showSampleDialog = ref(false);
const showSaveConfirmDialog = ref(false);
const showClearConfirmDialog = ref(false);
const showIssueCertificateDialog = ref(false);
const isViewMode = ref(false);
const selectedCandidateInfo = ref<
  | {
      fullname?: string | undefined;
      userCode?: string | undefined;
      nationalId?: string | undefined;
      scoreGrammar?: number | undefined;
      scoreReading?: number | undefined;
      scoreTotal?: number | undefined;
      band?: number | undefined;
      userPhoto?: string | undefined;
      certIssuedAt?: string | undefined;
      certExpiresAt?: string | undefined;
      certCode?: string | undefined;
    }
  | null
  | undefined
>(null);

const sampleFileUrl =
  'https://docs.google.com/spreadsheets/d/1IJGChv6bg4W8sgYPRmMQwDAOk7YwSw1R/export?format=xlsx&gid=181366053';

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const samplePagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 3,
});

const hasImportedScores = computed(() => importedEnrollmentIds.value.size > 0);

const getSessionTimeKey = (session: BackendSession): string => {
  return `${session.SS_START_TIME || ''}-${session.SS_END_TIME || ''}`;
};

const sessionTimeTabs = computed<BackendSession[]>(() => {
  const seen = new Set<string>();
  return (exam.value?.SESSIONS || []).filter((session) => {
    const key = getSessionTimeKey(session);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});

const selectedSession = computed<BackendSession | null>(() => {
  return exam.value?.SESSIONS?.find((session) => session.SS_ID === selectedSessionId.value) || null;
});

const activeTimeSessions = computed<BackendSession[]>(() => {
  if (!selectedSession.value) return [];
  const activeKey = getSessionTimeKey(selectedSession.value);
  return (exam.value?.SESSIONS || []).filter((session) => getSessionTimeKey(session) === activeKey);
});

const activeSessionIds = computed(() => activeTimeSessions.value.map((session) => session.SS_ID));

const sessionLocations = computed<SessionLocationOption[]>(() => {
  return activeTimeSessions.value.flatMap((session) => {
    const relationLocations = session.SESSION_LOCATIONS || [];
    if (relationLocations.length > 0) {
      return relationLocations
        .filter((item) => item.LOCATION)
        .map((item) => ({
          SL_ID: item.SL_ID,
          LOCATION_ID: item.LOCATION_ID,
          SS_ID: item.SS_ID || session.SS_ID,
          LOCATION: item.LOCATION,
        }));
    }

    if (!session.LOCATION) return [];
    return [
      {
        SL_ID: -session.SS_ID,
        LOCATION_ID: session.LOCATION.LOCATION_ID,
        SS_ID: session.SS_ID,
        LOCATION: session.LOCATION,
      },
    ];
  });
});

const roomOptions = computed(() =>
  sessionLocations.value.map((item) => ({
    value: item.SL_ID,
    label: `${item.LOCATION.LOCATION_NAME}${item.LOCATION.LOCATION_ROOM_NO ? ` (${item.LOCATION.LOCATION_ROOM_NO})` : ''}`,
  })),
);

const activeSessionLocation = computed(() => {
  return (
    sessionLocations.value.find((item) => item.SL_ID === selectedSessionLocationId.value) || null
  );
});

const activeLocation = computed(() => {
  return activeSessionLocation.value?.LOCATION ?? selectedSession.value?.LOCATION ?? null;
});

const currentRoomEnrollments = computed(() => {
  return enrollments.value.filter((enrollment) => {
    if (!activeSessionIds.value.includes(enrollment.SESSION_ID)) return false;
    if (selectedSessionLocationId.value === null) return true;

    const enrollmentSessionLocationId = enrollment.SL_ID ?? enrollment.SESSION_LOCATION?.SL_ID;
    if (enrollmentSessionLocationId !== undefined && enrollmentSessionLocationId !== null) {
      return enrollmentSessionLocationId === selectedSessionLocationId.value;
    }

    const enrollmentSessionLocations = sessionLocations.value.filter(
      (location) => location.SS_ID === enrollment.SESSION_ID,
    );
    return (
      enrollmentSessionLocations.length > 0 &&
      enrollmentSessionLocations[0]?.SL_ID === selectedSessionLocationId.value
    );
  });
});

const sessionTotalCount = computed(() => currentRoomEnrollments.value.length);

const currentRoomCapacity = computed((): number => {
  if (activeLocation.value?.SEATS?.length) return activeLocation.value.SEATS.length;
  return (
    activeTimeSessions.value.find((session) => session.SS_ID === activeSessionLocation.value?.SS_ID)
      ?.SS_CAPACITY ?? 0
  );
});

const selectedSessionTime = computed((): string => {
  if (!selectedSession.value) return '-';
  const start = (selectedSession.value.SS_START_TIME || '').substring(0, 5);
  const end = (selectedSession.value.SS_END_TIME || '').substring(0, 5);
  return `${start}-${end}`;
});

const selectedSessionLocation = computed((): string => {
  if (!activeLocation.value) return '-';
  const location = activeLocation.value;
  return `${location.LOCATION_NAME}${location.LOCATION_ROOM_NO ? ` (${location.LOCATION_ROOM_NO})` : ''}`;
});

const calculateBand = (total: number): number => {
  if (total >= 80) return 5;
  if (total >= 70) return 4;
  if (total >= 60) return 3;
  if (total >= 50) return 2;
  if (total >= 40) return 1;
  return 0;
};

const scoreByEnrollmentId = computed(() => {
  return new Map(examScores.value.map((score) => [score.ERM_ID, score]));
});

const hasSavedScores = computed(() => {
  return (
    currentRoomEnrollments.value.length > 0 &&
    currentRoomEnrollments.value.some((enrollment) =>
      scoreByEnrollmentId.value.has(enrollment.ERM_ID),
    )
  );
});

const exportCsvFileNamePrefix = computed(() => {
  const examName = exam.value?.EXAM_ROUND
    ? `${exam.value.EXAM_NAME} ${exam.value.EXAM_ROUND}`
    : exam.value?.EXAM_NAME || '';
  const time = selectedSessionTime.value || '';
  const room = selectedSessionLocation.value || '';
  return `คะแนนสอบ_${examName}_${time}_${room}`.replace(/[\s/\\?%*:|"<>]+/g, '_');
});

const selectedSessionName = computed((): string => {
  if (!selectedSession.value) return '';
  const loc = activeSessionLocation.value;
  if (loc && loc.SS_NAME) return loc.SS_NAME;
  const sessions = exam.value?.SESSIONS || [];
  const index = sessions.findIndex((s) => s.SS_ID === selectedSessionId.value);
  const roundNum = index !== -1 ? index + 1 : 1;
  const year = exam.value?.EXAM_DATE
    ? new Date(exam.value.EXAM_DATE).getFullYear() + 543
    : new Date().getFullYear() + 543;
  return `${roundNum}/${year}`;
});

const candidatesWithScores = computed(() => {
  const activeSessionEnrollments = enrollments.value.filter((enrollment) =>
    activeSessionIds.value.includes(enrollment.SESSION_ID),
  );
  return activeSessionEnrollments
    .filter((enrollment) => scoreByEnrollmentId.value.has(enrollment.ERM_ID))
    .map((enrollment) => {
      const score = scoreByEnrollmentId.value.get(enrollment.ERM_ID);
      return {
        USER_ID: enrollment.USER_ID,
        SCORES_ID: score?.SCORES_ID || 0,
      };
    })
    .filter((c) => c.SCORES_ID > 0);
});

const issueCertificates = (): void => {
  isViewMode.value = false;
  selectedCandidateInfo.value = null;
  showIssueCertificateDialog.value = true;
};

const viewIssuedCertificate = (row: ScoreTableRow): void => {
  const score = scoreByEnrollmentId.value.get(row.ermId);
  const cert = score?.CERTIFICATES?.[0];
  if (!cert) return;

  const enrollment = enrollments.value.find((e) => e.ERM_ID === row.ermId);

  selectedCandidateInfo.value = {
    fullname: row.fullnameTh,
    userCode: enrollment?.USER?.USER_CODE || '',
    nationalId: row.nationalId,
    scoreGrammar: row.scoreGrammar,
    scoreReading: row.scoreReading,
    scoreTotal: row.scoreTotal,
    band: row.band,
    userPhoto:
      enrollment?.USER?.USER_IMAGE ||
      enrollment?.USER?.PROFILE?.userImagePath ||
      enrollment?.USER?.IMAGE?.USER_IMAGE_URL ||
      undefined,
    certIssuedAt: cert.CERT_ISSUED_AT,
    certExpiresAt: cert.CERT_EXPIRES_AT,
    certCode: cert.CERT_CODE,
  };

  isViewMode.value = true;
  showIssueCertificateDialog.value = true;
};

const toNumber = (value: number | string | null | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getScoreDraft = (enrollment: BackendEnrollmentDetail): ScoreDraft => {
  const score = scoreByEnrollmentId.value.get(enrollment.ERM_ID);
  const scoreGrammar = toNumber(score?.SC_LANG_USE_SCORE);
  const scoreReading = toNumber(score?.SC_READING_SCORE);
  const scoreTotal = toNumber(score?.SC_TOTAL_SCORE) || scoreGrammar + scoreReading;

  return {
    scoreGrammar,
    scoreReading,
    scoreTotal,
    band: toNumber(score?.SC_BAND_LEVEL) || calculateBand(scoreTotal),
  };
};

const initializeScoreDrafts = (): void => {
  scoreDraftByEnrollmentId.value = enrollments.value.reduce<Record<number, ScoreDraft>>(
    (acc, enrollment) => {
      acc[enrollment.ERM_ID] = getScoreDraft(enrollment);
      return acc;
    },
    {},
  );
  importedEnrollmentIds.value = new Set();
};

const scoreRows = computed(() => {
  const rows = currentRoomEnrollments.value.map((enrollment, index): ScoreTableRow => {
    const profile = enrollment.USER?.PROFILE;
    const draft = scoreDraftByEnrollmentId.value[enrollment.ERM_ID] ?? getScoreDraft(enrollment);
    const score = scoreByEnrollmentId.value.get(enrollment.ERM_ID);
    const hasSavedCertificate = !!(score?.CERTIFICATES && score.CERTIFICATES.length > 0);

    return {
      index: index + 1,
      ermId: enrollment.ERM_ID,
      nationalId: enrollment.USER?.USER_NATIONAL_ID || enrollment.USER?.USER_PASSPORT_NO || '-',
      titleTh: profile?.userTitleTh || profile?.userTitleEn || '-',
      fullnameTh:
        profile?.userFullnameTh || profile?.userFullnameEn || enrollment.USER?.USER_EMAIL || '-',
      paymentStatus: enrollment.ERM_STATUS,
      verifyStatus: enrollment.ERM_VERIFY_STATUS,
      sessionId: enrollment.SESSION_ID,
      sessionLocationId: enrollment.SL_ID ?? null,
      userProfileId: profile?.userProfileId || 0,
      remark: enrollment.ERM_PHYSICAL_STATUS || '',
      scoreGrammar: draft.scoreGrammar,
      scoreReading: draft.scoreReading,
      scoreTotal: draft.scoreTotal,
      band: draft.band,
      hasImportedScore: importedEnrollmentIds.value.has(enrollment.ERM_ID),
      hasScore:
        importedEnrollmentIds.value.has(enrollment.ERM_ID) ||
        scoreByEnrollmentId.value.has(enrollment.ERM_ID),
      hasSavedCertificate,
    };
  });

  if (!searchQuery.value) return rows;
  const query = searchQuery.value.toLowerCase();
  return rows.filter(
    (row) =>
      row.nationalId?.toLowerCase().includes(query) ||
      row.fullnameTh?.toLowerCase().includes(query),
  );
});

const columns: QTableColumn[] = [
  {
    name: 'index',
    label: 'ลำดับ',
    field: 'index',
    align: 'center',
    style: 'width: 8%',
  },
  {
    name: 'nationalId',
    label: 'เลขประจำตัวสอบ',
    field: 'nationalId',
    align: 'center',
    style: 'width: 15%',
  },
  {
    name: 'titleTh',
    label: 'คำนำหน้า',
    field: 'titleTh',
    align: 'center',
    style: 'width: 8%',
  },
  {
    name: 'fullnameTh',
    label: 'ชื่อ-นามสกุล',
    field: 'fullnameTh',
    align: 'left',
    style: 'width: 25%; padding-left: 10%',
  },
  {
    name: 'scoreGrammar',
    label: 'คำศัพท์และไวยากรณ์',
    field: 'scoreGrammar',
    align: 'center',
    style: 'width: 10%',
    format: (val: unknown, row: ScoreTableRow) => (row.hasScore ? String(val) : ''),
  },
  {
    name: 'scoreReading',
    label: 'ทักษะการอ่าน',
    field: 'scoreReading',
    align: 'center',
    style: 'width: 10%',
    format: (val: unknown, row: ScoreTableRow) => (row.hasScore ? String(val) : ''),
  },
  {
    name: 'scoreTotal',
    label: 'คะแนนรวม',
    field: 'scoreTotal',
    align: 'center',
    style: 'width: 5%',
    format: (val: unknown, row: ScoreTableRow) => (row.hasScore ? String(val) : ''),
    classes: 'text-weight-bold text-primary',
  },
  {
    name: 'band',
    label: 'Level',
    field: 'band',
    align: 'center',
    style: 'width: 10%',
    format: (val: unknown, row: ScoreTableRow) => (row.hasScore ? String(val) : ''),
    classes: 'text-weight-bold',
  },
  {
    name: 'tools',
    label: 'เครื่องมือ',
    field: 'tools',
    align: 'center',
    style: 'width: 10%',
  },
];

const sampleColumns: QTableColumn[] = [
  {
    name: 'testTakerId',
    label: 'Test Taker Id',
    field: 'testTakerId',
    align: 'center',
  },
  {
    name: 'fullnameEn',
    label: 'Fullname English',
    field: 'fullnameEn',
    align: 'center',
  },
  {
    name: 'fullnameTh',
    label: 'Fullname Thai',
    field: 'fullnameTh',
    align: 'center',
  },
  {
    name: 'citizenId',
    label: 'Citizen Id',
    field: 'citizenId',
    align: 'center',
  },
  {
    name: 'passport',
    label: 'Passport',
    field: 'passport',
    align: 'center',
  },
  {
    name: 'vocabularyScore',
    label: 'vocabulary score (50)',
    field: 'vocabularyScore',
    align: 'center',
  },
  {
    name: 'readingScore',
    label: 'reading score (50)',
    field: 'readingScore',
    align: 'center',
  },
  {
    name: 'totalScore',
    label: 'Total Score (100)',
    field: 'totalScore',
    align: 'center',
  },
  {
    name: 'level',
    label: 'level',
    field: 'level',
    align: 'center',
  },
];

const sampleRows = [
  {
    testTakerId: '691040001',
    fullnameEn: 'Mr. Pha...',
    fullnameTh: 'นาย ป.....',
    citizenId: '320XXXXXXXXX',
    passport: '-',
    vocabularyScore: 20,
    readingScore: 24,
    totalScore: 44,
    level: 1,
  },
  {
    testTakerId: '691040002',
    fullnameEn: 'Mr. Cha..... Xi....',
    fullnameTh: '- -',
    citizenId: '-',
    passport: 'EL82XXXXX',
    vocabularyScore: 45,
    readingScore: 41,
    totalScore: 86,
    level: 5,
  },
  {
    testTakerId: '691040003',
    fullnameEn: 'Miss Wi..... N.....',
    fullnameTh: 'นางสาว วิ..... น.....',
    citizenId: '134XXXXXXXXX',
    passport: '-',
    vocabularyScore: 23,
    readingScore: 26,
    totalScore: 49,
    level: 1,
  },
];

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

const handleCsvOptionClick = (): void => {
  showImportDialog.value = false;
  showUploadDialog.value = true;
};

const normalizeImportKey = (value: string): string => value.replace(/\s/g, '').toLowerCase();

const columnNameToIndex = (cellRef: string): number => {
  const columnName = cellRef.replace(/[0-9]/g, '').toUpperCase();
  return [...columnName].reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
};

const getZipEntries = (buffer: ArrayBuffer): Map<string, { method: number; data: Uint8Array }> => {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let endOfCentralDirectory = -1;

  for (let offset = bytes.length - 22; offset >= 0; offset--) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endOfCentralDirectory = offset;
      break;
    }
  }

  if (endOfCentralDirectory < 0) {
    throw new Error('Invalid XLSX file');
  }

  const entriesCount = view.getUint16(endOfCentralDirectory + 10, true);
  let centralDirectoryOffset = view.getUint32(endOfCentralDirectory + 16, true);
  const entries = new Map<string, { method: number; data: Uint8Array }>();

  for (let i = 0; i < entriesCount; i++) {
    if (view.getUint32(centralDirectoryOffset, true) !== 0x02014b50) break;

    const method = view.getUint16(centralDirectoryOffset + 10, true);
    const compressedSize = view.getUint32(centralDirectoryOffset + 20, true);
    const fileNameLength = view.getUint16(centralDirectoryOffset + 28, true);
    const extraLength = view.getUint16(centralDirectoryOffset + 30, true);
    const commentLength = view.getUint16(centralDirectoryOffset + 32, true);
    const localHeaderOffset = view.getUint32(centralDirectoryOffset + 42, true);
    const fileName = new TextDecoder().decode(
      bytes.slice(centralDirectoryOffset + 46, centralDirectoryOffset + 46 + fileNameLength),
    );

    const localFileNameLength = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    entries.set(fileName, {
      method,
      data: bytes.slice(dataStart, dataStart + compressedSize),
    });

    centralDirectoryOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
};

const inflateZipEntry = async (entry: { method: number; data: Uint8Array }): Promise<string> => {
  if (entry.method === 0) {
    return new TextDecoder().decode(entry.data);
  }

  if (entry.method !== 8) {
    throw new Error('Unsupported XLSX compression method');
  }

  const compressedBuffer = entry.data.buffer.slice(
    entry.data.byteOffset,
    entry.data.byteOffset + entry.data.byteLength,
  ) as ArrayBuffer;
  const stream = new Blob([compressedBuffer])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'));
  const inflated = await new Response(stream).arrayBuffer();
  return new TextDecoder().decode(inflated);
};

const parseSharedStrings = (xml: string): string[] => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return [...doc.getElementsByTagName('si')].map((si) =>
    [...si.getElementsByTagName('t')].map((textNode) => textNode.textContent || '').join(''),
  );
};

const parseWorksheetRows = (xml: string, sharedStrings: string[]): string[][] => {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  return [...doc.getElementsByTagName('row')].map((row) => {
    const cells = [...row.getElementsByTagName('c')];
    if (cells.length === 0) return [];

    const cellIndices = cells.map((cell) => columnNameToIndex(cell.getAttribute('r') || ''));
    const maxIndex = Math.max(...cellIndices);
    const values: string[] = Array(maxIndex + 1).fill('');

    cells.forEach((cell, idx) => {
      const cellIndex = cellIndices[idx];
      if (cellIndex === undefined) return;
      const cellType = cell.getAttribute('t');
      const valueNode = cell.getElementsByTagName('v')[0];
      const inlineNode = cell.getElementsByTagName('t')[0];
      const rawValue = valueNode?.textContent || inlineNode?.textContent || '';

      if (cellType === 's') {
        values[cellIndex] = sharedStrings[Number(rawValue)] || '';
      } else {
        values[cellIndex] = rawValue;
      }
    });
    return values;
  });
};

const parseXlsxFile = async (file: File): Promise<string[][]> => {
  const buffer = await file.arrayBuffer();
  const entries = getZipEntries(buffer);
  const worksheetName = [...entries.keys()].find((name) =>
    /^xl\/worksheets\/sheet\d+\.xml$/.test(name),
  );

  if (!worksheetName || !entries.has(worksheetName)) {
    throw new Error('Worksheet not found');
  }

  const sharedStringsEntry = entries.get('xl/sharedStrings.xml');
  const sharedStrings = sharedStringsEntry
    ? parseSharedStrings(await inflateZipEntry(sharedStringsEntry))
    : [];
  const worksheetEntry = entries.get(worksheetName);

  if (!worksheetEntry) {
    throw new Error('Worksheet not found');
  }

  return parseWorksheetRows(await inflateZipEntry(worksheetEntry), sharedStrings);
};

const parseCsvRows = (text: string): string[][] => {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => line.split(',').map((value) => value.trim()));
};

const applyImportedScoreRows = (rows: string[][]): void => {
  if (rows.length < 2) return;

  const headers = (rows[0] || []).map((header) => header.trim().toLowerCase());
  const idxTestTakerId = headers.findIndex(
    (header) =>
      header.includes('test taker') ||
      header.includes('testtaker') ||
      header.includes('เลขประจำตัวสอบ') ||
      header.includes('รหัสผู้สอบ') ||
      header.includes('candidate'),
  );
  const idxCitizenId = headers.findIndex(
    (header) =>
      header.includes('citizen') ||
      header.includes('nationalid') ||
      header.includes('national_id') ||
      header.includes('บัตรประชาชน') ||
      header.includes('เลขประจำตัวประชาชน') ||
      header.includes('identification'),
  );
  const idxPassport = headers.findIndex(
    (header) =>
      header.includes('passport') ||
      header.includes('หนังสือเดินทาง') ||
      header.includes('passport_no') ||
      header.includes('passportno'),
  );
  const idxGrammar = headers.findIndex(
    (header) =>
      header.includes('grammar') ||
      header.includes('vocab') ||
      header.includes('language') ||
      header.includes('คำศัพท์') ||
      header.includes('ไวยากรณ์') ||
      header.includes('lang_use') ||
      header.includes('languse'),
  );
  const idxReading = headers.findIndex(
    (header) =>
      header.includes('reading') || header.includes('การอ่าน') || header.includes('read_score'),
  );
  const idxTotal = headers.findIndex(
    (header) => header.includes('total') || header.includes('รวม') || header.includes('คะแนนรวม'),
  );
  const idxLevel = headers.findIndex(
    (header) => header.includes('level') || header.includes('band') || header.includes('ระดับ'),
  );

  let matchedCount = 0;
  const nextImportedIds = new Set(importedEnrollmentIds.value);

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i] || [];
    const citizenVal = idxCitizenId >= 0 ? values[idxCitizenId] : '';
    const passportVal = idxPassport >= 0 ? values[idxPassport] : '';
    const testTakerVal = idxTestTakerId >= 0 ? values[idxTestTakerId] : '';

    const cleanCitizen = citizenVal ? citizenVal.trim() : '';
    const cleanPassport = passportVal ? passportVal.trim() : '';
    const cleanTestTaker = testTakerVal ? testTakerVal.trim() : '';

    let matchedEnrollment = undefined;

    if (cleanCitizen && cleanCitizen !== '-') {
      const normCitizen = normalizeImportKey(cleanCitizen);
      matchedEnrollment = currentRoomEnrollments.value.find((enrollment) => {
        const dbNid = enrollment.USER?.USER_NATIONAL_ID;
        return dbNid && normalizeImportKey(dbNid) === normCitizen;
      });
    }

    if (!matchedEnrollment && cleanPassport && cleanPassport !== '-') {
      const normPassport = normalizeImportKey(cleanPassport);
      matchedEnrollment = currentRoomEnrollments.value.find((enrollment) => {
        const dbPp = enrollment.USER?.USER_PASSPORT_NO;
        return dbPp && normalizeImportKey(dbPp) === normPassport;
      });
    }

    if (!matchedEnrollment && cleanTestTaker && cleanTestTaker !== '-') {
      const normTestTaker = normalizeImportKey(cleanTestTaker);
      matchedEnrollment = currentRoomEnrollments.value.find((enrollment) => {
        const dbNid = enrollment.USER?.USER_NATIONAL_ID;
        const dbPp = enrollment.USER?.USER_PASSPORT_NO;
        return (
          (dbNid && normalizeImportKey(dbNid) === normTestTaker) ||
          (dbPp && normalizeImportKey(dbPp) === normTestTaker)
        );
      });
    }

    if (!matchedEnrollment) continue;

    const rawGrammar = idxGrammar >= 0 ? values[idxGrammar] : '';
    const rawReading = idxReading >= 0 ? values[idxReading] : '';
    const rawTotal = idxTotal >= 0 ? values[idxTotal] : undefined;
    const rawLevel = idxLevel >= 0 ? values[idxLevel] : undefined;

    const grammar = Number(rawGrammar) || 0;
    const reading = Number(rawReading) || 0;
    const total = rawTotal !== undefined && rawTotal !== '' ? Number(rawTotal) : grammar + reading;
    const level =
      rawLevel !== undefined && rawLevel !== '' ? Number(rawLevel) : calculateBand(total);

    scoreDraftByEnrollmentId.value[matchedEnrollment.ERM_ID] = {
      scoreGrammar: grammar,
      scoreReading: reading,
      scoreTotal: total,
      band: level,
    };
    nextImportedIds.add(matchedEnrollment.ERM_ID);
    matchedCount += 1;
  }

  importedEnrollmentIds.value = nextImportedIds;
  pagination.value.rowsNumber = scoreRows.value.length;
  showUploadDialog.value = false;

  $q.notify({
    type: matchedCount > 0 ? 'positive' : 'warning',
    message:
      matchedCount > 0
        ? `นำเข้าคะแนนสำเร็จ ${matchedCount} รายการ`
        : 'ไม่พบข้อมูลผู้สมัครที่ตรงกับไฟล์ในห้องนี้',
  });
};

const processScoreFile = async (file: File): Promise<void> => {
  const fileName = file.name.toLowerCase();

  try {
    if (fileName.endsWith('.csv')) {
      applyImportedScoreRows(parseCsvRows(await file.text()));
      return;
    }

    if (fileName.endsWith('.xlsx')) {
      applyImportedScoreRows(await parseXlsxFile(file));
      return;
    }

    $q.notify({ type: 'warning', message: 'รองรับเฉพาะไฟล์ .csv และ .xlsx เท่านั้น' });
  } catch (err) {
    console.error('Error importing score file:', err);
    $q.notify({ type: 'negative', message: 'นำเข้าไฟล์คะแนนไม่สำเร็จ' });
  }
};

const handleUrlUpload = (url: string): void => {
  console.log('Importing from URL:', url);
  $q.notify({ type: 'info', message: 'รับ URL แล้ว แต่การนำเข้าจาก URL ยังไม่ได้เชื่อมต่อ' });
};

const openSampleDialog = (): void => {
  showUploadDialog.value = false;
  void nextTick(() => {
    showSampleDialog.value = true;
  });
};

const downloadSampleFile = (): void => {
  window.open(sampleFileUrl, '_blank', 'noopener,noreferrer');
};

const clearImportedScores = (): void => {
  initializeScoreDrafts();
  $q.notify({
    type: 'positive',
    message: 'ลบข้อมูลสำเร็จ',
  });
};

const confirmClearImportedScores = (): void => {
  if (!hasImportedScores.value) {
    $q.notify({
      type: 'warning',
      message: 'ไม่มีข้อมูลคะแนนที่นำเข้า',
    });
    return;
  }
  showClearConfirmDialog.value = true;
};

const saveScores = async (): Promise<void> => {
  if (!hasImportedScores.value) return;

  try {
    isLoading.value = true;
    const rowsToSave = enrollments.value.filter((enrollment) =>
      importedEnrollmentIds.value.has(enrollment.ERM_ID),
    );

    await Promise.all(
      rowsToSave.map((enrollment) => {
        const draft =
          scoreDraftByEnrollmentId.value[enrollment.ERM_ID] ?? getScoreDraft(enrollment);
        const payload: SaveExamScorePayload = {
          ERM_ID: enrollment.ERM_ID,
          SC_LANG_USE_SCORE: draft.scoreGrammar,
          SC_READING_SCORE: draft.scoreReading,
          SC_TOTAL_SCORE: draft.scoreTotal,
          SC_BAND_LEVEL: draft.band,
        };
        const existingScore = scoreByEnrollmentId.value.get(enrollment.ERM_ID);

        return existingScore
          ? updateExamScore(existingScore.SCORES_ID, payload)
          : createExamScore(payload);
      }),
    );

    const scores = await fetchExamScores();
    examScores.value = scores.filter((score) =>
      enrollments.value.some((enrollment) => enrollment.ERM_ID === score.ERM_ID),
    );
    initializeScoreDrafts();
    pagination.value.rowsNumber = scoreRows.value.length;
    $q.notify({ type: 'positive', message: 'บันทึกคะแนนสำเร็จ' });
  } catch (err) {
    console.error('Error saving scores:', err);
    $q.notify({ type: 'negative', message: 'บันทึกคะแนนไม่สำเร็จ' });
  } finally {
    isLoading.value = false;
  }
};

watch(sessionTimeTabs, (sessions) => {
  if (!sessions.length) {
    selectedSessionId.value = null;
    return;
  }

  const hasSelectedSession = sessions.some((session) => session.SS_ID === selectedSessionId.value);
  if (!hasSelectedSession) selectedSessionId.value = sessions[0]?.SS_ID ?? null;
});

watch(sessionLocations, (locations) => {
  if (!locations.length) {
    selectedSessionLocationId.value = null;
    return;
  }

  const hasSelectedLocation = locations.some(
    (location) => location.SL_ID === selectedSessionLocationId.value,
  );
  if (!hasSelectedLocation) selectedSessionLocationId.value = locations[0]?.SL_ID ?? null;
});

watch(scoreRows, (rows) => {
  pagination.value.rowsNumber = rows.length;
});

const loadData = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (isNaN(examId) || examId <= 0) return;

  try {
    isLoading.value = true;
    const [examDetail, rawEnrollments, scores] = await Promise.all([
      fetchExamById(examId),
      fetchRawEnrollmentsByExamId(examId),
      fetchExamScores(),
    ]);

    exam.value = examDetail;
    enrollments.value = rawEnrollments;
    examScores.value = scores.filter((score) =>
      rawEnrollments.some((enrollment) => enrollment.ERM_ID === score.ERM_ID),
    );
    selectedSessionId.value = sessionTimeTabs.value[0]?.SS_ID ?? null;
    selectedSessionLocationId.value = sessionLocations.value[0]?.SL_ID ?? null;
    initializeScoreDrafts();
    pagination.value.rowsNumber = scoreRows.value.length;
  } catch (err) {
    console.error('Error fetching exam scores page data:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.scores-page {
  min-height: 0 !important;
}

.search-bar {
  min-width: 350px;

  @media (max-width: $breakpoint-sm-max) {
    min-width: 100%;
  }
}

.action-btn {
  height: 40px;
  padding: 0 20px;
}

.save-score-btn {
  min-width: 180px;
  height: 44px;

  &.disabled {
    background: #bcbbbb !important;
    color: #ffffff !important;
    opacity: 1 !important;
  }
}

.scores-table {
  :deep(.q-table__container) {
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-md);
  }

  :deep(.q-table th) {
    background-color: var(--primary);
    color: var(--text-on-primary);
    font-weight: var(--font-weight-bold);
    text-transform: none;
  }
}

.br-sm {
  border-radius: var(--radius-sm) !important;
}

.import-dialog-card {
  min-width: 650px;
  border-radius: var(--radius-md);

  @media (max-width: $breakpoint-sm-max) {
    min-width: 90vw;
  }
}

.import-option-card {
  border-radius: var(--radius-md);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
    box-shadow: var(--shadow-sm);
  }
}

.wrap-text {
  white-space: normal;
  line-height: 1.5;
}

:global(.sample-dialog .q-dialog__inner) {
  padding: 24px;
}

.sample-dialog-card {
  width: min(1600px, 88vw);
  max-width: none;
  min-height: 70vh;
  border-radius: 8px;
  background: var(--surface-card);
}

.sample-dialog-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.sample-table {
  :deep(.base-table-wrapper) {
    border-radius: 8px;
  }

  :deep(.q-table__bottom) {
    min-height: 42px;
  }
}

.download-sample-btn {
  min-width: 160px;
  min-height: 38px;
  border-radius: 12px;
  background: #dedede !important;
  color: var(--text-primary) !important;
  font-weight: 700;
}

.selected-row {
  background-color: #e3f2fd !important;
  transition: background-color 0.2s ease;
}
</style>
