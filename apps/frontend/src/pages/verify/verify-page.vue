<template>
  <q-page class="verify-page q-pb-xl">
    <div class="container q-pt-lg">
      <div class="verify-hero q-mb-lg">
        <h1 class="verify-title">{{ t('verify.title') }}</h1>
        <p class="verify-subtitle">{{ t('verify.subtitle') }}</p>
      </div>

      <q-card flat bordered class="verify-form-card q-pa-lg q-mb-xl">
        <div class="text-h6 q-mb-md">{{ t('verify.manualTitle') }}</div>

        <q-form @submit.prevent="handleSubmit">
          <q-select
            v-model="documentType"
            :options="documentTypeOptions"
            :label="t('verify.documentType')"
            emit-value
            map-options
            outlined
            dense
            class="q-mb-md"
          />

          <q-input
            v-model="verificationCode"
            :label="t('verify.verificationCode')"
            :hint="t('verify.verificationCodeHint')"
            outlined
            dense
            class="q-mb-lg"
            autocomplete="off"
          />

          <q-btn
            type="submit"
            color="primary"
            :label="t('verify.submit')"
            :disable="!verificationCode.trim()"
            unelevated
            no-caps
          />
        </q-form>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type { VerifyDocumentType } from 'src/types/verify';

const { t } = useI18n();
const router = useRouter();

const documentType = ref<VerifyDocumentType>('certificate');
const verificationCode = ref('');

const documentTypeOptions = computed(() => [
  { label: t('verify.typeCertificate'), value: 'certificate' as const },
  { label: t('verify.typeReceipt'), value: 'receipt' as const },
]);

const handleSubmit = (): void => {
  const code = verificationCode.value.trim();
  if (!code) return;

  void router.push({
    name: documentType.value === 'certificate' ? 'verify-certificate' : 'verify-receipt',
    params: { code },
  });
};
</script>

<style scoped lang="scss">
.verify-page {
  background: linear-gradient(180deg, #f0f6fc 0%, #ffffff 240px);
  min-height: 100%;
}

.verify-hero {
  text-align: center;
}

.verify-title {
  margin: 0 0 8px;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 700;
  color: #104a8e;
}

.verify-subtitle {
  margin: 0;
  color: #475569;
  font-size: 1rem;
}

.verify-form-card {
  max-width: 560px;
  margin: 0 auto;
  border-radius: 12px;
}
</style>
