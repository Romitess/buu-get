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
        <!-- Left Column -->
        <div class="col-12 col-md-6 row q-col-gutter-y-md content-start">
          <!-- ประเภทการสอบ -->
          <div class="col-12" data-field="examType">
            <div class="buu-label-muted q-mb-xs">ประเภทการสอบ</div>
            <app-select
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

          <!-- ชื่อการสอบ & รอบการสอบ ในแถวเดียวกัน (กว้างเท่ากัน, รวมกัน = ความกว้างของ field ค่าธรรมเนียมด้านล่าง) -->
          <div class="col-12 row no-wrap exam-name-round-row">
            <div class="col" data-field="examName">
              <div class="buu-label-muted q-mb-xs">ชื่อการสอบ</div>
              <q-input
                v-model="form.examName"
                placeholder="BUU-GET"
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
            <div class="col" data-field="examRound">
              <div class="buu-label-muted q-mb-xs">รอบการสอบ</div>
              <q-input
                v-model="form.examRound"
                placeholder="1/2026"
                outlined
                dense
                bg-color="white"
                class="buu-input-muted"
                :class="{ 'buu-field-error': hasError('examRound') }"
                :disable="isLocked"
                @update:model-value="emit('clearFieldError', 'examRound')"
              />
              <div
                v-if="hasError('examRound')"
                :key="`examRound-${shakeKey}`"
                class="buu-error-msg"
              >
                <q-icon name="error" class="buu-error-icon" />
                {{ fieldErrors?.examRound }}
              </div>
            </div>
          </div>

          <!-- ค่าธรรมเนียม (เฉพาะรอบทั่วไป) -->
          <div v-if="!isSpecialRound" class="col-12" data-field="fee">
            <div class="buu-label-muted q-mb-xs">ค่าธรรมเนียม</div>
            <q-input
              :model-value="form.fee"
              placeholder="0.00"
              inputmode="decimal"
              suffix="THB"
              outlined
              dense
              bg-color="white"
              class="buu-input-muted"
              :disable="isLocked"
              @keypress="onFeeKeypress"
              @update:model-value="onFeeInput"
              @blur="handleFeeBlur"
            />
          </div>
        </div>

        <!-- Right Column -->
        <div class="col-12 col-md-6 row q-col-gutter-y-md content-start">
          <!-- รูปแบบการสอบ -->
          <div class="col-12" data-field="examFormat">
            <div class="buu-label-muted q-mb-xs">รูปแบบการสอบ</div>
            <app-select
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
            <div
              v-if="hasError('examFormat')"
              :key="`examFormat-${shakeKey}`"
              class="buu-error-msg"
            >
              <q-icon name="error" class="buu-error-icon" />
              {{ fieldErrors?.examFormat }}
            </div>
          </div>

          <!-- รหัสผังแหล่งเงิน (เฉพาะรอบทั่วไป) -->
          <div v-if="!isSpecialRound" class="col-12" data-field="fundSourceId">
            <div class="buu-label-muted q-mb-xs">รหัสผังแหล่งเงิน</div>
            <app-select
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

          <!-- สถานะเผยแพร่ -->
          <div class="col-12 self-end">
            <q-field outlined bg-color="white" class="buu-field-large buu-input-muted">
              <template v-slot:control>
                <div class="full-width row items-center justify-between no-wrap">
                  <span class="buu-label-muted">สถานะเผยแพร่</span>
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
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { CreateExamForm } from 'src/composables/use-create-exam';
import AppSelect from 'src/components/base/app-select.vue';

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

/**
 * Sanitize the fee input: allow only digits and a single decimal point.
 * Blocks negative values, the minus sign, the letter "e", and any other characters.
 */
const onFeeInput = (val: string | number | null): void => {
  let sanitized = String(val ?? '').replace(/[^\d.]/g, '');
  const firstDot = sanitized.indexOf('.');
  if (firstDot !== -1) {
    sanitized =
      sanitized.slice(0, firstDot + 1) + sanitized.slice(firstDot + 1).replace(/\./g, '');
  }
  form.value.fee = sanitized;
};

/**
 * Block typing any character that is not a digit or a decimal point,
 * and prevent a second decimal point. Letters/symbols never appear in the field.
 */
const onFeeKeypress = (e: KeyboardEvent): void => {
  if (!/[0-9.]/.test(e.key)) {
    e.preventDefault();
    return;
  }
  if (e.key === '.' && String(form.value.fee ?? '').includes('.')) {
    e.preventDefault();
  }
};
</script>

<style scoped>
.exam-card {
  border-radius: 8px;
}
/* ระยะห่างระหว่าง ชื่อการสอบ และ รอบการสอบ โดยขอบซ้าย-ขวาตรงกับ field ด้านบน/ล่าง */
.exam-name-round-row {
  column-gap: 16px;
}
</style>
