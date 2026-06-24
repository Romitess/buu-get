<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="view-voucher-dialog-card">
      <header class="dialog-header">
        <h2>{{ $t('admin.seatCandidates.viewVoucherTitle') }}</h2>
        <q-btn
          flat
          round
          dense
          icon="close"
          color="grey-6"
          aria-label="ปิด"
          @click="onCancelClick"
        />
      </header>

      <section class="exam-details">
        <div class="details-title">
          <q-icon name="description" size="23px" />
          <span>{{ $t('admin.seatCandidates.examDetails') }}</span>
        </div>
        <div class="details-grid">
          <div class="detail-item">
            <q-icon name="calendar_today" />
            <span>{{ voucherData.examDate }}</span>
          </div>
          <div class="detail-item">
            <q-icon name="location_city" />
            <span>{{ locationLabel }}</span>
          </div>
          <div class="detail-item">
            <q-icon name="schedule" />
            <span>{{ voucherData.examTime }}</span>
          </div>
          <div class="detail-item">
            <q-icon name="groups" />
            <span>{{ candidateCount }} {{ $t('admin.seatCandidates.peopleSuffix') }}</span>
          </div>
        </div>
      </section>

      <AppVoucherPreview :voucher-data="voucherData" />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import AppVoucherPreview from 'src/components/exam/app-voucher-preview.vue';
import type { VoucherData } from 'src/types/voucher';

const props = defineProps<{
  voucherData: VoucherData;
  candidateCount: number;
}>();

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const onCancelClick = (): void => onDialogCancel();
const locationLabel = computed(() =>
  [props.voucherData.location, props.voucherData.locationRoom].filter(Boolean).join(' '),
);
</script>

<style scoped lang="scss">
.view-voucher-dialog-card {
  width: min(800px, calc(100vw - 32px));
  max-width: 800px;
  max-height: calc(100vh - 32px);
  padding: 28px 40px 36px;
  border-radius: 10px;
  overflow-y: auto;
  background: var(--surface-card);
}

.dialog-header,
.details-title,
.detail-item {
  display: flex;
  align-items: center;
}

.dialog-header {
  justify-content: space-between;
  margin-bottom: 24px;

  h2 {
    margin: 0;
    font-size: 22px;
    font-weight: 600;
  }
}

.exam-details {
  border: 1px solid #dddddd;
  border-radius: 14px;
  overflow: hidden;
}

.details-title {
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid #dddddd;
  font-weight: 700;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 24px;
  padding: 14px 24px;
}

.detail-item {
  gap: 10px;
  min-width: 0;
}

@media (max-width: $breakpoint-xs-max) {
  .view-voucher-dialog-card {
    padding: 20px;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
