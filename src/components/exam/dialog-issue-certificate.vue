<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="certificate-dialog-card q-pa-md relative-position">
      <q-btn
        icon="close"
        flat
        round
        dense
        class="absolute-top-right q-ma-md text-grey-5"
        style="z-index: 10"
        @click="onCancel"
      />

      <q-card-section class="q-pb-none">
        <div class="dialog-title text-weight-bold text-dark">ข้อมูลการออกใบ Certificate</div>
      </q-card-section>

      <q-card-section class="q-pb-none">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-subtitle2 text-weight-bold text-dark">ตัวอย่างใบ Certificate</div>
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
                <div class="cert-main-title text-primary text-weight-bold">
                  BUU-GET: Burapha University's Graduate English Test
                </div>
                <div class="cert-sub-title text-grey-7 text-weight-medium">
                  Test Taker Score Report
                </div>
              </div>
            </div>

            <div class="cert-body flex-1 column justify-between">
              <div class="watermark-bg no-pointer-events">GET</div>

              <div class="row q-col-gutter-md items-stretch content-container">
                <div class="col-12 col-sm-4 flex flex-center column">
                  <div class="profile-photo-wrapper shadow-1">
                    <q-icon name="image" size="48px" color="grey-5" />
                  </div>
                  <div class="photo-name text-weight-bold text-primary q-mt-sm">
                    XX. XXXXX XXXXXX
                  </div>
                </div>

                <div class="col-12 col-sm-8 detail-grid-column">
                  <div class="row q-col-gutter-y-sm full-height items-center">
                    <div class="col-12 col-sm-6 detail-group">
                      <div class="info-group">
                        <span class="info-label">Test Taker ID:</span>
                        <span class="info-value">XXXXXXXXX</span>
                      </div>
                      <div class="info-group">
                        <span class="info-label">Citizen ID:</span>
                        <span class="info-value">X-XXXX-XXXXX-XX-X</span>
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
                          <div class="score-val">XX/50</div>
                        </div>
                        <div class="row justify-between items-center q-py-xs score-row">
                          <div class="score-label">2. Reading</div>
                          <div class="score-val">XX/50</div>
                        </div>
                        <div
                          class="row justify-between items-center q-py-xs score-row text-weight-bold"
                        >
                          <div class="text-primary">Overall BUU-GET Score</div>
                          <div class="text-primary">XXX/100</div>
                        </div>
                        <q-separator class="score-separator q-my-xs" />
                        <div class="row justify-between items-center q-py-xs score-row-level">
                          <div class="score-label">Level</div>
                          <div class="row no-wrap score-level-val">
                            <div class="q-mr-xl">Band</div>
                            <div>X</div>
                          </div>
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
                      <tr>
                        <td class="text-center text-weight-bold">1</td>
                        <td class="text-center">40-49</td>
                        <td class="text-center">A2</td>
                        <td class="text-left descriptor-cell">
                          Can understand short, simple texts on familiar matters of a concrete type
                          which consist of high frequency every day or job-related language.
                        </td>
                      </tr>
                      <tr>
                        <td class="text-center text-weight-bold">2</td>
                        <td class="text-center">50-59</td>
                        <td class="text-center">A2</td>
                        <td class="text-left descriptor-cell">
                          Can understand short, simple texts on familiar matters of a concrete type
                          which consist of high frequency every day or job-related language.
                        </td>
                      </tr>
                      <tr>
                        <td class="text-center text-weight-bold">3</td>
                        <td class="text-center">60-69</td>
                        <td class="text-center">B1</td>
                        <td class="text-left descriptor-cell">
                          Can read straightforward factual texts on subjects related to his/her
                          field and interest with a satisfactory level of comprehension.
                        </td>
                      </tr>
                      <tr>
                        <td class="text-center text-weight-bold">4</td>
                        <td class="text-center">70-79</td>
                        <td class="text-center">B1</td>
                        <td class="text-left descriptor-cell">
                          Can read straightforward factual texts on subjects related to his/her
                          field and interest with a satisfactory level of comprehension.
                        </td>
                      </tr>
                      <tr>
                        <td class="text-center text-weight-bold">5</td>
                        <td class="text-center">80-100</td>
                        <td class="text-center">B2</td>
                        <td class="text-left descriptor-cell">
                          Can read with a large degree of independence, adapting style and speed of
                          reading to different texts and purposes, and using appropriate reference
                          sources selectively. Has a broad active reading vocabulary, but may
                          experience some difficulty with low frequency idioms.
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
        <div class="text-subtitle2 text-weight-bold text-dark q-mb-xs">
          Score Valid Until <span class="text-negative">*</span>
        </div>
        <q-input
          :model-value="displayValidUntilDate"
          placeholder="DD/MM/YYYY"
          outlined
          dense
          readonly
          class="valid-until-input"
        >
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="validUntilDate" mask="YYYY-MM-DD">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="ปิด" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </q-card-section>

      <q-card-actions align="center" class="q-pb-md row q-gutter-lg no-wrap">
        <AppButton label="ยกเลิก" class="dialog-btn cancel-btn" @click="onCancel" />
        <AppButton
          label="ยืนยันการออกใบ Cer"
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
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppButton from 'src/components/base/app-button.vue';
import { createExamCertificate } from 'src/services/exam-certificate.service';

const props = defineProps<{
  modelValue: boolean;
  examDate: string | Date | null | undefined;
  sessionId: number | null | undefined;
  sessionName: string | null | undefined;
  candidates: Array<{ SCORES_ID: number; USER_ID: number }>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'issued'): void;
}>();

const $q = useQuasar();
const currentSide = ref<'front' | 'back'>('front');
const validUntilDate = ref('');
const isSubmitting = ref(false);

const formatEnglishDate = (dateStr: string | Date | undefined | null): string => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
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
  if (props.sessionName) return props.sessionName;
  if (!props.sessionId || !props.examDate) return 'X/XXXX';
  const year = new Date(props.examDate).getFullYear() + 543;
  return `${props.sessionId}/${year}`;
});

const testDate = computed(() => {
  return formatEnglishDate(props.examDate);
});

const issueDate = computed(() => {
  return formatEnglishDate(new Date());
});

const displayValidUntilDate = computed(() => {
  if (!validUntilDate.value) return '';
  const parts = validUntilDate.value.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return validUntilDate.value;
});

const previewValidUntilDate = computed(() => {
  if (validUntilDate.value) {
    return formatEnglishDate(validUntilDate.value);
  }
  if (props.examDate) {
    const examDate = new Date(props.examDate);
    const expiryDate = new Date(
      examDate.getFullYear() + 2,
      examDate.getMonth(),
      examDate.getDate(),
    );
    return formatEnglishDate(expiryDate);
  }
  return 'XX XXX XXXX';
});

watch(
  () => props.modelValue,
  () => {
    validUntilDate.value = '';
    currentSide.value = 'front';
  },
  { immediate: true },
);

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

  let targetExpiryDate = validUntilDate.value;
  if (!targetExpiryDate) {
    if (props.examDate) {
      const examDate = new Date(props.examDate);
      const expiryDate = new Date(
        examDate.getFullYear() + 2,
        examDate.getMonth(),
        examDate.getDate(),
      );
      const yyyy = expiryDate.getFullYear();
      const mm = String(expiryDate.getMonth() + 1).padStart(2, '0');
      const dd = String(expiryDate.getDate()).padStart(2, '0');
      targetExpiryDate = `${yyyy}-${mm}-${dd}`;
    }
  }

  if (!targetExpiryDate) {
    $q.notify({
      type: 'warning',
      message: 'กรุณาเลือกวันที่สิ้นสุดอายุผลสอบ',
    });
    return;
  }

  try {
    isSubmitting.value = true;
    const promises = props.candidates.map(async (candidate) => {
      const certCode = 'CERT-' + crypto.randomUUID().toUpperCase();
      return createExamCertificate({
        SCORES_ID: candidate.SCORES_ID,
        USER_ID: candidate.USER_ID,
        CERT_ISSUED_AT: new Date().toISOString(),
        CERT_EXPIRES_AT: new Date(targetExpiryDate).toISOString(),
        CERT_CODE: certCode,
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
  background: var(--surface-card);
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
  color: var(--primary);
  text-decoration: underline;
  font-weight: 500;
}

.inactive-side {
  color: var(--text-secondary);
  font-weight: 400;
}

.certificate-card-preview {
  width: 100%;
  height: 375px;
  border: 1px solid #000000;
  border-radius: 12px;
  background-color: #ffffff;
  overflow: hidden;
  position: relative;
  font-family: 'Outfit', 'Sarabun', 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
}

.cert-header {
  height: 60px;
  padding: 12px 20px;
  background-color: #ffffff;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  box-sizing: border-box;
}

.cert-logo {
  height: 36px;
  object-fit: contain;
}

.cert-main-title {
  font-size: 13px;
  line-height: 1.2;
  color: var(--primary, #0d47a1);
}

.cert-sub-title {
  font-size: 11px;
  line-height: 1.2;
  color: var(--neutral-600, #334155);
}

.cert-body {
  position: relative;
  padding: 16px 20px;
  background: #f4f7fa;
}

.watermark-bg {
  position: absolute;
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 120px;
  line-height: 100%;
  color: rgba(30, 137, 229, 0.05);
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
  background-color: #cbd5e1;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #94a3b8;
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
}

.detail-grid-column {
  padding-left: 12px !important;
}

.detail-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-group {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 11px;
  color: #475569;
  font-weight: 500;
  margin-bottom: 0px;
  line-height: 1.2;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary, #0d47a1);
  line-height: 1.3;
}

.score-section {
  width: 100%;
}

.score-header {
  font-size: 12px;
  color: #1e293b;
  padding-bottom: 2px;
  text-decoration: underline;
  font-weight: 600;
}

.score-row {
  font-size: 11px;
  color: #334155;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.score-val {
  font-weight: bold;
}

.score-separator {
  background-color: #94a3b8 !important;
  height: 1px;
  margin: 4px 0;
  opacity: 0.5;
}

.score-row-level {
  font-size: 11px;
  color: #334155;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.score-level-val {
  display: flex;
  gap: 24px;
}

.cert-footer {
  height: 64px;
  padding: 12px 20px;
  background-color: #ffffff;
  border-top: 1px solid var(--border-color, #e2e8f0);
  box-sizing: border-box;
}

.metadata-group {
  display: flex;
  gap: 24px;
}

.metadata-label {
  font-size: 10px;
  color: #475569;
  font-weight: 500;
  line-height: 1.2;
}

.metadata-value {
  font-size: 12px;
  color: var(--primary, #0d47a1);
  font-weight: 600;
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
  width: 140px !important;
  height: 44px !important;
  border-radius: 10px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
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

.confirm-btn {
  width: 190px !important;
}

.valid-until-input {
  :deep(.q-field__control) {
    border-radius: 8px;
  }
}
</style>
