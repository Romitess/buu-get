<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="dialog-cancel-card">
      <q-card-section class="column items-center q-pt-xl q-pb-lg">
        <div class="icon-container-wrapper">
          <q-avatar class="icon-container">
            <q-icon name="calendar_today" size="28px" />
          </q-avatar>
        </div>

        <div class="text-title q-mt-md">{{ title || t('examSchedule.dialogCancel.title') }}</div>
        <div class="text-subtitle q-mt-sm">
          {{ subtitle || t('examSchedule.dialogCancel.subtitle') }}
        </div>
      </q-card-section>

      <q-card-section class="q-px-xl q-pb-lg">
        <q-list class="info-box q-pa-none">
          <q-item class="info-row q-pa-none" dense style="min-height: unset">
            <q-item-section class="q-pa-none">
              <div class="row justify-between items-end q-pb-xs">
                <div class="row items-center label-text">
                  <q-icon name="event" size="18px" class="q-mr-sm" />
                  <span>{{ t('examSchedule.dialogCancel.date') }}</span>
                </div>
                <div class="value-text">{{ examDate }}</div>
              </div>
              <div class="underline"></div>
            </q-item-section>
          </q-item>

          <q-item class="info-row q-mt-md q-pa-none" dense style="min-height: unset">
            <q-item-section class="q-pa-none">
              <div class="row justify-between items-end q-pb-xs">
                <div class="row items-center label-text">
                  <q-icon name="schedule" size="18px" class="q-mr-sm" />
                  <span>{{ t('examSchedule.dialogCancel.time') }}</span>
                </div>
                <div class="value-text">{{ examTime }}</div>
              </div>
              <div class="underline"></div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions class="row q-px-xl q-pb-xl q-col-gutter-md">
        <div class="col-6">
          <AppButton
            outline
            :label="cancelBtnText || t('examSchedule.dialogCancel.cancel')"
            class="full-width dialog-btn"
            @click="$emit('update:modelValue', false)"
          />
        </div>
        <div class="col-6">
          <AppButton
            :label="confirmBtnText || t('examSchedule.dialogCancel.confirm')"
            class="full-width dialog-btn"
            @click="$emit('confirm')"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppButton from 'src/components/base/app-button.vue';
import type { DialogCancelProps } from 'src/types/exam';

defineProps<DialogCancelProps>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
}>();

const { t } = useI18n();
</script>

<style scoped lang="scss">
.dialog-cancel-card {
  width: 100%;
  max-width: 460px;
  border-radius: 24px;
  box-shadow: var(--dialog-shadow);
  overflow: visible;
}

.icon-container-wrapper {
  filter: drop-shadow(var(--dialog-icon-shadow));
}

.icon-container {
  width: 72px;
  height: 72px;
  background: var(--dialog-icon-gradient);
  color: var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--surface-card);
}

.text-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.text-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.5;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.info-box {
  border: 1px solid var(--dialog-info-border);
  border-radius: 16px;
  padding: 20px 24px;
  background-color: var(--surface-card);
}

.info-row {
  .label-text {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text-secondary);
  }
  .value-text {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-primary);
  }
  .underline {
    height: 1px;
    background-color: var(--primary);
    opacity: 0.5;
    width: 100%;
    margin-top: 4px;
  }
}

.dialog-btn {
  height: 48px;
}

@media (max-width: 600px) {
  .dialog-cancel-card {
    border-radius: 16px;
    width: 95vw;
  }

  .q-card__section.q-px-xl {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  .q-card__actions.q-px-xl {
    padding-left: 12px !important;
    padding-right: 12px !important;
    padding-bottom: 24px !important;
  }

  .text-title {
    font-size: 1.1rem;
  }

  .text-subtitle {
    font-size: 11px;
    white-space: nowrap;
    letter-spacing: -0.02em;
    padding: 0;
  }

  .info-box {
    padding: 12px;
  }

  .info-row {
    .label-text {
      font-size: 0.8rem;
    }
    .value-text {
      font-size: 0.9rem;
    }
  }

  .dialog-btn {
    height: 40px;
    font-size: 0.85rem;
  }
}
</style>
