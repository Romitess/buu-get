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
          <div
            class="verify-status-badge"
            :class="statusBadgeClass(certificateData.status)"
          >
            <q-icon :name="statusIcon(certificateData.status)" size="20px" />
            <span>{{ statusLabel(certificateData.status) }}</span>
          </div>
        </div>

        <q-card flat bordered class="verify-detail-card q-pa-lg">
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
            <div class="detail-item">
              <span class="field-label">{{ t('verify.certificate.vocabGrammar') }}</span>
              <span class="field-value">{{ certificateData.scores.vocabGrammar }}/50</span>
            </div>
            <div class="detail-item">
              <span class="field-label">{{ t('verify.certificate.reading') }}</span>
              <span class="field-value">{{ certificateData.scores.reading }}/50</span>
            </div>
            <div class="detail-item">
              <span class="field-label">{{ t('verify.certificate.total') }}</span>
              <span class="field-value">{{ certificateData.scores.total }}/100</span>
            </div>
            <div class="detail-item">
              <span class="field-label">{{ t('verify.certificate.band') }}</span>
              <span class="field-value">{{ certificateData.scores.bandLevel }}</span>
            </div>
          </div>
        </q-card>
      </template>

      <template v-else-if="receiptData">
        <div class="verify-status-wrap q-mb-md">
          <div
            class="verify-status-badge"
            :class="statusBadgeClass(receiptData.status)"
          >
            <q-icon :name="statusIcon(receiptData.status)" size="20px" />
            <span>{{ statusLabel(receiptData.status) }}</span>
          </div>
        </div>

        <q-card flat bordered class="verify-detail-card q-pa-lg">
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
              <span class="field-value">{{
                formatExamDate(receiptData.payment.examDate)
              }}</span>
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
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { AxiosError } from 'axios';
import { verifyCertificate, verifyReceipt } from 'src/services/verify.service';
import type {
  CertificateVerifyStatus,
  ReceiptVerifyStatus,
  VerifyCertificateResponse,
  VerifyDocumentType,
  VerifyReceiptResponse,
} from 'src/types/verify';

const props = defineProps<{
  documentType: VerifyDocumentType;
}>();

const { t } = useI18n();
const route = useRoute();

const isLoading = ref(true);
const isNotFound = ref(false);
const certificateData = ref<VerifyCertificateResponse | null>(null);
const receiptData = ref<VerifyReceiptResponse | null>(null);

const code = computed(() => String(route.params.code ?? '').trim());

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

  try {
    if (props.documentType === 'certificate') {
      certificateData.value = await verifyCertificate(code.value);
    } else {
      receiptData.value = await verifyReceipt(code.value);
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

.verify-state-card,
.verify-detail-card {
  max-width: 760px;
  margin: 0 auto;
  border-radius: 12px;
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
