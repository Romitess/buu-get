<template>
  <q-page class="page-container scores-page">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="$t('admin.scoreManagement.pageTitle')"
      :subtitle="$t('admin.scoreManagement.pageSubtitle')"
    />

    <AppExamSessionTabs v-model="selectedSessionId" :sessions="exam?.SESSIONS" />

    <AppExamInfoCard
      v-if="exam"
      class="q-mb-md"
      :title="exam.EXAM_NAME"
      :date="formatThaiDate(exam.EXAM_DATE)"
      :time="selectedSessionTime"
      :location="selectedSessionLocation"
      :applicant-count="sessionTotalCount"
      is-admin
      is-score
    />

    <nav class="toolbar-section row items-center q-mb-md q-gutter-md">
      <SearchBar
        v-model="searchQuery"
        :placeholder="$t('admin.registrantManagement.searchPlaceholder')"
        class="search-bar col-12 col-md-auto"
      />
      <q-space class="gt-sm" />
      <div class="row q-gutter-sm col-12 col-md-auto justify-end">
        <input
          type="file"
          ref="fileInput"
          accept=".csv"
          style="display: none"
          @change="handleFileSelect"
        />
        <q-btn
          color="primary"
          class="action-btn text-weight-bold br-sm"
          unelevated
          icon="file_upload"
          :label="$t('admin.scoreManagement.importButton')"
          @click="showImportDialog = true"
        />
        <ExportCsvButton
          :columns="columns"
          :rows="scoreRows"
          file-name-prefix="exam-scores"
          class="export-btn text-weight-bold br-sm"
          color="primary"
          unelevated
          icon="file_download"
          :label="$t('admin.scoreManagement.exportCsv')"
        />
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
        <template v-slot:body-cell-index="{ row }">
          <div class="text-center">{{ row.index }}</div>
        </template>

        <template v-slot:body-cell-nationalId="{ row }">
          <div class="text-center">{{ row.nationalId }}</div>
        </template>

        <template v-slot:body-cell-titleTh="{ row }">
          <div class="text-center">{{ row.titleTh }}</div>
        </template>

        <template v-slot:body-cell-fullnameTh="{ row }">
          <div class="text-left q-pl-md">{{ row.fullnameTh }}</div>
        </template>

        <template v-slot:body-cell-scoreGrammar="{ row }">
          <div class="flex flex-center">
            <q-input
              v-model.number="row.scoreGrammar"
              dense
              outlined
              type="number"
              class="score-input"
              input-class="text-center"
              @update:model-value="calculateTotal(row)"
            />
          </div>
        </template>

        <template v-slot:body-cell-scoreReading="{ row }">
          <div class="flex flex-center">
            <q-input
              v-model.number="row.scoreReading"
              dense
              outlined
              type="number"
              class="score-input"
              input-class="text-center"
              @update:model-value="calculateTotal(row)"
            />
          </div>
        </template>

        <template v-slot:body-cell-scoreTotal="{ row }">
          <div class="text-center text-weight-bold text-primary">
            {{ row.scoreTotal }}
          </div>
        </template>

        <template v-slot:body-cell-band="{ row }">
          <div class="text-center text-weight-bold">
            {{ row.band }}
          </div>
        </template>
      </BaseTable>
    </main>

    <!-- Import Dialog -->
    <q-dialog v-model="showImportDialog">
      <q-card class="import-dialog-card q-pa-sm">
        <q-card-section>
          <div class="text-h6 text-weight-bold q-mb-lg">
            {{ $t('admin.scoreManagement.importDialog.title') }}
          </div>
          <div class="row q-col-gutter-md">
            <!-- CSV Option -->
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

            <!-- MOODLE Option -->
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

    <!-- Upload Dialog -->
    <q-dialog v-model="showUploadDialog">
      <q-card class="upload-dialog-card q-pa-md">
        <q-card-section class="row items-center justify-between q-pb-none">
          <div class="text-h6 text-weight-bold">
            {{ $t('admin.scoreManagement.uploadDialog.title') }}
          </div>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <!-- Drag and Drop Zone -->
          <div
            class="drop-zone column flex-center q-pa-xl cursor-pointer"
            :class="{ 'drop-zone--active': isDragging }"
            @click="triggerImport"
            @dragover.prevent="isDragging = true"
            @dragenter.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <q-icon name="cloud_upload" size="80px" color="dark" class="q-mb-md" />
            <div class="text-subtitle1 text-weight-bold text-dark text-center">
              {{ $t('admin.scoreManagement.uploadDialog.dragDropText') }}
            </div>
            <div class="text-caption text-grey-7 text-center q-mt-sm">
              {{ $t('admin.scoreManagement.uploadDialog.supportedFiles') }}
            </div>
          </div>

          <!-- URL Input Section -->
          <div class="q-mt-lg">
            <div class="text-subtitle2 text-weight-bold q-mb-sm">
              {{ $t('admin.scoreManagement.uploadDialog.orUrlText') }}
            </div>
            <div class="row q-gutter-sm items-center">
              <q-input
                v-model="fileUrl"
                outlined
                dense
                class="col"
                :placeholder="$t('admin.scoreManagement.uploadDialog.urlPlaceholder')"
              />
              <q-btn
                color="grey-3"
                text-color="dark"
                unelevated
                class="text-weight-bold br-sm q-px-md"
                style="height: 40px"
                :label="$t('admin.scoreManagement.uploadDialog.uploadBtn')"
                @click="handleUrlUpload"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { QTableColumn } from 'quasar';
import { useI18n } from 'vue-i18n';
import BaseTable from 'src/components/shared/base-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import ExportCsvButton from 'src/components/shared/export-csv-button.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSessionTabs from 'src/components/exam/app-exam-session-time.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import { fetchExamById } from 'src/services/exam.service';
import type { BackendExam } from 'src/types/exam';
import { useThaiDate } from 'src/composables/useThaiDate';
import type { EnrollmentTableRow } from 'src/types/enrollment.types';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

interface ScoreTableRow extends EnrollmentTableRow {
  scoreGrammar: number;
  scoreReading: number;
  scoreTotal: number;
  band: number;
}

const route = useRoute();
const { t } = useI18n();
const { formatThaiDate } = useThaiDate();

const isLoading = ref(false);
const exam = ref<BackendExam | null>(null);
const searchQuery = ref('');
const selectedSessionId = ref<number | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const rawScoreRows = ref<ScoreTableRow[]>([]);

const scoreRows = computed(() => {
  if (!searchQuery.value) return rawScoreRows.value;
  const query = searchQuery.value.toLowerCase();
  return rawScoreRows.value.filter(
    (row) => row.nationalId?.includes(query) || row.fullnameTh?.toLowerCase().includes(query),
  );
});

const sessionTotalCount = computed(() => scoreRows.value.length);

const selectedSession = computed(() => {
  return exam.value?.SESSIONS?.find((s) => s.SS_ID === selectedSessionId.value) || null;
});

const selectedSessionTime = computed((): string => {
  if (!selectedSession.value) return '-';
  const start = (selectedSession.value.SS_START_TIME || '').substring(0, 5);
  const end = (selectedSession.value.SS_END_TIME || '').substring(0, 5);
  return `${start}-${end}`;
});

const selectedSessionLocation = computed((): string => {
  if (!selectedSession.value?.LOCATION) return '-';
  const loc = selectedSession.value.LOCATION;
  return `${loc.LOCATION_NAME}${loc.LOCATION_ROOM_NO ? ` (${loc.LOCATION_ROOM_NO})` : ''}`;
});

watch(exam, (newExam) => {
  const firstSession = newExam?.SESSIONS?.[0];
  if (firstSession && !selectedSessionId.value) {
    selectedSessionId.value = firstSession.SS_ID;
  }
});

const pagination = ref<PaginationModel>({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const columns: QTableColumn[] = [
  {
    name: 'index',
    label: t('admin.scoreManagement.table.columns.index'),
    field: 'index',
    align: 'center',
    style: 'width: 80px',
    headerStyle: 'width: 80px',
  },
  {
    name: 'nationalId',
    label: t('admin.scoreManagement.table.columns.nationalId'),
    field: 'nationalId',
    align: 'center',
    style: 'width: 150px',
    headerStyle: 'width: 150px',
  },
  {
    name: 'titleTh',
    label: t('admin.scoreManagement.table.columns.prefix'),
    field: 'titleTh',
    align: 'center',
    style: 'width: 90px',
    headerStyle: 'width: 90px',
  },
  {
    name: 'fullnameTh',
    label: t('admin.scoreManagement.table.columns.fullName'),
    field: 'fullnameTh',
    align: 'left',
    style: 'min-width: 200px',
    headerStyle: 'min-width: 200px',
  },
  {
    name: 'scoreGrammar',
    label: t('admin.scoreManagement.table.columns.scoreGrammar'),
    field: 'scoreGrammar',
    align: 'center',
    style: 'width: 160px',
    headerStyle: 'width: 160px',
  },
  {
    name: 'scoreReading',
    label: t('admin.scoreManagement.table.columns.scoreReading'),
    field: 'scoreReading',
    align: 'center',
    style: 'width: 160px',
    headerStyle: 'width: 160px',
  },
  {
    name: 'scoreTotal',
    label: t('admin.scoreManagement.table.columns.scoreTotal'),
    field: 'scoreTotal',
    align: 'center',
    style: 'width: 160px',
    headerStyle: 'width: 160px',
  },
  {
    name: 'band',
    label: t('admin.scoreManagement.table.columns.band'),
    field: 'band',
    align: 'center',
    style: 'width: 80px',
    headerStyle: 'width: 80px',
  },
];

const onRequest = (props: TableRequestProps): void => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
};

const calculateBand = (total: number): number => {
  if (total >= 80) return 5;
  if (total >= 70) return 4;
  if (total >= 60) return 3;
  if (total >= 50) return 2;
  if (total >= 40) return 1;
  return 0;
};

const showImportDialog = ref(false);
const showUploadDialog = ref(false);
const isDragging = ref(false);
const fileUrl = ref('');

const triggerImport = (): void => {
  fileInput.value?.click();
};

const handleCsvOptionClick = (): void => {
  showImportDialog.value = false;
  showUploadDialog.value = true;
};

const calculateTotal = (row: ScoreTableRow): void => {
  const grammar = Number(row.scoreGrammar) || 0;
  const reading = Number(row.scoreReading) || 0;
  row.scoreTotal = grammar + reading;
  row.band = calculateBand(row.scoreTotal);
};

const processCsvFile = (file: File): void => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    if (!text) return;

    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) return;

    const headers = lines[0]!.split(',').map((h) => h.trim().toLowerCase());

    const idxNid = headers.findIndex((h) => h.includes('nationalid') || h.includes('เลขประจำตัว'));
    const idxTitle = headers.findIndex((h) => h.includes('title') || h.includes('คำนำหน้า'));
    const idxName = headers.findIndex((h) => h.includes('fullname') || h.includes('ชื่อ'));
    const idxGrammar = headers.findIndex((h) => h.includes('grammar') || h.includes('ไวยากรณ์'));
    const idxReading = headers.findIndex((h) => h.includes('reading') || h.includes('อ่าน'));

    const parsedRows: ScoreTableRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i]!.split(',').map((v) => v.trim());

      const nationalId = (idxNid >= 0 ? values[idxNid] : values[1]) || '-';
      const titleTh = (idxTitle >= 0 ? values[idxTitle] : values[2]) || '-';
      const fullnameTh = (idxName >= 0 ? values[idxName] : values[3]) || '-';

      const rawGrammar = idxGrammar >= 0 ? values[idxGrammar] : values[4];
      const rawReading = idxReading >= 0 ? values[idxReading] : values[5];

      const grammar = Number(rawGrammar) || 0;
      const reading = Number(rawReading) || 0;
      const total = grammar + reading;

      parsedRows.push({
        index: i,
        ermId: i,
        nationalId,
        titleTh,
        fullnameTh,
        paymentStatus: 1,
        verifyStatus: 1,
        sessionId: selectedSessionId.value || 0,
        userProfileId: 0,
        remark: '',
        scoreGrammar: grammar,
        scoreReading: reading,
        scoreTotal: total,
        band: calculateBand(total),
      });
    }

    rawScoreRows.value = parsedRows;
    pagination.value.rowsNumber = parsedRows.length;
    showUploadDialog.value = false;
  };

  reader.readAsText(file, 'utf-8');
};

const handleFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processCsvFile(file);
    target.value = '';
  }
};

const handleDrop = (event: DragEvent): void => {
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    processCsvFile(file);
  }
};

const handleUrlUpload = (): void => {
  console.log('Importing from URL:', fileUrl.value);
};

const loadData = async (): Promise<void> => {
  const examId = Number(route.params.examId);
  if (!isNaN(examId) && examId > 0) {
    try {
      isLoading.value = true;
      exam.value = await fetchExamById(examId);
      rawScoreRows.value = [];
      pagination.value.rowsNumber = 0;
    } catch (err) {
      console.error('Error fetching exam:', err);
    } finally {
      isLoading.value = false;
    }
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
  padding: 0 24px;
}

.export-btn {
  height: 40px;
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

.score-input {
  width: 80px;
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

.upload-dialog-card {
  min-width: 650px;
  border-radius: var(--radius-md);

  @media (max-width: $breakpoint-sm-max) {
    min-width: 90vw;
  }
}

.drop-zone {
  border: 1px dashed #64b5f6;
  border-radius: var(--radius-md);
  background-color: #e3f2fd;
  transition: all 0.2s ease;
  min-height: 250px;

  &--active,
  &:hover {
    background-color: #bbdefb;
    border-color: #2196f3;
  }
}
</style>
