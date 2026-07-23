<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="onUpdateModelValue"
  >
    <q-card class="tour-offer-card">
      <q-btn
        icon="close"
        flat
        round
        dense
        class="absolute-top-right q-ma-md close-btn"
        aria-label="Close"
        @click="onDecline"
      />

      <q-card-section class="column items-center text-center q-pt-lg q-pb-none">
        <div class="tour-offer-icon q-mb-md" aria-hidden="true">
          <q-icon name="question_mark" size="32px" color="primary" />
        </div>
        <div class="tour-offer-title text-weight-bold">{{ title }}</div>
      </q-card-section>

      <q-card-section class="text-center q-px-lg">
        <div class="tour-offer-body">{{ message }}</div>
      </q-card-section>

      <q-card-actions align="center" class="q-pb-lg q-px-md row q-gutter-md justify-center no-wrap">
        <AppButton :label="declineLabel" class="dialog-btn decline-btn" @click="onDecline" />
        <AppButton
          :label="acceptLabel"
          color="primary"
          class="dialog-btn accept-btn"
          @click="onAccept"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import AppButton from 'src/components/base/app-button.vue';

defineProps<{
  modelValue: boolean;
  title: string;
  message: string;
  acceptLabel: string;
  declineLabel: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'accept'): void;
  (e: 'decline'): void;
}>();

const onUpdateModelValue = (value: boolean): void => {
  emit('update:modelValue', value);
};

const onAccept = (): void => {
  emit('update:modelValue', false);
  emit('accept');
};

const onDecline = (): void => {
  emit('update:modelValue', false);
  emit('decline');
};
</script>

<style scoped lang="scss">
.tour-offer-card {
  position: relative;
  width: 480px;
  max-width: 90vw;
  border-radius: 16px !important;
  padding: 8px 8px 4px;
  background-color: #ffffff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08) !important;
}

.tour-offer-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: rgba(25, 118, 210, 0.08);
}

.tour-offer-title {
  font-size: 1.25rem;
  line-height: 1.4;
  color: #1d1d1d;
  max-width: 360px;
}

.tour-offer-body {
  font-size: 1rem;
  line-height: 1.55;
  color: #4a4a4a;
  max-width: 380px;
  margin: 0 auto;
}

.close-btn {
  z-index: 10;
  color: #9e9e9e;

  &:hover {
    color: #616161;
  }
}

.dialog-btn {
  min-width: 140px !important;
  height: 44px !important;
  border-radius: 10px !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  text-transform: none;
}

.decline-btn {
  background-color: #e8e8e8 !important;
  color: #2c2c2c !important;
  box-shadow: none !important;

  &:hover {
    background-color: #d8d8d8 !important;
  }
}

.accept-btn {
  box-shadow: none !important;
}
</style>
