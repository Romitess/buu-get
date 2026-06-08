<template>
  <q-card flat bordered class="q-mb-xl exam-card buu-premium-card">
    <q-card-section>
      <!-- Header Section -->
      <div class="row items-center q-mb-md">
        <q-icon name="assignment" size="20px" class="q-mr-sm text-dark" />
        <div class="text-subtitle1 text-weight-bold text-dark">ข้อมูลพื้นฐาน</div>
      </div>

      <!-- Form Grid -->
      <div class="row q-col-gutter-lg">
        <!-- Row 1: ประเภทการสอบ | รูปแบบการสอบ -->
        <div class="col-12 col-md-6" data-field="examType">
          <div class="buu-label-muted q-mb-xs">ประเภทการสอบ</div>
          <q-select
            v-model="form.examType"
            :options="examTypeOptions"
            outlined
            dense
            bg-color="white"
            dropdown-icon="keyboard_arrow_down"
            class="buu-input-muted"
            :class="{ 'buu-field-error': hasError('examType') }"
            :disable="isLocked"
            @update:model-value="emit('clearFieldError', 'examType')"
          />
          <div v-if="hasError('examType')" :key="`examType-${shakeKey}`" class="buu-error-msg">
            <q-icon name="error" class="buu-error-icon" />
            {{ fieldErrors?.examType }}
          </div>
        </div>
        <div class="col-12 col-md-6" data-field="examFormat">
          <div class="buu-label-muted q-mb-xs">รูปแบบการสอบ</div>
          <q-select
            v-model="form.examFormat"
            :options="examFormatOptions"
            outlined
            dense
            bg-color="white"
            dropdown-icon="keyboard_arrow_down"
            class="buu-input-muted"
            :class="{ 'buu-field-error': hasError('examFormat') }"
            :disable="isLocked"
            @update:model-value="emit('clearFieldError', 'examFormat')"
          />
          <div v-if="hasError('examFormat')" :key="`examFormat-${shakeKey}`" class="buu-error-msg">
            <q-icon name="error" class="buu-error-icon" />
            {{ fieldErrors?.examFormat }}
          </div>
        </div>

        <!-- Row 2: ชื่อการสอบ | รหัสผังแหล่งเงิน (เฉพาะรอบทั่วไป) -->
        <div class="col-12 col-md-6" data-field="examName">
          <div class="buu-label-muted q-mb-xs">ชื่อการสอบ</div>
          <q-input
            v-model="form.examName"
            placeholder="เช่น การสอบวัดระดับภาษาอังกฤษ BUU-GET"
            outlined
            dense
            bg-color="white"
            class="buu-input-muted"
            :class="{ 'buu-field-error': hasError('examName') }"
            :disable="isLocked"
            @update:model-value="emit('clearFieldError', 'examName')"
          />
          <div v-if="hasError('examName')" :key="`examName-${shakeKey}`" class="buu-error-msg">
            <q-icon name="error" class="buu-error-icon" />
            {{ fieldErrors?.examName }}
          </div>
        </div>
        <div v-if="!isSpecialRound" class="col-12 col-md-6" data-field="fundSourceId">
          <div class="buu-label-muted q-mb-xs">รหัสผังแหล่งเงิน</div>
          <q-select
            v-model="form.fundSourceId"
            :options="fundSourceOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            outlined
            dense
            bg-color="white"
            :loading="isLoadingData"
            placeholder="ผังแหล่งเงิน"
            dropdown-icon="keyboard_arrow_down"
            class="buu-input-muted"
            :class="{ 'buu-field-error': hasError('fundSourceId') }"
            :disable="isLocked"
            @update:model-value="emit('clearFieldError', 'fundSourceId')"
          />
          <div
            v-if="hasError('fundSourceId')"
            :key="`fundSourceId-${shakeKey}`"
            class="buu-error-msg"
          >
            <q-icon name="error" class="buu-error-icon" />
            {{ fieldErrors?.fundSourceId }}
          </div>
        </div>

        <!-- Row 3: ค่าธรรมเนียม (เฉพาะรอบทั่วไป) | สถานะเผยแพร่ -->
        <div v-if="!isSpecialRound" class="col-12 col-md-6">
          <div class="buu-label-muted q-mb-xs">ค่าธรรมเนียม</div>
          <q-input
            v-model="form.fee"
            type="number"
            suffix="THB"
            outlined
            dense
            bg-color="white"
            class="buu-input-muted"
            :disable="isLocked"
          />
        </div>

        <div class="col-12 col-md-6 self-end">
          <q-field outlined bg-color="white" class="buu-field-large buu-input-muted">
            <template v-slot:control>
              <div class="full-width row items-center justify-between no-wrap">
                <span class="text-body2 text-grey-7">สถานะเผยแพร่</span>
                <q-toggle
                  v-model="form.isPublished"
                  color="primary"
                  class="buu-toggle-muted"
                  :disable="isLocked"
                >
                  <q-tooltip v-if="isLocked" class="bg-amber-9 text-body2">
                    ไม่สามารถปิดสถานะเผยแพร่ได้เนื่องจากมีการเผยแพร่ไปแล้ว
                  </q-tooltip>
                </q-toggle>
              </div>
            </template>
          </q-field>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { CreateExamForm } from 'src/composables/use-create-exam';

/**
 * Props for CreateExamDetailsCard.
 */
const props = defineProps<{
  /** Exam type options (General, Special). */
  examTypeOptions: string[];
  /** Exam format options (Computer, Paper). */
  examFormatOptions: string[];
  /** Fund source options from the API. */
  fundSourceOptions: { label: string; value: number }[];
  /** Loading state for fund source data. */
  isLoadingData: boolean;
  /** Whether the entire details card should be locked (e.g. once published) */
  isLocked?: boolean;
  /** Whether the current exam type is special (hides fee/fund fields) */
  isSpecialRound: boolean;
  /** Field-level validation errors */
  fieldErrors?: Record<string, string>;
  /** Key to re-trigger shake animation */
  shakeKey?: number;
}>();

const emit = defineEmits<{
  (e: 'clearFieldError', fieldName: string): void;
}>();

/**
 * Model for the exam form state.
 */
const form = defineModel<CreateExamForm>('form', { required: true });

/** Check if a field has an error */
const hasError = (field: string): boolean => {
  return !!(props.fieldErrors && props.fieldErrors[field]);
};
</script>

<style scoped>
.exam-card {
  border-radius: 8px;
}
</style>
