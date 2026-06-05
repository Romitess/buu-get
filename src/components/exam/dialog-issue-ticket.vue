<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card class="issue-ticket-dialog-card q-pa-none">
      <!-- Header Area -->
      <div class="bg-primary text-white q-pa-md row items-center no-wrap dialog-header">
        <q-avatar class="q-mr-md header-avatar" size="48px">
          <q-icon name="fact_check" size="28px" color="white" />
        </q-avatar>
        <div class="column">
          <div class="dialog-title">
            {{ $t('admin.seatCandidates.issueTicketDialog.title') }}
          </div>
          <div class="dialog-subtitle">
            {{ $t('admin.seatCandidates.issueTicketDialog.subtitle') }}
          </div>
        </div>
      </div>

      <q-card-section class="q-pt-lg q-px-lg q-pb-md">
        <!-- Warning Alert -->
        <div class="warning-alert row items-center no-wrap q-pa-md q-mb-lg">
          <q-icon
            name="error_outline"
            color="secondary"
            size="24px"
            class="q-mr-md flex-shrink-0"
          />
          <div class="text-primary alert-text">
            {{ $t('admin.seatCandidates.issueTicketDialog.warningAlert') }}
          </div>
        </div>

        <!-- Exam Data Section -->
        <div class="exam-data-container">
          <div class="exam-data-header q-px-md q-py-sm">
            <span class="text-weight-medium">
              {{ $t('admin.seatCandidates.issueTicketDialog.examInfoTitle') }}
            </span>
          </div>
          <div class="exam-data-content q-px-md q-py-xs">
            <!-- Row 1 -->
            <div class="row justify-between items-center q-py-sm data-row">
              <span class="row-label">{{
                $t('admin.seatCandidates.issueTicketDialog.roundName')
              }}</span>
              <span class="row-value">{{ sessionDetails.roundName || '-' }}</span>
            </div>
            <!-- Row 2 -->
            <div class="row justify-between items-center q-py-sm data-row">
              <span class="row-label">{{ $t('admin.seatCandidates.issueTicketDialog.date') }}</span>
              <span class="row-value">{{ sessionDetails.date || '-' }}</span>
            </div>
            <!-- Row 3 -->
            <div class="row justify-between items-center q-py-sm data-row">
              <span class="row-label">{{ $t('admin.seatCandidates.issueTicketDialog.time') }}</span>
              <span class="row-value">{{ sessionDetails.time || '-' }}</span>
            </div>
            <!-- Row 4 -->
            <div class="row justify-between items-center q-py-sm data-row">
              <span class="row-label">{{ $t('admin.seatCandidates.issueTicketDialog.room') }}</span>
              <span class="row-value">{{ sessionDetails.room || '-' }}</span>
            </div>
            <!-- Row 5 -->
            <div class="row justify-between items-center q-py-sm data-row no-border">
              <span class="row-label">{{
                $t('admin.seatCandidates.issueTicketDialog.studentCount')
              }}</span>
              <span class="row-value">
                {{ sessionDetails.studentCount || '0' }}
                {{ $t('admin.seatCandidates.issueTicketDialog.studentCountSuffix') }}
              </span>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions class="q-px-lg q-pb-lg q-pt-sm row no-wrap action-container">
        <AppButton
          :label="$t('admin.seatCandidates.issueTicketDialog.cancel')"
          color="grey-2"
          text-color="black"
          class="action-btn"
          @click="onCancelClick"
        />
        <AppButton
          :label="$t('admin.seatCandidates.issueTicketDialog.confirm')"
          color="primary"
          class="action-btn"
          @click="onOKClick"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import type { PropType } from 'vue';
import AppButton from 'src/components/base/app-button.vue';

defineProps({
  sessionDetails: {
    type: Object as PropType<{
      roundName?: string;
      date?: string;
      time?: string;
      room?: string;
      studentCount?: string | number;
    }>,
    default: () => ({}),
  },
});

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

function onOKClick() {
  onDialogOK();
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style lang="scss" scoped>
.issue-ticket-dialog-card {
  width: 100%;
  max-width: 440px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--surface-card);
  font-family: var(--font-family-base);
}

.dialog-header {
  border-top-left-radius: var(--radius-md);
  border-top-right-radius: var(--radius-md);

  .dialog-title {
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .dialog-subtitle {
    font-size: 0.85rem;
    opacity: 0.85;
    line-height: 1.4;
  }
}

.header-avatar {
  background-color: rgba(255, 255, 255, 0.2);
}

.warning-alert {
  background-color: #eef4fc; // Light blue background
  border-radius: var(--radius-sm);
  position: relative;
  overflow: hidden;
  align-items: flex-start;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background-color: var(--primary-light);
  }

  .alert-text {
    font-size: 13px;
    font-weight: 400;
    line-height: 1.4;
  }
}

.exam-data-container {
  border: none;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.exam-data-header {
  background-color: var(--primary);
  color: var(--text-on-primary);

  span {
    font-size: 15px;
    font-weight: 500;
  }
}

.data-row {
  border-bottom: 1px solid var(--neutral-200);
  min-height: 44px;

  &.no-border {
    border-bottom: none;
  }

  .row-label {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 400;
    line-height: 100%;
  }

  .row-value {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 500;
    line-height: 100%;
    text-align: right;
  }
}

.action-container {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.action-btn {
  border-radius: 8px;
  padding: 12px 16px !important;
  min-height: 44px !important;
  font-family: var(--font-family-base);
  font-size: 14px;
  font-weight: 500 !important;
  line-height: 100%;
  text-align: center;
  vertical-align: middle;
  flex: 1;
  box-shadow: none !important;
}

.flex-shrink-0 {
  flex-shrink: 0;
}
</style>
