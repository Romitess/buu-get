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
      class="q-mb-md"
      :title="
        formatExamDisplayTitle(exam.EXAM_NAME, exam.EXAM_ROUND, exam.EXAM_FISCAL_YEAR) ||
        exam.EXAM_NAME
      "
      :date="examDateLabel"
      :time="selectedSessionTime"
      :location="selectedSessionLocation"
      :applicant-count="sessionTotalCount"
      :total-capacity="currentSessionCapacity"
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
            :label="$t('admin.scoreManagement.issueCertificateButton')"
            @click="issueCertificates"
          />
          <ExportCsvButton
            :columns="columns"
            :rows="scoreRows"
            :load-rows="loadExportScoreRows"
            :file-name-prefix="exportCsvFileNamePrefix"
            class="action-btn text-weight-bold br-sm"
          />
        </template>
        <template v-else>
          <q-btn
            color="negative"
            class="action-btn text-weight-bold br-sm"
            unelevated
            :label="$t('admin.scoreManagement.clearAllButton')"
            @click="confirmClearImportedScores"
          />
          <q-btn
            color="primary"
            class="action-btn text-weight-bold br-sm"
            unelevated
            icon="file_upload"
            :label="$t('admin.scoreManagement.importButton')"
            @click="showImportDialog = true"
          />
        </template>
      </div>
    </nav>

    <main>
      <BaseTable
        :columns="tableColumns"
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
              :tooltip="$t('admin.scoreManagement.viewCertificateTooltip')"
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
        :label="$t('admin.scoreManagement.saveScoresButton')"
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
          <div class="sample-dialog-title">{{ $t('admin.scoreManagement.sampleDialog.title') }}</div>
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
            :label="$t('admin.scoreManagement.sampleDialog.downloadButton')"
            class="download-sample-btn"
            @click="downloadSampleFile"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <DialogActionConfirm
      v-model="showSaveConfirmDialog"
      :title="$t('admin.scoreManagement.confirmSave.title')"
      :message="$t('admin.scoreManagement.confirmSave.message')"
      :confirm-label="$t('common.confirm')"
      :cancel-label="$t('common.cancel')"
      confirm-color="primary"
      @confirm="saveScores"
    />

    <DialogActionConfirm
      v-model="showClearConfirmDialog"
      :title="$t('admin.scoreManagement.confirmClear.title')"
      :message="$t('admin.scoreManagement.confirmClear.message')"
      :confirm-label="$t('common.confirm')"
      :cancel-label="$t('common.cancel')"
      confirm-color="primary"
      @confirm="clearImportedScores"
    />

    <DialogIssueCertificate
      v-model="showIssueCertificateDialog"
      :exam-date="exam?.EXAM_DATE"
      :exam-name="examDisplayName"
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { debounce, exportFile, useQuasar, type QTableColumn } from 'quasar';
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
import { fetchExamById, isRequestCanceled } from 'src/services/exam.service';
import {
  fetchRawEnrollmentsByExamId,
  fetchRawEnrollmentsPage,
} from 'src/services/enrollment.service';
import {
  createExamScore,
  fetchExamScores,
  updateExamScore,
  type BackendExamScore,
} from 'src/services/exam-score.service';
import {
  buildSavePayload,
  buildScoreDraftFromScore,
  calculateBandFromRules,
  matchHeaderToRubricItem,
  rubricItemsFromExam,
  scoreByCode,
  sumLineScores,
  type ScoreDraft,
} from 'src/composables/use-score-rubric-helpers';
import { getBandRules, type BandRuleData } from 'src/services/score-criteria.service';
import type { BackendExam, BackendLocation, BackendSession } from 'src/types/exam';
import { formatExamDisplayTitle } from 'src/utils/exam-instance-label';
import type { BackendEnrollmentDetail, EnrollmentTableRow } from 'src/types/enrollment.types';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

interface ScoreTableRow extends EnrollmentTableRow {
  location: string;
  scoreGrammar: number;
  scoreReading: number;
  scoreTotal: number;
  band: string | null;
  itemScores: Record<number, number>;
  hasImportedScore: boolean;
  hasScore: boolean;
  hasSavedCertificate: boolean;
}

interface SessionLocationOption {
  SL_ID: number;
  LOCATION_ID: number;
  SS_ID: number;
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
const isInitializing = ref(true);
let loadGeneration = 0;
let pageAbortController: AbortController | null = null;
const exam = ref<BackendExam | null>(null);
const rubricItems = computed(() => rubricItemsFromExam(exam.value));
const bandRules = ref<BandRuleData[]>([]);
const enrollments = ref<BackendEnrollmentDetail[]>([]);
/** แหล่งข้อมูลเต็ม session สำหรับ import/sample — โหลดเฉพาะตอนจำเป็น */
const sessionEnrollmentsCache = ref<BackendEnrollmentDetail[]>([]);
const enrollmentTotal = ref(0);
const examScores = ref<BackendExamScore[]>([]);
const searchQuery = ref('');
const selectedSessionId = ref<number | null>(null);
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
      band?: string | null | undefined;
      userPhoto?: string | undefined;
      certIssuedAt?: string | undefined;
      certExpiresAt?: string | undefined;
      certCode?: string | undefined;
    }
  | null
  | undefined
>(null);

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const samplePagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
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

const formatLocationLabel = (location?: BackendLocation | null): string => {
  if (!location) return '-';
  return `${location.LOCATION_NAME}${location.LOCATION_ROOM_NO ? ` (${location.LOCATION_ROOM_NO})` : ''}`;
};

const sessionLocationLabelList = computed(() => {
  const labels = sessionLocations.value
    .map((item) => formatLocationLabel(item.LOCATION))
    .filter((label) => label !== '-');
  return [...new Set(labels)];
});

const currentSessionEnrollments = computed(() => {
  return enrollments.value.filter((enrollment) => {
    return activeSessionIds.value.includes(enrollment.SESSION_ID);
  });
});

const sessionTotalCount = computed(() => enrollmentTotal.value);

const currentSessionCapacity = computed((): number => {
  if (sessionLocations.value.length > 0) {
    return sessionLocations.value.reduce((total, item) => {
      const locationSeatCount = item.LOCATION.SEATS?.length;
      if (locationSeatCount && locationSeatCount > 0) {
        return total + locationSeatCount;
      }
      const sessionCapacity =
        activeTimeSessions.value.find((session) => session.SS_ID === item.SS_ID)?.SS_CAPACITY ?? 0;
      return total + sessionCapacity;
    }, 0);
  }

  return activeTimeSessions.value.reduce((total, session) => total + (session.SS_CAPACITY ?? 0), 0);
});

const selectedSessionTime = computed((): string => {
  if (!selectedSession.value) return '-';
  const start = (selectedSession.value.SS_START_TIME || '').substring(0, 5);
  const end = (selectedSession.value.SS_END_TIME || '').substring(0, 5);
  return `${start}-${end}`;
});

const selectedSessionLocation = computed((): string => {
  if (sessionLocationLabelList.value.length === 0) return '-';
  return sessionLocationLabelList.value.join(', ');
});

const scoreByEnrollmentId = computed(() => {
  return new Map(examScores.value.map((score) => [score.ERM_ID, score]));
});

const hasSavedScores = computed(() => {
  if (examScores.value.length === 0) return false;
  if (activeSessionIds.value.length === 0) return examScores.value.length > 0;
  return examScores.value.some((score) => {
    const sessionId = score.ENROLLMENT?.SESSION_ID;
    return sessionId == null || activeSessionIds.value.includes(sessionId);
  });
});

const exportCsvFileNamePrefix = computed(() => {
  const examName =
    formatExamDisplayTitle(
      exam.value?.EXAM_NAME,
      exam.value?.EXAM_ROUND,
      exam.value?.EXAM_FISCAL_YEAR,
    ) || '';
  const time = selectedSessionTime.value || '';
  return `คะแนนสอบ_${examName}_${time}_ทุกห้อง`.replace(/[\s/\\?%*:|"<>]+/g, '_');
});

const selectedSessionName = computed((): string => {
  if (!selectedSession.value) return '';
  const sessions = exam.value?.SESSIONS || [];
  const index = sessions.findIndex((s) => s.SS_ID === selectedSessionId.value);
  const roundNum = index !== -1 ? index + 1 : 1;
  const year = exam.value?.EXAM_DATE
    ? new Date(exam.value.EXAM_DATE).getFullYear() + 543
    : new Date().getFullYear() + 543;
  return `${roundNum}/${year}`;
});

const candidatesWithScores = computed(() => {
  return examScores.value
    .filter((score) => {
      const sessionId = score.ENROLLMENT?.SESSION_ID;
      if (sessionId == null) return true;
      return activeSessionIds.value.includes(sessionId);
    })
    .map((score) => ({
      USER_ID: score.ENROLLMENT?.USER_ID ?? 0,
      SCORES_ID: score.SCORES_ID,
    }))
    .filter((c) => c.SCORES_ID > 0 && c.USER_ID > 0);
});

const examDisplayName = computed(() => {
  if (!exam.value) {
    return 'BUU-GET Exam';
  }
  return (
    formatExamDisplayTitle(
      exam.value.EXAM_NAME,
      exam.value.EXAM_ROUND,
      exam.value.EXAM_FISCAL_YEAR,
    ) || exam.value.EXAM_NAME
  );
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
    userCode: enrollment?.ERM_TEST_TAKER || '',
    nationalId: enrollment?.USER?.USER_NATIONAL_ID || enrollment?.USER?.USER_PASSPORT_NO || '-',
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

const getScoreDraft = (enrollment: BackendEnrollmentDetail): ScoreDraft => {
  const score = scoreByEnrollmentId.value.get(enrollment.ERM_ID);
  return buildScoreDraftFromScore(score, rubricItems.value);
};

const resolveBandLevel = (total: number): string | null => {
  return calculateBandFromRules(total, bandRules.value);
};

const initializeScoreDrafts = (options?: { resetImported?: boolean }): void => {
  if (options?.resetImported) {
    scoreDraftByEnrollmentId.value = enrollments.value.reduce<Record<number, ScoreDraft>>(
      (acc, enrollment) => {
        acc[enrollment.ERM_ID] = getScoreDraft(enrollment);
        return acc;
      },
      {},
    );
    importedEnrollmentIds.value = new Set();
    return;
  }

  const nextDrafts = { ...scoreDraftByEnrollmentId.value };
  for (const enrollment of enrollments.value) {
    if (!nextDrafts[enrollment.ERM_ID]) {
      nextDrafts[enrollment.ERM_ID] = getScoreDraft(enrollment);
    }
  }
  scoreDraftByEnrollmentId.value = nextDrafts;
};

const scoreRows = computed(() => {
  const pageOffset = (pagination.value.page - 1) * pagination.value.rowsPerPage;
  return currentSessionEnrollments.value.map((enrollment, index): ScoreTableRow => {
    const profile = enrollment.USER?.PROFILE;
    const draft = scoreDraftByEnrollmentId.value[enrollment.ERM_ID] ?? getScoreDraft(enrollment);
    const score = scoreByEnrollmentId.value.get(enrollment.ERM_ID);
    const hasSavedCertificate = !!(score?.CERTIFICATES && score.CERTIFICATES.length > 0);
    const location =
      enrollment.SESSION_LOCATION?.LOCATION ??
      sessionLocations.value.find((item) => item.SL_ID === enrollment.SL_ID)?.LOCATION ??
      enrollment.SESSION?.LOCATION ??
      null;

    return {
      index: pageOffset + index + 1,
      ermId: enrollment.ERM_ID,
      nationalId: enrollment.ERM_TEST_TAKER || '-',
      titleTh: profile?.userTitleTh || profile?.userTitleEn || '-',
      fullnameTh:
        profile?.userFullnameTh || profile?.userFullnameEn || enrollment.USER?.USER_EMAIL || '-',
      fullnameEn: profile?.userFullnameEn || '-',
      email: enrollment.USER?.USER_EMAIL?.trim() || '-',
      phone: profile?.userPhone?.trim() || '-',
      paymentStatus: enrollment.ERM_STATUS,
      verifyStatus: enrollment.ERM_VERIFY_STATUS,
      sessionId: enrollment.SESSION_ID,
      sessionLocationId: enrollment.SL_ID ?? null,
      userProfileId: profile?.userProfileId || 0,
      remark: enrollment.ERM_PHYSICAL_STATUS || '',
      location: formatLocationLabel(location),
      scoreGrammar: scoreByCode(draft, rubricItems.value, 'LANG_USE'),
      scoreReading: scoreByCode(draft, rubricItems.value, 'READING'),
      scoreTotal: draft.scoreTotal,
      band: draft.band,
      itemScores: { ...draft.lineScores },
      hasImportedScore: importedEnrollmentIds.value.has(enrollment.ERM_ID),
      hasScore:
        importedEnrollmentIds.value.has(enrollment.ERM_ID) ||
        scoreByEnrollmentId.value.has(enrollment.ERM_ID),
      hasSavedCertificate,
    };
  });
});

const baseColumns = computed((): QTableColumn[] => {
  void i18n.locale.value;
  return [
  {
    name: 'index',
    label: i18n.t('admin.scoreManagement.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 8%',
  },
  {
    name: 'nationalId',
    label: i18n.t('admin.scoreManagement.table.columns.examNumber'),
    field: 'nationalId',
    align: 'center',
    style: 'width: 15%',
  },
  {
    name: 'location',
    label: i18n.t('admin.scoreManagement.table.columns.examRoom'),
    field: 'location',
    align: 'center',
    style: 'width: 18%',
  },
  {
    name: 'titleTh',
    label: i18n.t('admin.scoreManagement.table.columns.prefix'),
    field: 'titleTh',
    align: 'center',
    style: 'width: 8%',
  },
  {
    name: 'fullnameTh',
    label: i18n.t('admin.scoreManagement.table.columns.fullName'),
    field: 'fullnameTh',
    align: 'left',
    style: 'width: 25%; padding-left: 5%',
  },
  ];
});

const rubricScoreColumns = computed((): QTableColumn[] =>
  rubricItems.value.map((item) => ({
    name: `score_item_${item.id}`,
    label: item.nameTh,
    field: (row: ScoreTableRow) => row.itemScores[item.id] ?? 0,
    align: 'center' as const,
    style: 'width: 10%',
    format: (_val: unknown, row: ScoreTableRow) =>
      row.hasScore ? String(row.itemScores[item.id] ?? 0) : '',
  })),
);

const tailColumns = computed((): QTableColumn[] => {
  void i18n.locale.value;
  return [
  {
    name: 'scoreTotal',
    label: i18n.t('admin.scoreManagement.table.columns.scoreTotal'),
    field: 'scoreTotal',
    align: 'center',
    style: 'width: 5%',
    format: (val: unknown, row: ScoreTableRow) => (row.hasScore ? String(val) : ''),
    classes: 'text-weight-bold text-primary',
  },
  {
    name: 'band',
    label: i18n.t('admin.scoreManagement.table.columns.level'),
    field: 'band',
    align: 'center',
    style: 'width: 10%',
    format: (val: unknown, row: ScoreTableRow) => {
      if (!row.hasScore) {
        return '';
      }
      return typeof val === 'number' || typeof val === 'string' ? String(val) : '';
    },
    classes: 'text-weight-bold',
  },
  {
    name: 'tools',
    label: i18n.t('admin.scoreManagement.table.columns.tools'),
    field: 'tools',
    align: 'center',
    style: 'width: 10%',
  },
  ];
});

const columns = computed(() => {
  void i18n.locale.value;
  return [...baseColumns.value, ...rubricScoreColumns.value, ...tailColumns.value];
});

const tableColumns = computed(() => {
  const hasAnyCertificate = scoreRows.value.some((row) => row.hasSavedCertificate);
  const cols = columns.value;
  if (!hasAnyCertificate) {
    return cols.filter((col) => col.name !== 'tools');
  }
  return cols;
});

const sampleColumns = computed((): QTableColumn[] => {
  const identityColumns: QTableColumn[] = [
    { name: 'testTakerId', label: 'Test Taker Id', field: 'testTakerId', align: 'center' },
    { name: 'location', label: 'Room', field: 'location', align: 'center' },
    { name: 'fullnameEn', label: 'Fullname English', field: 'fullnameEn', align: 'center' },
    { name: 'fullnameTh', label: 'Fullname Thai', field: 'fullnameTh', align: 'center' },
    { name: 'citizenId', label: 'Citizen Id', field: 'citizenId', align: 'center' },
    { name: 'passport', label: 'Passport', field: 'passport', align: 'center' },
  ];
  const scoreItemColumns = rubricItems.value.map((item) => ({
    name: `sample_item_${item.id}`,
    label: `${item.nameEn} (${item.maxScore})`,
    field: `item_${item.id}`,
    align: 'center' as const,
  }));
  return [
    ...identityColumns,
    ...scoreItemColumns,
    {
      name: 'totalScore',
      label: `Total Score (${rubricItems.value.reduce((s, i) => s + i.maxScore, 0)})`,
      field: 'totalScore',
      align: 'center',
    },
  ];
});

interface SampleScoreRow {
  testTakerId: string;
  location: string;
  fullnameEn: string;
  fullnameTh: string;
  citizenId: string;
  passport: string;
  totalScore: number;
  [key: string]: string | number;
}

/** ตัวอย่างไฟล์จากผู้สมัครจริงทุกห้องในช่วงเวลาที่เลือก — ดาวน์โหลดแล้ว import กลับได้ทันที */
const sampleRows = computed((): SampleScoreRow[] => {
  const source =
    sessionEnrollmentsCache.value.length > 0
      ? sessionEnrollmentsCache.value
      : currentSessionEnrollments.value;
  return source.map((enrollment, index): SampleScoreRow => {
    const profile = enrollment.USER?.PROFILE;
    const draft = scoreDraftByEnrollmentId.value[enrollment.ERM_ID] ?? getScoreDraft(enrollment);
    const hasExistingScore =
      Object.values(draft.lineScores).some((score) => score > 0) ||
      scoreByEnrollmentId.value.has(enrollment.ERM_ID);
    const location =
      enrollment.SESSION_LOCATION?.LOCATION ??
      sessionLocations.value.find((item) => item.SL_ID === enrollment.SL_ID)?.LOCATION ??
      enrollment.SESSION?.LOCATION ??
      null;

    const lineScores: Record<number, number> = {};
    rubricItems.value.forEach((item, itemIndex) => {
      lineScores[item.id] = hasExistingScore
        ? (draft.lineScores[item.id] ?? 0)
        : 20 + ((index + itemIndex * 7) % 25);
    });
    const totalScore = hasExistingScore
      ? draft.scoreTotal || sumLineScores(rubricItems.value, lineScores)
      : sumLineScores(rubricItems.value, lineScores);

    const row: SampleScoreRow = {
      testTakerId: enrollment.ERM_TEST_TAKER?.trim() || '-',
      location: formatLocationLabel(location),
      fullnameEn: profile?.userFullnameEn || '-',
      fullnameTh: profile?.userFullnameTh || '-',
      citizenId: enrollment.USER?.USER_NATIONAL_ID?.trim() || '-',
      passport: enrollment.USER?.USER_PASSPORT_NO?.trim() || '-',
      totalScore,
    };
    rubricItems.value.forEach((item) => {
      row[`item_${item.id}`] = lineScores[item.id] ?? 0;
    });
    return row;
  });
});

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  void loadEnrollmentPage(pageAbortController?.signal);
};

const ensureSessionEnrollmentsCache = async (): Promise<BackendEnrollmentDetail[]> => {
  const examId = Number(route.params.examId);
  if (isNaN(examId) || examId <= 0 || selectedSessionId.value == null) {
    return [];
  }
  if (sessionEnrollmentsCache.value.length > 0) {
    return sessionEnrollmentsCache.value;
  }
  const all = await fetchRawEnrollmentsByExamId(examId, {
    sessionId: selectedSessionId.value,
  });
  sessionEnrollmentsCache.value = all;
  return all;
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
  const result: string[][] = [];
  let row: string[] = [];
  let col = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          col += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        col += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(col.trim());
        col = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        row.push(col.trim());
        result.push(row);
        row = [];
        col = '';
        if (char === '\r') i++;
      } else {
        col += char;
      }
    }
  }
  if (row.length > 0 || col !== '') {
    row.push(col.trim());
    result.push(row);
  }
  return result.filter((r) => r.some((cell) => cell !== ''));
};

const applyImportedScoreRows = async (rows: string[][]): Promise<void> => {
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
  const itemHeaderIndexes = rubricItems.value.map((item) => ({
    item,
    idx: headers.findIndex((header) => matchHeaderToRubricItem(header, item)),
  }));

  let matchedCount = 0;
  const nextImportedIds = new Set(importedEnrollmentIds.value);

  let importEnrollments: BackendEnrollmentDetail[];
  try {
    importEnrollments = await ensureSessionEnrollmentsCache();
  } catch (err) {
    console.error('Error loading enrollments for import:', err);
    $q.notify({
      type: 'negative',
      message: i18n.t('admin.scoreManagement.notifications.loadEnrollmentsImportFailed'),
    });
    return;
  }

  // Prebuild lookup maps once — O(enrollments) then O(1) per Excel row
  const enrollmentByTestTakerKey = new Map<string, BackendEnrollmentDetail>();
  for (const enrollment of importEnrollments) {
    const testTaker = enrollment.ERM_TEST_TAKER;
    if (!testTaker) continue;
    const key = normalizeImportKey(testTaker);
    if (!enrollmentByTestTakerKey.has(key)) {
      enrollmentByTestTakerKey.set(key, enrollment);
    }
  }

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i] || [];
    const citizenVal = idxCitizenId >= 0 ? values[idxCitizenId] : '';
    const passportVal = idxPassport >= 0 ? values[idxPassport] : '';
    const testTakerVal = idxTestTakerId >= 0 ? values[idxTestTakerId] : '';

    const cleanCitizen = citizenVal ? citizenVal.trim() : '';
    const cleanPassport = passportVal ? passportVal.trim() : '';
    const cleanTestTaker = testTakerVal ? testTakerVal.trim() : '';

    let matchedEnrollment: BackendEnrollmentDetail | undefined;

    if (cleanTestTaker && cleanTestTaker !== '-') {
      matchedEnrollment = enrollmentByTestTakerKey.get(normalizeImportKey(cleanTestTaker));
    }

    if (!matchedEnrollment && cleanCitizen && cleanCitizen !== '-') {
      const normCitizen = normalizeImportKey(cleanCitizen);
      matchedEnrollment = importEnrollments.find((enrollment) => {
        const dbCitizen = enrollment.USER?.USER_NATIONAL_ID;
        return dbCitizen && normalizeImportKey(dbCitizen) === normCitizen;
      });
    }

    if (!matchedEnrollment && cleanPassport && cleanPassport !== '-') {
      const normPassport = normalizeImportKey(cleanPassport);
      matchedEnrollment = importEnrollments.find((enrollment) => {
        const dbPassport = enrollment.USER?.USER_PASSPORT_NO;
        return dbPassport && normalizeImportKey(dbPassport) === normPassport;
      });
    }

    if (!matchedEnrollment) continue;

    const lineScores: Record<number, number> = {};
    for (const { item, idx } of itemHeaderIndexes) {
      if (idx < 0) continue;
      lineScores[item.id] = Number(values[idx]) || 0;
    }

    const rawTotal = headers.findIndex((header) =>
      ['total', 'รวม', 'คะแนนรวม'].some((token) => header.includes(token)),
    );
    const rawTotalVal = rawTotal >= 0 ? values[rawTotal] : undefined;
    const total =
      rawTotalVal !== undefined && rawTotalVal !== ''
        ? Number(rawTotalVal)
        : sumLineScores(rubricItems.value, lineScores);
    const level = resolveBandLevel(total);

    scoreDraftByEnrollmentId.value[matchedEnrollment.ERM_ID] = {
      lineScores,
      scoreTotal: total,
      band: level,
    };
    nextImportedIds.add(matchedEnrollment.ERM_ID);
    matchedCount += 1;
  }

  importedEnrollmentIds.value = nextImportedIds;
  showUploadDialog.value = false;

  $q.notify({
    type: matchedCount > 0 ? 'positive' : 'warning',
    message:
      matchedCount > 0
        ? i18n.t('admin.scoreManagement.notifications.importSuccess', { count: matchedCount })
        : i18n.t('admin.scoreManagement.notifications.importNoMatch'),
  });
};

const processScoreFile = async (file: File): Promise<void> => {
  const fileName = file.name.toLowerCase();

  try {
    if (fileName.endsWith('.csv')) {
      await applyImportedScoreRows(parseCsvRows(await file.text()));
      return;
    }

    if (fileName.endsWith('.xlsx')) {
      await applyImportedScoreRows(await parseXlsxFile(file));
      return;
    }

    $q.notify({
      type: 'warning',
      message: i18n.t('admin.scoreManagement.notifications.fileTypeUnsupported'),
    });
  } catch (err) {
    console.error('Error importing score file:', err);
    $q.notify({
      type: 'negative',
      message: i18n.t('admin.scoreManagement.notifications.importFailed'),
    });
  }
};

const handleUrlUpload = (url: string): void => {
  console.log('Importing from URL:', url);
  $q.notify({
    type: 'info',
    message: i18n.t('admin.scoreManagement.notifications.urlImportNotConnected'),
  });
};

const openSampleDialog = async (): Promise<void> => {
  try {
    await ensureSessionEnrollmentsCache();
  } catch (err) {
    console.error('Error loading enrollments for sample:', err);
    $q.notify({
      type: 'negative',
      message: i18n.t('admin.scoreManagement.notifications.loadSampleFailed'),
    });
    return;
  }

  if (sampleRows.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: i18n.t('admin.scoreManagement.notifications.noSampleApplicants'),
    });
    return;
  }

  samplePagination.value = {
    page: 1,
    rowsPerPage: 10,
    rowsNumber: sampleRows.value.length,
  };
  showUploadDialog.value = false;
  void nextTick(() => {
    showSampleDialog.value = true;
  });
};

const wrapCsvCell = (value: string | number, forceText = false): string => {
  let formatted = String(value ?? '');
  if (forceText && /^\d+$/.test(formatted)) {
    formatted = `\t${formatted}`;
  }
  return `"${formatted.replace(/"/g, '""')}"`;
};

const downloadSampleFile = (): void => {
  if (sampleRows.value.length === 0) {
    $q.notify({
      type: 'warning',
      message: i18n.t('admin.scoreManagement.notifications.noSampleApplicants'),
    });
    return;
  }

  const headers = sampleColumns.value.map((column) => wrapCsvCell(String(column.label ?? '')));
  const dataRows = sampleRows.value.map((row) => {
    const cells = sampleColumns.value.map((column) => {
      const field = String(column.field ?? '');
      return wrapCsvCell(row[field] ?? '');
    });
    return cells.join(',');
  });

  const content = `\ufeff${[headers.join(','), ...dataRows].join('\r\n')}`;
  const examName =
    formatExamDisplayTitle(
      exam.value?.EXAM_NAME,
      exam.value?.EXAM_ROUND,
      exam.value?.EXAM_FISCAL_YEAR,
    ) ||
    exam.value?.EXAM_NAME ||
    'exam';
  const fileName = `score_import_sample_${examName}`.replace(/[\s/\\?%*:|"<>]+/g, '_');
  const status = exportFile(`${fileName}.csv`, content, 'text/csv');

  if (status !== true) {
    $q.notify({
      type: 'negative',
      message: i18n.t('admin.scoreManagement.notifications.sampleDownloadFailed'),
    });
    return;
  }

  $q.notify({
    type: 'positive',
    message: i18n.t('admin.scoreManagement.notifications.sampleDownloadSuccess', {
      count: sampleRows.value.length,
    }),
  });
};

const clearImportedScores = (): void => {
  initializeScoreDrafts({ resetImported: true });
  $q.notify({
    type: 'positive',
    message: i18n.t('admin.scoreManagement.notifications.clearSuccess'),
  });
};

const confirmClearImportedScores = (): void => {
  if (!hasImportedScores.value) {
    $q.notify({
      type: 'warning',
      message: i18n.t('admin.scoreManagement.notifications.noImportedScores'),
    });
    return;
  }
  showClearConfirmDialog.value = true;
};

const saveScores = async (): Promise<void> => {
  if (!hasImportedScores.value) return;

  const examId = Number(route.params.examId);
  if (isNaN(examId) || examId <= 0) return;

  try {
    isLoading.value = true;
    const importedIds = [...importedEnrollmentIds.value];
    let enrollmentLookup = new Map(enrollments.value.map((e) => [e.ERM_ID, e]));
    const missingIds = importedIds.filter((id) => !enrollmentLookup.has(id));
    if (missingIds.length > 0) {
      const allSession = await ensureSessionEnrollmentsCache();
      enrollmentLookup = new Map(allSession.map((e) => [e.ERM_ID, e]));
    }

    const rowsToSave = importedIds
      .map((ermId) => enrollmentLookup.get(ermId))
      .filter((enrollment): enrollment is BackendEnrollmentDetail => enrollment != null);

    await Promise.all(
      rowsToSave.map((enrollment) => {
        const draft =
          scoreDraftByEnrollmentId.value[enrollment.ERM_ID] ?? getScoreDraft(enrollment);
        const payload = buildSavePayload(enrollment.ERM_ID, draft, rubricItems.value);
        const existingScore = scoreByEnrollmentId.value.get(enrollment.ERM_ID);

        return existingScore
          ? updateExamScore(existingScore.SCORES_ID, payload)
          : createExamScore(payload);
      }),
    );

    examScores.value = await fetchExamScores({ examId });
    initializeScoreDrafts({ resetImported: true });
    await loadEnrollmentPage();
    $q.notify({ type: 'positive', message: i18n.t('admin.scoreManagement.notifications.saveSuccess') });
  } catch (err) {
    console.error('Error saving scores:', err);
    $q.notify({ type: 'negative', message: i18n.t('admin.scoreManagement.notifications.saveFailed') });
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

const mapEnrollmentToScoreRow = (
  enrollment: BackendEnrollmentDetail,
  index: number,
): ScoreTableRow => {
  const profile = enrollment.USER?.PROFILE;
  const draft = scoreDraftByEnrollmentId.value[enrollment.ERM_ID] ?? getScoreDraft(enrollment);
  const score = scoreByEnrollmentId.value.get(enrollment.ERM_ID);
  const hasSavedCertificate = !!(score?.CERTIFICATES && score.CERTIFICATES.length > 0);
  const location =
    enrollment.SESSION_LOCATION?.LOCATION ??
    sessionLocations.value.find((item) => item.SL_ID === enrollment.SL_ID)?.LOCATION ??
    enrollment.SESSION?.LOCATION ??
    null;

  return {
    index: index + 1,
    ermId: enrollment.ERM_ID,
    nationalId: enrollment.ERM_TEST_TAKER || '-',
    titleTh: profile?.userTitleTh || profile?.userTitleEn || '-',
    fullnameTh:
      profile?.userFullnameTh || profile?.userFullnameEn || enrollment.USER?.USER_EMAIL || '-',
    fullnameEn: profile?.userFullnameEn || '-',
    email: enrollment.USER?.USER_EMAIL?.trim() || '-',
    phone: profile?.userPhone?.trim() || '-',
    paymentStatus: enrollment.ERM_STATUS,
    verifyStatus: enrollment.ERM_VERIFY_STATUS,
    sessionId: enrollment.SESSION_ID,
    sessionLocationId: enrollment.SL_ID ?? null,
    userProfileId: profile?.userProfileId || 0,
    remark: enrollment.ERM_PHYSICAL_STATUS || '',
    location: formatLocationLabel(location),
    scoreGrammar: scoreByCode(draft, rubricItems.value, 'LANG_USE'),
    scoreReading: scoreByCode(draft, rubricItems.value, 'READING'),
    scoreTotal: draft.scoreTotal,
    band: draft.band,
    itemScores: { ...draft.lineScores },
    hasImportedScore: importedEnrollmentIds.value.has(enrollment.ERM_ID),
    hasScore:
      importedEnrollmentIds.value.has(enrollment.ERM_ID) ||
      scoreByEnrollmentId.value.has(enrollment.ERM_ID),
    hasSavedCertificate,
  };
};

const loadExportScoreRows = async (): Promise<ScoreTableRow[]> => {
  const all = await ensureSessionEnrollmentsCache();
  return all.map((enrollment, index) => mapEnrollmentToScoreRow(enrollment, index));
};

const loadEnrollmentPage = async (signal?: AbortSignal): Promise<void> => {
  const examId = Number(route.params.examId);
  if (isNaN(examId) || examId <= 0 || selectedSessionId.value == null) return;

  const pageParams: {
    page: number;
    limit: number;
    search: string;
    sessionId: number;
    signal?: AbortSignal;
  } = {
    page: pagination.value.page,
    limit: pagination.value.rowsPerPage,
    search: searchQuery.value,
    sessionId: selectedSessionId.value,
  };
  if (signal) {
    pageParams.signal = signal;
  }

  const pageResult = await fetchRawEnrollmentsPage(examId, pageParams);

  enrollments.value = pageResult.data;
  enrollmentTotal.value = pageResult.total;
  pagination.value.rowsNumber = pageResult.total;
  initializeScoreDrafts();
};

const loadData = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (isNaN(examId) || examId <= 0) return;

  pageAbortController?.abort();
  pageAbortController = new AbortController();
  const { signal } = pageAbortController;
  const generation = ++loadGeneration;

  try {
    isLoading.value = true;
    const [examDetail, scores] = await Promise.all([
      fetchExamById(examId, { signal }),
      fetchExamScores({ examId }),
    ]);
    if (generation !== loadGeneration || signal.aborted) return;

    try {
      const rulesResponse = await getBandRules();
      if (generation !== loadGeneration) return;
      bandRules.value = rulesResponse.bandRules;
    } catch (error) {
      if (isRequestCanceled(error) || generation !== loadGeneration) return;
      console.error('Error fetching band rules:', error);
      bandRules.value = [];
    }

    exam.value = examDetail;
    examScores.value = scores;
    selectedSessionId.value = sessionTimeTabs.value[0]?.SS_ID ?? null;
    sessionEnrollmentsCache.value = [];
    pagination.value.page = 1;

    if (selectedSessionId.value != null) {
      await loadEnrollmentPage(signal);
    } else {
      enrollments.value = [];
      enrollmentTotal.value = 0;
      pagination.value.rowsNumber = 0;
    }
  } catch (err) {
    if (isRequestCanceled(err) || generation !== loadGeneration) return;
    console.error('Error fetching exam scores page data:', err);
  } finally {
    if (generation === loadGeneration) {
      isLoading.value = false;
      isInitializing.value = false;
    }
  }
};

const debouncedLoadEnrollmentPage = debounce(() => {
  void loadEnrollmentPage(pageAbortController?.signal);
}, 400);

watch(selectedSessionId, async (sessionId, previousSessionId) => {
  if (isInitializing.value) return;
  if (previousSessionId == null || sessionId == null) return;
  sessionEnrollmentsCache.value = [];
  pagination.value.page = 1;
  const generation = ++loadGeneration;
  try {
    isLoading.value = true;
    await loadEnrollmentPage(pageAbortController?.signal);
  } catch (err) {
    if (isRequestCanceled(err) || generation !== loadGeneration) return;
    console.error('Error refreshing enrollments for session:', err);
  } finally {
    if (generation === loadGeneration) {
      isLoading.value = false;
    }
  }
});

watch(searchQuery, () => {
  if (isInitializing.value) return;
  pagination.value.page = 1;
  debouncedLoadEnrollmentPage();
});

onMounted(() => {
  void loadData();
});

onBeforeUnmount(() => {
  pageAbortController?.abort();
  loadGeneration += 1;
  isLoading.value = false;
  debouncedLoadEnrollmentPage.cancel();
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
