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
      :title="exam.EXAM_NAME"
      :date="formatThaiDate(exam.EXAM_DATE)"
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
        <q-btn
          color="negative"
          class="action-btn text-weight-bold br-sm"
          unelevated
          label="ลบข้อมูลทั้งหมด"
          @click="clearImportedScores"
        />
        <q-btn
          color="primary"
          class="action-btn text-weight-bold br-sm"
          unelevated
          icon="file_upload"
          label="IMPORT"
          @click="showImportDialog = true"
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
          <div class="text-center">{{ row.fullnameTh }}</div>
        </template>

        <template v-slot:body-cell-scoreGrammar="{ row }">
          <div class="text-center">{{ row.hasImportedScore ? row.scoreGrammar : '' }}</div>
        </template>

        <template v-slot:body-cell-scoreReading="{ row }">
          <div class="text-center">{{ row.hasImportedScore ? row.scoreReading : '' }}</div>
        </template>

        <template v-slot:body-cell-scoreTotal="{ row }">
          <div class="text-center text-weight-bold text-primary">
            {{ row.hasImportedScore ? row.scoreTotal : '' }}
          </div>
        </template>

        <template v-slot:body-cell-band="{ row }">
          <div class="text-center text-weight-bold">
            {{ row.hasImportedScore ? row.band : '' }}
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
        @click="saveScores"
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
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar, type QTableColumn } from 'quasar';
import BaseTable from 'src/components/shared/base-table.vue';
import SearchBar from 'src/components/shared/search-bar.vue';
import DialogCsvImport from 'src/components/exam/dialog-csv-import.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import AppExamSessionTabs from 'src/components/exam/app-exam-session-time.vue';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
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
import { useThaiDate } from 'src/composables/useThaiDate';
import type { BackendEnrollmentDetail, EnrollmentTableRow } from 'src/types/enrollment.types';
import type { PaginationModel, TableRequestProps } from 'src/types/exam.types';

interface ScoreTableRow extends EnrollmentTableRow {
  scoreGrammar: number;
  scoreReading: number;
  scoreTotal: number;
  band: number;
  hasImportedScore: boolean;
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
  LOCATION: BackendLocation;
}

const route = useRoute();
const $q = useQuasar();
const { formatThaiDate } = useThaiDate();

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

    return sessionLocations.value.some(
      (location) =>
        location.SL_ID === selectedSessionLocationId.value &&
        location.SS_ID === enrollment.SESSION_ID,
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
      userProfileId: profile?.userProfileId || 0,
      remark: enrollment.ERM_PHYSICAL_STATUS || '',
      scoreGrammar: draft.scoreGrammar,
      scoreReading: draft.scoreReading,
      scoreTotal: draft.scoreTotal,
      band: draft.band,
      hasImportedScore: importedEnrollmentIds.value.has(enrollment.ERM_ID),
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
    style: 'width: 80px',
    headerStyle: 'width: 80px',
  },
  {
    name: 'nationalId',
    label: 'เลขประจำตัวสอบ',
    field: 'nationalId',
    align: 'center',
    style: 'width: 150px',
    headerStyle: 'width: 150px',
  },
  {
    name: 'titleTh',
    label: 'คำนำหน้า',
    field: 'titleTh',
    align: 'center',
    style: 'width: 90px',
    headerStyle: 'width: 90px',
  },
  {
    name: 'fullnameTh',
    label: 'ชื่อ-นามสกุล',
    field: 'fullnameTh',
    align: 'center',
    style: 'min-width: 200px',
    headerStyle: 'min-width: 200px',
  },
  {
    name: 'scoreGrammar',
    label: 'คำศัพท์และไวยากรณ์',
    field: 'scoreGrammar',
    align: 'center',
    style: 'width: 160px',
    headerStyle: 'width: 160px',
  },
  {
    name: 'scoreReading',
    label: 'ทักษะการอ่าน',
    field: 'scoreReading',
    align: 'center',
    style: 'width: 160px',
    headerStyle: 'width: 160px',
  },
  {
    name: 'scoreTotal',
    label: 'คะแนนรวม',
    field: 'scoreTotal',
    align: 'center',
    style: 'width: 160px',
    headerStyle: 'width: 160px',
  },
  {
    name: 'band',
    label: 'Level',
    field: 'band',
    align: 'center',
    style: 'width: 80px',
    headerStyle: 'width: 80px',
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

const decodeXmlText = (value: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<root>${value}</root>`, 'application/xml');
  return doc.documentElement.textContent || '';
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
    const values: string[] = [];
    [...row.getElementsByTagName('c')].forEach((cell) => {
      const cellRef = cell.getAttribute('r') || '';
      const cellType = cell.getAttribute('t');
      const cellIndex = columnNameToIndex(cellRef);
      const valueNode = cell.getElementsByTagName('v')[0];
      const inlineNode = cell.getElementsByTagName('t')[0];
      const rawValue = valueNode?.textContent || inlineNode?.textContent || '';

      if (cellType === 's') {
        values[cellIndex] = sharedStrings[Number(rawValue)] || '';
      } else {
        values[cellIndex] = decodeXmlText(rawValue);
      }
    });
    return values.map((value) => value || '');
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

const findEnrollmentByImportKey = (value: string): BackendEnrollmentDetail | undefined => {
  const target = normalizeImportKey(value);
  return currentRoomEnrollments.value.find((enrollment) => {
    const keys = [
      enrollment.USER?.USER_NATIONAL_ID || '',
      enrollment.USER?.USER_PASSPORT_NO || '',
    ].map(normalizeImportKey);

    return keys.includes(target);
  });
};

const applyImportedScoreRows = (rows: string[][]): void => {
  if (rows.length < 2) return;

  const headers = (rows[0] || []).map((header) => header.trim().toLowerCase());
  const idxTestTakerId = headers.findIndex((header) => header.includes('test taker'));
  const idxCitizenId = headers.findIndex((header) => header.includes('citizen'));
  const idxPassport = headers.findIndex((header) => header.includes('passport'));
  const idxNid =
    idxTestTakerId >= 0
      ? idxTestTakerId
      : idxCitizenId >= 0
        ? idxCitizenId
        : idxPassport >= 0
          ? idxPassport
          : headers.findIndex(
              (header) =>
                header.includes('nationalid') ||
                header.includes('national_id') ||
                header.includes('ref'),
            );
  const idxGrammar = headers.findIndex(
    (header) =>
      header.includes('grammar') || header.includes('vocab') || header.includes('language'),
  );
  const idxReading = headers.findIndex((header) => header.includes('reading'));
  const idxTotal = headers.findIndex((header) => header.includes('total'));
  const idxLevel = headers.findIndex((header) => header.includes('level'));

  let matchedCount = 0;
  const nextImportedIds = new Set(importedEnrollmentIds.value);

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i] || [];
    const importKey = (idxNid >= 0 ? values[idxNid] : values[1]) || '';
    const rawGrammar = idxGrammar >= 0 ? values[idxGrammar] : values[4];
    const rawReading = idxReading >= 0 ? values[idxReading] : values[5];
    const rawTotal = idxTotal >= 0 ? values[idxTotal] : undefined;
    const rawLevel = idxLevel >= 0 ? values[idxLevel] : undefined;
    const matchedEnrollment = findEnrollmentByImportKey(importKey);

    if (!matchedEnrollment) continue;

    const grammar = Number(rawGrammar) || 0;
    const reading = Number(rawReading) || 0;
    const total = Number(rawTotal) || grammar + reading;
    const level = Number(rawLevel) || calculateBand(total);
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
  padding: 0 24px;
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
</style>
