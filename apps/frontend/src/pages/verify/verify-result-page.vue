<template>
  <q-page class="verify-result-page q-pb-xl">
    <div class="container q-pt-lg">
      <div class="verify-hero q-mb-lg">
        <h1 class="verify-title">
          {{
            documentType === 'certificate'
              ? t('verify.certificate.title')
              : t('verify.receipt.title')
          }}
        </h1>
        <p class="verify-subtitle">{{ t('verify.subtitle') }}</p>
      </div>

      <div v-if="isLoading" class="verify-state-card">
        <q-spinner color="primary" size="40px" />
        <div class="q-mt-md text-body1">{{ t('verify.loading') }}</div>
      </div>

      <div v-else-if="isNotFound" class="verify-state-card verify-state-card--error">
        <q-icon name="error_outline" size="48px" color="negative" />
        <div class="text-h6 q-mt-md">{{ t('verify.notFoundTitle') }}</div>
        <p class="text-body2 text-grey-7 q-mb-none">{{ t('verify.notFoundMessage') }}</p>
        <q-btn
          flat
          color="primary"
          :label="t('verify.manualTitle')"
          class="q-mt-md"
          no-caps
          to="/verify"
        />
      </div>

      <template v-else-if="certificateData">
        <div class="verify-status-wrap q-mb-md">
          <div class="verify-status-badge" :class="statusBadgeClass(certificateData.status)">
            <q-icon :name="statusIcon(certificateData.status)" size="20px" />
            <span>{{ statusLabel(certificateData.status) }}</span>
          </div>
        </div>

        <div class="verify-content-layout">
          <q-card
            flat
            bordered
            class="verify-document-card q-pa-md verify-content-layout__document"
          >
            <div class="verify-document-header q-mb-md">
              <div class="text-subtitle1 text-weight-bold">
                {{ t('verify.documentPreview') }}
              </div>
              <div class="verify-side-toggle">
                <button
                  type="button"
                  class="verify-side-toggle__btn"
                  :class="{ 'verify-side-toggle__btn--active': certificateSide === 'front' }"
                  @click="certificateSide = 'front'"
                >
                  {{ t('verify.certificateFront') }}
                </button>
                <span class="verify-side-toggle__sep">|</span>
                <button
                  type="button"
                  class="verify-side-toggle__btn"
                  :class="{ 'verify-side-toggle__btn--active': certificateSide === 'back' }"
                  @click="certificateSide = 'back'"
                >
                  {{ t('verify.certificateBack') }}
                </button>
              </div>
            </div>

            <CertificateCard
              :side="certificateSide"
              :fullname="certificateData.holder.fullName"
              :test-taker-id="certificateData.holder.testTakerId"
              :national-id="certificateData.holder.nationalIdMasked || '-'"
              :test-session="certificateData.exam.round || '-'"
              :test-date="formatEnglishDate(certificateData.exam.date)"
              :vocab-score="certificateCardVocabScore"
              :reading-score="certificateCardReadingScore"
              :score-lines="certificateCardScoreLines"
              :total-score="`${certificateData.scores.total}/${certificateScoreTotalMax}`"
              :band-level="String(certificateData.scores.bandLevel)"
              :issue-date="formatEnglishDate(certificateData.issuedAt)"
              :valid-until="formatEnglishDate(certificateData.expiresAt)"
              :certificate-code="certificateData.verificationCode"
              :qr-data-url="certificateQrDataUrl"
              :band-rules="bandRules"
            />
          </q-card>

          <q-card flat bordered class="verify-detail-card q-pa-lg verify-content-layout__details">
            <div class="verify-code-row q-mb-md">
              <span class="field-label">{{ t('verify.verificationCode') }}</span>
              <span class="field-value mono">{{ certificateData.verificationCode }}</span>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <span class="field-label">{{ t('verify.certificate.holder') }}</span>
                <span class="field-value">{{ certificateData.holder.fullName }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.certificate.testTakerId') }}</span>
                <span class="field-value">{{ certificateData.holder.testTakerId }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.certificate.citizenId') }}</span>
                <span class="field-value">{{
                  certificateData.holder.nationalIdMasked || '-'
                }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.certificate.testSession') }}</span>
                <span class="field-value">{{ certificateData.exam.round || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.certificate.testDate') }}</span>
                <span class="field-value">{{ formatExamDate(certificateData.exam.date) }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.certificate.issuedAt') }}</span>
                <span class="field-value">{{ formatDateTime(certificateData.issuedAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.certificate.expiresAt') }}</span>
                <span class="field-value">{{ formatDateTime(certificateData.expiresAt) }}</span>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="text-subtitle1 text-weight-bold q-mb-sm">
              {{ t('verify.certificate.scores') }}
            </div>
            <div class="detail-grid">
              <template v-if="certificateData.scores.lines?.length">
                <div
                  v-for="line in certificateData.scores.lines"
                  :key="`${line.nameEn}-${line.sortOrder}`"
                  class="detail-item"
                >
                  <span class="field-label">{{ line.nameTh }}</span>
                  <span class="field-value">{{ line.score }}/{{ line.maxScore }}</span>
                </div>
              </template>
              <template v-else>
                <div class="detail-item">
                  <span class="field-label">{{ t('verify.certificate.vocabGrammar') }}</span>
                  <span class="field-value">{{ certificateData.scores.vocabGrammar }}/50</span>
                </div>
                <div class="detail-item">
                  <span class="field-label">{{ t('verify.certificate.reading') }}</span>
                  <span class="field-value">{{ certificateData.scores.reading }}/50</span>
                </div>
              </template>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.certificate.total') }}</span>
                <span class="field-value"
                  >{{ certificateData.scores.total }}/{{ certificateScoreTotalMax }}</span
                >
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.certificate.band') }}</span>
                <span class="field-value">{{ certificateData.scores.bandLevel }}</span>
              </div>
            </div>
          </q-card>
        </div>
      </template>

      <template v-else-if="receiptData">
        <div class="verify-status-wrap q-mb-md">
          <div class="verify-status-badge" :class="statusBadgeClass(receiptData.status)">
            <q-icon :name="statusIcon(receiptData.status)" size="20px" />
            <span>{{ statusLabel(receiptData.status) }}</span>
          </div>
        </div>

        <div class="verify-content-layout">
          <q-card
            v-if="receiptCardData"
            flat
            bordered
            class="verify-document-card q-pa-md verify-content-layout__document"
          >
            <div class="text-subtitle1 text-weight-bold q-mb-md">
              {{ t('verify.documentPreview') }}
            </div>
            <div class="verify-receipt-preview">
              <ReceiptCard :receipt="receiptCardData" />
            </div>
          </q-card>

          <q-card flat bordered class="verify-detail-card q-pa-lg verify-content-layout__details">
            <div class="verify-code-row q-mb-md">
              <span class="field-label">{{ t('verify.verificationCode') }}</span>
              <span class="field-value mono">{{ receiptData.verificationCode }}</span>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <span class="field-label">{{ t('verify.receipt.receiptNo') }}</span>
                <span class="field-value">{{ receiptData.receiptNo }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.receipt.paidAt') }}</span>
                <span class="field-value">{{ formatDateTime(receiptData.issuedOrPaidAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.receipt.payee') }}</span>
                <span class="field-value">{{ receiptData.payee.name || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.receipt.taxId') }}</span>
                <span class="field-value">{{ receiptData.payee.taxIdMasked || '-' }}</span>
              </div>
              <div v-if="receiptData.status === 'valid'" class="detail-item detail-item--full">
                <span class="field-label">{{ t('verify.receipt.address') }}</span>
                <span class="field-value">{{ receiptData.payee.address || '-' }}</span>
              </div>
              <div v-if="receiptData.status === 'valid'" class="detail-item">
                <span class="field-label">{{ t('verify.receipt.amount') }}</span>
                <span class="field-value">{{ formatCurrency(receiptData.payment.amount) }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.receipt.description') }}</span>
                <span class="field-value">{{ receiptData.payment.description }}</span>
              </div>
              <div v-if="receiptData.payment.paymentMethod" class="detail-item">
                <span class="field-label">{{ t('verify.receipt.paymentMethod') }}</span>
                <span class="field-value">{{ receiptData.payment.paymentMethod }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.receipt.examRound') }}</span>
                <span class="field-value">{{ receiptData.payment.examRound || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="field-label">{{ t('verify.receipt.examDate') }}</span>
                <span class="field-value">{{ formatExamDate(receiptData.payment.examDate) }}</span>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="detail-item detail-item--full">
              <span class="field-label">{{ t('verify.receipt.organization') }}</span>
              <span class="field-value">
                {{ receiptData.organization.nameTH }} / {{ receiptData.organization.nameEN }}<br />
                {{ t('exam.card.taxIdLabel') }} {{ receiptData.organization.taxId }}
              </span>
            </div>
          </q-card>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { AxiosError } from 'axios';
import CertificateCard from 'src/components/exam/certificate-card.vue';
import ReceiptCard from 'src/components/receipt-card.vue';
import { getBandRules } from 'src/services/score-criteria.service';
import { verifyCertificate, verifyReceipt } from 'src/services/verify.service';
import type { CertificateBandRule } from 'src/types/certificate';
import type { ReceiptData } from 'src/types/receipt';
import type {
  CertificateVerifyStatus,
  ReceiptVerifyStatus,
  VerifyCertificateResponse,
  VerifyDocumentType,
  VerifyReceiptResponse,
} from 'src/types/verify';
import { generateCertificateQrDataUrl, generateReceiptQrDataUrl } from 'src/utils/verify-qr';

const props = defineProps<{
  documentType: VerifyDocumentType;
}>();

const { t } = useI18n();
const route = useRoute();

const isLoading = ref(true);
const isNotFound = ref(false);
const certificateData = ref<VerifyCertificateResponse | null>(null);
const receiptData = ref<VerifyReceiptResponse | null>(null);
const bandRules = ref<CertificateBandRule[]>([]);
const certificateQrDataUrl = ref<string | null>(null);
const receiptQrDataUrl = ref<string | null>(null);
const certificateSide = ref<'front' | 'back'>('front');

const certificateScoreTotalMax = computed(() => {
  const lines = certificateData.value?.scores.lines;
  if (lines?.length) return lines.reduce((sum, line) => sum + line.maxScore, 0);
  return 100;
});

const certificateCardVocabScore = computed(() => {
  const lines = certificateData.value?.scores.lines;
  if (lines?.length) {
    const line = lines.find((item) => item.nameEn.toLowerCase().includes('vocabulary')) ?? lines[0];
    return `${line?.score ?? 0}/${line?.maxScore ?? 50}`;
  }
  return `${certificateData.value?.scores.vocabGrammar ?? 0}/50`;
});

const certificateCardReadingScore = computed(() => {
  const lines = certificateData.value?.scores.lines;
  if (lines?.length) {
    const line =
      lines.find((item) => item.nameEn.toLowerCase().includes('reading')) ?? lines[1] ?? lines[0];
    return `${line?.score ?? 0}/${line?.maxScore ?? 50}`;
  }
  return `${certificateData.value?.scores.reading ?? 0}/50`;
});

const certificateCardScoreLines = computed(() => certificateData.value?.scores.lines ?? []);

const code = computed(() => String(route.params.code ?? '').trim());

const receiptCardData = computed<ReceiptData | null>(() => {
  if (!receiptData.value) return null;

  const data = receiptData.value;
  const card: ReceiptData = {
    receiptNo: data.receiptNo,
    transactionDate: data.issuedOrPaidAt ?? '',
    fullName: data.payee.name ?? '-',
    nationalId: data.payee.taxIdMasked ?? '-',
    examName: data.payment.description,
    examDate: data.payment.examDate ?? '',
    location: data.payment.examRound ?? '-',
    amount: data.payment.amount ?? 0,
    paymentMethod: data.payment.paymentMethod ?? '-',
    status: data.status === 'voided' ? 'FAILED' : 'SUCCESS',
    verifyCode: data.verificationCode,
  };

  if (data.payee.address) {
    card.address = data.payee.address;
  }

  if (receiptQrDataUrl.value) {
    card.qrDataUrl = receiptQrDataUrl.value;
  }

  return card;
});

const loadDocument = async (): Promise<void> => {
  if (!code.value) {
    isNotFound.value = true;
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  isNotFound.value = false;
  certificateData.value = null;
  receiptData.value = null;
  bandRules.value = [];
  certificateQrDataUrl.value = null;
  receiptQrDataUrl.value = null;
  certificateSide.value = 'front';

  try {
    if (props.documentType === 'certificate') {
      const [result, bandRulesResponse, qrDataUrl] = await Promise.all([
        verifyCertificate(code.value),
        getBandRules(),
        generateCertificateQrDataUrl(code.value),
      ]);
      certificateData.value = result;
      bandRules.value = bandRulesResponse.bandRules;
      certificateQrDataUrl.value = qrDataUrl;
    } else {
      const [result, qrDataUrl] = await Promise.all([
        verifyReceipt(code.value),
        generateReceiptQrDataUrl(code.value),
      ]);
      receiptData.value = result;
      receiptQrDataUrl.value = qrDataUrl;
    }
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      isNotFound.value = true;
    } else {
      console.error(error);
      isNotFound.value = true;
    }
  } finally {
    isLoading.value = false;
  }
};

const statusLabel = (status: CertificateVerifyStatus | ReceiptVerifyStatus): string => {
  return t(`verify.status.${status}`);
};

const statusBadgeClass = (status: CertificateVerifyStatus | ReceiptVerifyStatus): string => {
  if (status === 'valid') return 'verify-status-badge--valid';
  if (status === 'expired' || status === 'voided') return 'verify-status-badge--warning';
  return 'verify-status-badge--neutral';
};

const statusIcon = (status: CertificateVerifyStatus | ReceiptVerifyStatus): string => {
  if (status === 'valid') return 'check_circle';
  if (status === 'expired' || status === 'voided') return 'info';
  return 'help_outline';
};

const formatDateTime = (value: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatExamDate = (value: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatEnglishDate = (value: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatCurrency = (amount: number | null): string => {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

onMounted(() => {
  void loadDocument();
});

watch(code, () => {
  void loadDocument();
});
</script>

<style scoped lang="scss">
.verify-result-page {
  background: linear-gradient(180deg, #f0f6fc 0%, #ffffff 240px);
  min-height: 100%;
}

.verify-hero {
  text-align: center;
}

.verify-title {
  margin: 0 0 8px;
  font-size: clamp(1.35rem, 3vw, 1.85rem);
  font-weight: 700;
  color: #104a8e;
}

.verify-subtitle {
  margin: 0;
  color: #475569;
}

.verify-status-wrap {
  display: flex;
  justify-content: center;
}

.verify-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: fit-content;
  max-width: 100%;
  padding: 10px 20px;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.25;
  box-shadow: 0 1px 4px rgb(15 23 42 / 8%);

  &--valid {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }

  &--warning {
    background: #ffedd5;
    color: #9a3412;
    border: 1px solid #fed7aa;
  }

  &--neutral {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
}

.verify-state-card {
  max-width: 760px;
  margin: 0 auto;
  border-radius: 12px;
}

.verify-content-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1140px;
  margin: 0 auto;

  @media (min-width: 1024px) {
    flex-direction: row;
    align-items: flex-start;
    gap: 24px;
  }

  &__document,
  &__details {
    width: 100%;
    min-width: 0;
    border-radius: 12px;
  }

  @media (min-width: 1024px) {
    &__document {
      flex: 0 0 46%;
      position: sticky;
      top: 88px;
    }

    &__details {
      flex: 1 1 54%;
    }
  }
}

.verify-detail-card,
.verify-document-card {
  max-width: 760px;
  margin: 0 auto;
  border-radius: 12px;

  .verify-content-layout & {
    max-width: none;
    margin: 0;
  }
}

.verify-document-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.verify-side-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.verify-side-toggle__btn {
  border: none;
  background: transparent;
  padding: 0;
  color: #64748b;
  cursor: pointer;
  font: inherit;

  &--active {
    color: #104a8e;
    font-weight: 700;
    text-decoration: underline;
  }
}

.verify-side-toggle__sep {
  color: #cbd5e1;
}

.verify-receipt-preview {
  overflow-x: auto;
  display: flex;
  justify-content: center;

  :deep(.receipt-container) {
    width: min(210mm, 100%);
    min-height: auto;
    margin: 0;
    box-shadow: none;
    border: 1px solid #e2e8f0;
  }

  @media (min-width: 1024px) {
    max-height: calc(100vh - 180px);
    overflow-y: auto;
    justify-content: flex-start;

    :deep(.receipt-container) {
      width: 100%;
      padding: 10mm;
      font-size: 10px;
    }
  }
}

.verify-state-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
  background: #fff;
  border: 1px solid #e2e8f0;
}

.verify-code-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  &--full {
    grid-column: 1 / -1;
  }
}

.field-label {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 600;
}

.field-value {
  font-size: 1rem;
  color: #0f172a;
  font-weight: 600;
  word-break: break-word;

  &.mono {
    font-family: 'Roboto Mono', monospace;
    letter-spacing: 0.02em;
  }
}
</style>
