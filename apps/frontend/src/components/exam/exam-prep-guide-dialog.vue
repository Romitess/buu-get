<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="onUpdateModelValue"
  >
    <q-card class="prep-guide-card relative-position q-pa-lg">
      <q-btn
        icon="close"
        flat
        round
        dense
        class="absolute-top-right q-ma-md text-grey-5 close-btn"
        :aria-label="$t('exam.prepGuide.done')"
        @click="close"
      />

      <div class="prep-guide-header column items-center text-center q-mb-md">
        <div class="prep-guide-title text-weight-bold">{{ $t('exam.prepGuide.title') }}</div>
        <div v-if="examTitle" class="prep-guide-exam-title q-mt-xs">{{ examTitle }}</div>
        <div class="prep-guide-step-label q-mt-xs">
          {{ $t('exam.prepGuide.stepLabel', { current: currentStep, total: TOTAL_STEPS }) }}
        </div>
      </div>

      <div
        class="step-progress row items-center justify-center q-gutter-x-sm q-mb-lg"
        aria-hidden="true"
      >
        <span
          v-for="step in TOTAL_STEPS"
          :key="step"
          class="step-dot"
          :class="{
            'step-dot--active': step === currentStep,
            'step-dot--done': step < currentStep,
          }"
        />
      </div>

      <div class="step-body relative-position">
        <transition :name="transitionName" mode="out-in">
          <ExamPrepStepPrint
            v-if="currentStep === 1"
            :key="1"
            :is-printing="isPrinting"
            @print="$emit('print')"
          />
          <ExamPrepStepDress v-else-if="currentStep === 2" :key="2" />
          <ExamPrepStepItems v-else :key="3" />
        </transition>
      </div>

      <q-card-actions class="row justify-center q-col-gutter-md q-px-none q-pt-lg q-pb-none">
        <div v-if="currentStep > 1" class="col-6 col-sm-3">
          <AppButton
            flat
            :label="$t('exam.prepGuide.back')"
            class="full-width back-btn text-weight-bold"
            @click="goBack"
          />
        </div>
        <div class="col-6 col-sm-3">
          <AppButton
            :label="
              currentStep === TOTAL_STEPS ? $t('exam.prepGuide.done') : $t('exam.prepGuide.next')
            "
            class="full-width next-btn text-weight-bold"
            @click="goNext"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppButton from 'src/components/base/app-button.vue';
import ExamPrepStepPrint from 'src/components/exam/exam-prep-step-print.vue';
import ExamPrepStepDress from 'src/components/exam/exam-prep-step-dress.vue';
import ExamPrepStepItems from 'src/components/exam/exam-prep-step-items.vue';
import type { ExamHistoryItem } from 'src/types/exam';

const TOTAL_STEPS = 3;

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    exam: ExamHistoryItem | null;
    isPrinting?: boolean;
  }>(),
  {
    isPrinting: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'print'): void;
  (e: 'finish'): void;
}>();

const currentStep = ref(1);
const transitionName = ref('prep-slide-left');

const examTitle = computed(() => props.exam?.title ?? '');

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      currentStep.value = 1;
      transitionName.value = 'prep-slide-left';
    }
  },
);

const onUpdateModelValue = (value: boolean): void => {
  emit('update:modelValue', value);
};

const close = (): void => {
  emit('update:modelValue', false);
};

const goBack = (): void => {
  if (currentStep.value <= 1) {
    return;
  }
  transitionName.value = 'prep-slide-right';
  currentStep.value -= 1;
};

const goNext = (): void => {
  if (currentStep.value >= TOTAL_STEPS) {
    emit('finish');
    emit('update:modelValue', false);
    return;
  }
  transitionName.value = 'prep-slide-left';
  currentStep.value += 1;
};
</script>

<style scoped lang="scss">
.prep-guide-card {
  width: 100%;
  max-width: 560px;
  border-radius: 16px;
}

.prep-guide-title {
  font-size: var(--font-size-h3, 1.25rem);
  color: var(--text-primary);
  padding-right: var(--space-lg);
}

.prep-guide-exam-title {
  max-width: 90%;
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-primary);
  line-height: 1.4;
}

.prep-guide-step-label {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-muted, #6b7280);
}

.step-dot {
  width: calc(var(--space-unit) * 2);
  height: calc(var(--space-unit) * 2);
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary) 20%, transparent);
}

.step-dot--active {
  width: calc(var(--space-unit) * 5);
  border-radius: 999px;
  background: var(--primary);
}

.step-dot--done {
  background: color-mix(in srgb, var(--primary) 55%, transparent);
}

.step-body {
  overflow: hidden;
}

.next-btn {
  background: var(--primary) !important;
  color: white !important;
}

.back-btn {
  color: var(--text-muted, #6b7280);
}

.prep-slide-left-enter-active,
.prep-slide-left-leave-active,
.prep-slide-right-enter-active,
.prep-slide-right-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.prep-slide-left-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.prep-slide-left-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

.prep-slide-right-enter-from {
  opacity: 0;
  transform: translateX(-24px);
}

.prep-slide-right-leave-to {
  opacity: 0;
  transform: translateX(24px);
}
</style>
