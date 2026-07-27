<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="certificate-dialog-card q-pa-md relative-position">
      <AppButton
        icon="close"
        flat
        round
        dense
        class="absolute-top-right q-ma-md text-grey-5 close-btn"
        @click="onCancel"
      />

      <q-card-section class="q-pb-none">
        <div class="dialog-title text-weight-bold text-dark">ข้อมูลการออกใบ Certificate</div>
      </q-card-section>

      <q-card-section class="q-pb-none">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 text-weight-bold text-dark">
            {{ viewMode ? 'ใบ Certificate' : 'ตัวอย่างใบ Certificate' }}
          </div>
          <div class="row items-center toggle-side-pane">
            <span
              class="cursor-pointer"
              :class="{
                'active-side': currentSide === 'front',
                'inactive-side': currentSide !== 'front',
              }"
              @click="currentSide = 'front'"
            >
              ด้านหน้า
            </span>
            <span class="q-mx-xs text-grey-4">|</span>
            <span
              class="cursor-pointer"
              :class="{
                'active-side': currentSide === 'back',
                'inactive-side': currentSide !== 'back',
              }"
              @click="currentSide = 'back'"
            >
              ด้านหลัง
            </span>
          </div>
        </div>

        <div class="certificate-card-preview relative-position">
          <template v-if="currentSide === 'front'">
            <div class="cert-header row items-center no-wrap">
              <div class="col-auto">
                <img src="icons/logo-vocher.png" class="cert-logo" alt="BUULI Logo" />
              </div>
              <div class="col text-center cert-title-container">
                <div class="cert-main-title text-weight-bold">
                  BUU-GET: Burapha University's Graduate English Test
                </div>
                <div class="cert-sub-title text-weight-medium">Test Taker Score Report</div>
              </div>
            </div>

            <div class="cert-body flex-1 column justify-between">
              <div class="watermark-bg no-pointer-events">GET</div>

              <div class="row q-col-gutter-md items-stretch content-container">
                <div class="col-12 col-sm-4 flex flex-center column">
                  <div class="profile-photo-wrapper shadow-1">
                    <img
                      v-if="userPhotoUrl"
                      :src="userPhotoUrl"
                      class="profile-photo-img"
                      alt="Profile"
                    />
                    <q-icon
                      v-else
                      name="image"
                      size="48px"
                      class="profile-photo-placeholder-icon"
                    />
                  </div>
                  <div class="photo-name text-weight-bold q-mt-sm">
                    {{ previewFullname }}
                  </div>
                </div>

                <div class="col-12 col-sm-8 detail-grid-column">
                  <div class="row q-col-gutter-y-sm full-height items-center">
                    <div class="col-12 col-sm-6 detail-group">
                      <div class="info-group">
                        <span class="info-label">Test Taker ID:</span>
                        <span class="info-value">{{ previewUserCode }}</span>
                      </div>
                      <div class="info-group">
                        <span class="info-label">Citizen ID:</span>
                        <span class="info-value">{{ previewNationalId }}</span>
                      </div>
                    </div>

                    <div class="col-12 col-sm-6 detail-group">
                      <div class="info-group">
                        <span class="info-label">Test Session:</span>
                        <span class="info-value">{{ testSession }}</span>
                      </div>
                      <div class="info-group">
                        <span class="info-label">Test Date:</span>
                        <span class="info-value">{{ testDate }}</span>
                      </div>
                    </div>

                    <div class="col-12 q-mt-md">
                      <div class="score-section">
                        <div class="score-header q-mb-xs">Score</div>
                        <div class="row justify-between items-center q-py-xs score-row">
                          <div class="score-label">1. Vocabulary & Grammar</div>
                          <div class="score-val">{{ previewVocabScore }}</div>
                        </div>
                        <div class="row justify-between items-center q-py-xs score-row">
                          <div class="score-label">2. Reading</div>
                          <div class="score-val">{{ previewReadingScore }}</div>
                        </div>
                        <div
                          class="row justify-between items-center q-py-xs score-row text-weight-bold"
                        >
                          <div class="text-dark">Overall BUU-GET Score</div>
                          <div class="text-dark">{{ previewTotalScore }}</div>
                        </div>
                        <q-separator class="score-separator q-my-xs" />
                        <div class="row items-center q-py-xs score-row-level text-dark">
                          <div class="col text-left">Level</div>
                          <div class="col text-center">Band</div>
                          <div class="col text-right text-weight-bold">{{ previewBandLevel }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="cert-footer row justify-between items-center no-wrap">
              <div class="col row q-col-gutter-x-xl metadata-group">
                <div class="col-auto text-left">
                  <div class="metadata-label">Report Issue Date:</div>
                  <div class="metadata-value">{{ issueDate }}</div>
                </div>
                <div class="col-auto text-left">
                  <div class="metadata-label">Score Valid Until:</div>
                  <div class="metadata-value">{{ previewValidUntilDate }}</div>
                </div>
              </div>
              <div class="col-auto text-right">
                <q-icon name="qr_code_2" size="40px" color="dark" class="qr-code-icon" />
              </div>
            </div>
          </template>

          <template v-else>
            <div class="cert-back-container column justify-between">
              <div class="watermark-bg no-pointer-events">GET</div>
              <div class="cert-back-content">
                <div class="text-subtitle1 text-weight-bold text-dark text-center q-mb-md">
                  BUU GET Band Description
                </div>
                <div class="band-table-container">
                  <table class="band-table">
                    <thead>
                      <tr>
                        <th class="text-center" style="width: 10%">Band</th>
                        <th class="text-center" style="width: 15%">Score</th>
                        <th class="text-center" style="width: 12%">CEFR</th>
                        <th class="text-left">Performance Descriptor</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="rule in bandRules" :key="rule.id">
                        <td class="text-center text-weight-bold">{{ rule.band }}</td>
                        <td class="text-center">{{ rule.minScore }}-{{ rule.maxScore }}</td>
                        <td class="text-center">{{ rule.cefr }}</td>
                        <td class="text-left descriptor-cell">
                          {{ rule.descriptor }}
                        </td>
                      </tr>
                      <tr v-if="!bandRules.length">
                        <td colspan="4" class="text-center text-grey-6 py-md">
                          No band descriptions defined
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <p class="band-table-note text-left italic">
                The performance descriptor is taken from CEFR Overall Reading Comprehension Scale
              </p>
            </div>
          </template>
        </div>
      </q-card-section>

      <q-card-section class="q-pt-md">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <div class="text-subtitle2 text-weight-bold text-dark q-mb-xs">
              Report Issue Date <span v-if="!viewMode" class="text-negative">*</span>
            </div>
            <q-input
              :model-value="displayValidFromDate"
              placeholder="DD/MM/YYYY"
              outlined
              dense
              readonly
              class="valid-until-input"
            >
              <template v-slot:append v-if="!viewMode">
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="validFromDate"
                      mask="YYYY-MM-DD"
                      :options="issueDateOptions"
                    >
                      <div class="row items-center justify-end">
                        <AppButton v-close-popup label="ปิด" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12 col-sm-6">
            <div class="text-subtitle2 text-weight-bold text-dark q-mb-xs">
              Score Valid Until <span v-if="!viewMode" class="text-negative">*</span>
            </div>
            <q-input
              :model-value="displayValidUntilDate"
              placeholder="DD/MM/YYYY"
              outlined
              dense
              readonly
              class="valid-until-input"
            >
              <template v-slot:append v-if="!viewMode">
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="validUntilDate" mask="YYYY-MM-DD">
                      <div class="row items-center justify-end">
                        <AppButton v-close-popup label="ปิด" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>

      <q-card-actions v-if="!viewMode" align="center" class="q-pb-md row q-gutter-lg no-wrap">
        <AppButton label="ยกเลิก" class="dialog-btn cancel-btn" @click="onCancel" />
        <AppButton
          label="ยืนยันการออกใบคะแนน"
          color="primary"
          class="dialog-btn confirm-btn"
          :loading="isSubmitting"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import AppButton from 'src/components/base/app-button.vue';
import { createExamCertificate } from 'src/services/exam-certificate.service';
import { getImageUrl } from 'src/services/image.service';
import { getBandRules, type BandRuleData } from 'src/services/score-criteria.service';

interface Props {
  modelValue: boolean;
  examDate: string | Date | null | undefined;
  sessionId: number | null | undefined;
  sessionName: string | null | undefined;
  candidates: Array<{ SCORES_ID: number; USER_ID: number }>;
  viewMode?: boolean;
  candidateInfo?:
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
    | undefined;
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: false,
  candidateInfo: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'issued'): void;
}>();

const $q = useQuasar();
const currentSide = ref<'front' | 'back'>('front');
const validFromDate = ref('');
const validUntilDate = ref('');
const isSubmitting = ref(false);

const DEFAULT_BAND_RULES: Omit<BandRuleData, 'id'>[] = [
  {
    band: '1',
    minScore: 40,
    maxScore: 49,
    cefr: 'A2',
    descriptor:
      'Can understand short, simple texts on familiar matters of a concrete type which consist of high frequency every day or job-related language.',
  },
  {
    band: '2',
    minScore: 50,
    maxScore: 59,
    cefr: 'A2',
    descriptor:
      'Can understand short, simple texts on familiar matters of a concrete type which consist of high frequency every day or job-related language.',
  },
  {
    band: '3',
    minScore: 60,
    maxScore: 69,
    cefr: 'B1',
    descriptor:
      'Can read straightforward factual texts on subjects related to his/her field and interest with a satisfactory level of comprehension.',
  },
  {
    band: '4',
    minScore: 70,
    maxScore: 79,
    cefr: 'B1',
    descriptor:
      'Can read straightforward factual texts on subjects related to his/her field and interest with a satisfactory level of comprehension.',
  },
  {
    band: '5',
    minScore: 80,
    maxScore: 100,
    cefr: 'B2',
    descriptor:
      'Can read with a large degree of independence, adapting style and speed of reading to different texts and purposes, and using appropriate reference sources selectively. Has a broad active reading vocabulary, but may experience some difficulty with low frequency idioms.',
  },
];

const bandRules = ref<BandRuleData[]>([]);

const loadBandRules = async (): Promise<void> => {
  try {
    const data = await getBandRules();
    if (data.bandRules && data.bandRules.length > 0) {
      bandRules.value = data.bandRules;
    } else {
      bandRules.value = DEFAULT_BAND_RULES.map((rule, idx) => ({
        id: String(idx + 1),
        ...rule,
      }));
    }
  } catch (err) {
    console.error('Failed to load band rules in certificate dialog:', err);
    bandRules.value = DEFAULT_BAND_RULES.map((rule, idx) => ({
      id: String(idx + 1),
      ...rule,
    }));
  }
};

onMounted(() => {
  void loadBandRules();
});

const getLocalDateYmd = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const isFutureLocalDate = (dateYmd: string): boolean => dateYmd > getLocalDateYmd();

/** Quasar q-date options: disable future calendar days for Report Issue Date. */
const issueDateOptions = (date: string): boolean => {
  const normalized = date.replace(/\//g, '-');
  return normalized <= getLocalDateYmd();
};

const formatEnglishDate = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const day = d.getDate();
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const testSession = computed(() => {
  if (props.viewMode && props.candidateInfo?.certCode) {
    return props.sessionName || '1/2569';
  }
  if (props.sessionName) return props.sessionName;
  if (!props.sessionId || !props.examDate) return 'X/XXXX';
  const year = new Date(props.examDate).getFullYear() + 543;
  return `${props.sessionId}/${year}`;
});

const testDate = computed(() => {
  if (props.viewMode && props.candidateInfo?.certIssuedAt) {
    return formatEnglishDate(props.examDate);
  }
  return formatEnglishDate(props.examDate);
});

const issueDate = computed(() => {
  if (validFromDate.value) {
    return formatEnglishDate(validFromDate.value);
  }
  return formatEnglishDate(new Date());
});

const previewValidUntilDate = computed(() => {
  if (validUntilDate.value) {
    return formatEnglishDate(validUntilDate.value);
  }
  return 'XX XXX XXXX';
});

const displayValidFromDate = computed(() => {
  if (!validFromDate.value) return '';
  const parts = validFromDate.value.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return validFromDate.value;
});

const displayValidUntilDate = computed(() => {
  if (!validUntilDate.value) return '';
  const parts = validUntilDate.value.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return validUntilDate.value;
});

const previewFullname = computed(() => {
  if (props.viewMode && props.candidateInfo?.fullname) return props.candidateInfo.fullname;
  return 'XX. XXXXX XXXXXX';
});

const previewUserCode = computed(() => {
  if (props.viewMode && props.candidateInfo?.userCode) return props.candidateInfo.userCode;
  return 'XXXXXXXXX';
});

const previewNationalId = computed(() => {
  if (props.viewMode && props.candidateInfo?.nationalId) return props.candidateInfo.nationalId;
  return 'X-XXXX-XXXXX-XX-X';
});

const previewVocabScore = computed(() => {
  if (props.viewMode && props.candidateInfo?.scoreGrammar !== undefined) {
    return `${props.candidateInfo.scoreGrammar}/50`;
  }
  return 'XX/50';
});

const previewReadingScore = computed(() => {
  if (props.viewMode && props.candidateInfo?.scoreReading !== undefined) {
    return `${props.candidateInfo.scoreReading}/50`;
  }
  return 'XX/50';
});

const previewTotalScore = computed(() => {
  if (props.viewMode && props.candidateInfo?.scoreTotal !== undefined) {
    return `${props.candidateInfo.scoreTotal}/100`;
  }
  return 'XXX/100';
});

const previewBandLevel = computed(() => {
  if (props.viewMode && props.candidateInfo?.band !== undefined) {
    return String(props.candidateInfo.band);
  }
  return 'X';
});

const userPhotoUrl = computed(() => {
  if (props.viewMode && props.candidateInfo?.userPhoto) {
    return getImageUrl(props.candidateInfo.userPhoto);
  }
  return null;
});

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      currentSide.value = 'front';
      if (props.viewMode && props.candidateInfo) {
        validFromDate.value = props.candidateInfo.certIssuedAt
          ? props.candidateInfo.certIssuedAt.split('T')[0] || ''
          : '';
        validUntilDate.value = props.candidateInfo.certExpiresAt
          ? props.candidateInfo.certExpiresAt.split('T')[0] || ''
          : '';
      } else {
        const today = new Date();
        validFromDate.value = getLocalDateYmd(today);

        const expiry = new Date(today);
        expiry.setFullYear(today.getFullYear() + 2);
        validUntilDate.value = getLocalDateYmd(expiry);
      }
    } else {
      validFromDate.value = '';
      validUntilDate.value = '';
    }
  },
  { immediate: true },
);

watch(validFromDate, (newVal) => {
  if (newVal && !props.viewMode) {
    const d = new Date(newVal);
    d.setFullYear(d.getFullYear() + 2);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    validUntilDate.value = `${yyyy}-${mm}-${dd}`;
  }
});

const onCancel = (): void => {
  emit('update:modelValue', false);
};

const onConfirm = async (): Promise<void> => {
  if (!props.candidates || props.candidates.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'ไม่มีผู้เข้าสอบที่มีคะแนนสำหรับออกใบ Certificate',
    });
    return;
  }

  if (!validFromDate.value) {
    $q.notify({
      type: 'warning',
      message: 'กรุณาเลือกวันที่ออกใบรับรอง',
    });
    return;
  }

  if (isFutureLocalDate(validFromDate.value)) {
    $q.notify({
      type: 'warning',
      message: 'Report Issue Date ต้องไม่เป็นวันในอนาคต',
    });
    return;
  }

  if (!validUntilDate.value) {
    $q.notify({
      type: 'warning',
      message: 'กรุณาเลือกวันที่สิ้นสุดอายุผลสอบ',
    });
    return;
  }

  try {
    isSubmitting.value = true;
    const promises = props.candidates.map(async (candidate) => {
      return createExamCertificate({
        SCORES_ID: candidate.SCORES_ID,
        USER_ID: candidate.USER_ID,
        CERT_ISSUED_AT: new Date(validFromDate.value).toISOString(),
        CERT_EXPIRES_AT: new Date(validUntilDate.value).toISOString(),
      });
    });

    await Promise.all(promises);

    $q.notify({
      type: 'positive',
      message: `ออกใบ Certificate ทั้งหมด ${props.candidates.length} รายการสำเร็จ`,
    });
    emit('issued');
    emit('update:modelValue', false);
  } catch (err) {
    console.error('Error issuing certificates in batch:', err);
    $q.notify({
      type: 'negative',
      message: 'ออกใบ Certificate บางรายการไม่สำเร็จ',
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.certificate-dialog-card {
  width: 100%;
  max-width: 680px;
  border-radius: 16px !important;
  background: #ffffff;
  box-shadow: var(--dialog-shadow);
}

.dialog-title {
  font-size: 1.25rem;
  color: var(--text-primary);
}

.toggle-side-pane {
  font-size: 13px;
}

.active-side {
  color: #000000;
  text-decoration: underline;
  font-weight: 600;
}

.inactive-side {
  color: var(--text-secondary);
  font-weight: 400;
}

.certificate-card-preview {
  width: 100%;
  height: 375px;
  border: 1.5px solid #cbd5e1;
  border-radius: 12px;
  background-color: #f8f9fa;
  overflow: hidden;
  position: relative;
  font-family: 'Sarabun', 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.cert-header {
  height: 60px;
  padding: 12px 20px;
  background-color: #f8f9fa;
  border-bottom: 1.5px solid #cbd5e1;
  box-sizing: border-box;
}

.cert-logo {
  height: 36px;
  object-fit: contain;
}

.cert-main-title {
  font-size: 13px;
  line-height: 1.2;
  color: #104a8e;
}

.cert-sub-title {
  font-size: 11px;
  line-height: 1.2;
  color: #707070;
}

.cert-body {
  position: relative;
  padding: 16px 20px;
  background: #f8f9fa;
}

.watermark-bg {
  position: absolute;
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  font-family: 'Sarabun', 'Inter', sans-serif;
  font-weight: 800;
  font-size: 120px;
  line-height: 100%;
  color: rgba(16, 74, 142, 0.04);
  z-index: 0;
  user-select: none;
  pointer-events: none;
}

.content-container {
  position: relative;
  z-index: 1;
}

.profile-photo-wrapper {
  width: 120px;
  height: 144px;
  background-color: #00000033 !important;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1.5px solid #00000033 !important;
}

.profile-photo-placeholder-icon {
  color: #000000 !important;
}

.profile-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-name {
  font-size: 11px;
  line-height: 1.3;
  text-align: center;
  max-width: 120px;
  word-break: break-word;
  color: #104a8e;
}

.detail-grid-column {
  padding-left: 12px !important;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-group {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 11px;
  color: #000000;
  font-weight: 600;
  margin-bottom: 2px;
  line-height: 1.2;
}

.info-value {
  font-size: 14px;
  font-weight: 700;
  color: #104a8e;
  line-height: 1.3;
}

.score-section {
  width: 100%;
}

.score-header {
  font-size: 12px;
  color: #000000;
  padding-bottom: 2px;
  text-decoration: underline;
  font-weight: 700;
}

.score-row {
  font-size: 11px;
  color: #000000;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.score-val {
  font-weight: bold;
}

.score-separator {
  background-color: #000000 !important;
  height: 1px;
  margin: 4px 0;
  opacity: 0.8;
}

.score-row-level {
  font-size: 11px;
  color: #000000;
  font-weight: 600;
}

.cert-footer {
  height: 64px;
  padding: 12px 20px;
  background-color: #f8f9fa;
  border-top: 1.5px solid #cbd5e1;
  box-sizing: border-box;
}

.metadata-group {
  display: flex;
  gap: 24px;
}

.metadata-label {
  font-size: 11px;
  color: #000000;
  font-weight: 600;
  line-height: 1.2;
}

.metadata-value {
  font-size: 13px;
  color: #104a8e;
  font-weight: 700;
  margin-top: 2px;
}

.qr-code-icon {
  display: block;
}

.cert-back-container {
  background-color: #ffffff;
  position: relative;
  height: 100%;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
}

.band-table-container {
  width: 100%;
}

.band-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11.5px;
  line-height: 1.35;

  th,
  td {
    padding: 5px 6px;
    border: none;
  }

  thead {
    tr {
      border-bottom: 1.5px solid #000000;
    }
  }

  th {
    color: #1e293b;
    font-weight: 700;
  }

  tbody {
    tr {
      border-bottom: 1px solid #cbd5e1;

      &:last-child {
        border-bottom: 1.5px solid #000000;
      }
    }
  }

  td {
    color: #334155;
    vertical-align: middle;
  }

  .descriptor-cell {
    font-size: 11px;
    white-space: normal;
    word-break: break-word;
  }
}

.band-table-note {
  font-size: 10px;
  color: #475569;
  margin-bottom: 0;
  line-height: 1.2;
}

.dialog-btn {
  width: 220px !important;
  height: 44px !important;
  border-radius: 10px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.cancel-btn {
  background-color: var(--neutral-gray-light) !important;
  color: var(--text-primary) !important;
  box-shadow: none !important;

  &:hover {
    background-color: #d2d2d2 !important;
    filter: none !important;
    transform: translateY(-1px);
  }
}

.valid-until-input {
  :deep(.q-field__control) {
    border-radius: 8px;
  }
}

.close-btn {
  z-index: 10;
}
</style>
