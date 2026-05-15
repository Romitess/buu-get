<template>
  <q-card class="q-mb-md exam-card buu-premium-card">
    <q-card-section>
      <!-- Header Section -->
      <div class="row items-center q-mb-md">
        <q-icon name="assignment" size="20px" class="q-mr-sm text-grey-8" />
        <div class="text-subtitle1 text-weight-bold text-grey-9">รายละเอียดการสอบ</div>
      </div>

      <!-- Form Grid -->
      <div class="row q-col-gutter-md">
        <!-- Row 1: Exam Name (6) | Location (6) -->
        <div class="col-12 col-md-6">
          <div class="buu-label-muted q-mb-xs">ชื่อการสอบ</div>
          <q-input
            v-model="form.examName"
            placeholder="เช่น การสอบวัดระดับภาษาอังกฤษ BUU-GET"
            outlined
            dense
            bg-color="white"
            dropdown-icon="keyboard_arrow_down"
            class="buu-input-muted"
            :disable="isLocked"
          />
        </div>
        <div class="col-12 col-md-6">
          <div class="buu-label-muted q-mb-xs">สถานที่สอบ</div>
          <q-select
            v-model="form.locationId"
            :options="locationOptions"
            option-label="label"
            option-value="value"
            emit-value
            map-options
            outlined
            dense
            bg-color="white"
            placeholder="เลือกสถานที่สอบ"
            dropdown-icon="keyboard_arrow_down"
            class="buu-input-muted"
            :disable="isLocked"
          />
        </div>

        <!-- Row 2: Exam Type (6) | Fund Source (6) -->
        <div class="col-12 col-md-6">
          <div class="buu-label-muted q-mb-xs">ประเภทการสอบ</div>
          <q-select
            v-model="form.examType"
            :options="examTypeOptions"
            outlined
            dense
            bg-color="white"
            dropdown-icon="keyboard_arrow_down"
            class="buu-input-muted"
            :disable="isLocked"
          />
        </div>
        <div class="col-12 col-md-6">
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
            placeholder="เลือกแหล่งเงิน"
            class="buu-input-muted"
            :disable="isLocked"
          />
        </div>

        <!-- Row 3: Left (Fee & Seats) | Right (Large Status Box) -->
        <div class="col-12 col-md-6">
          <div class="row q-col-gutter-md">
            <div class="col-6">
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
            <div class="col-6">
              <div class="buu-label-muted q-mb-xs">จำนวนที่นั่ง</div>
              <q-input
                v-model.number="form.seats"
                type="number"
                outlined
                dense
                bg-color="white"
                class="buu-input-muted"
                placeholder="0"
                :disable="isLocked"
              />
            </div>
          </div>
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
import type { ExamLocationOption } from 'src/services/exam.service';

/**
 * Interface for the Fund Source Option.
 */
interface FundSourceOption {
  label: string;
  value: number;
}

/**
 * Props for CreateExamDetailsCard.
 */
defineProps<{
  /** Location options from the API. */
  locationOptions: ExamLocationOption[];
  /** Exam type options (General, Special). */
  examTypeOptions: string[];
  /** Fund source options from the API. */
  fundSourceOptions: FundSourceOption[];
  /** Loading state for fund source data. */
  isLoadingData: boolean;
  /** Whether the entire details card should be locked (e.g. once published) */
  isLocked?: boolean;
}>();

/**
 * Model for the exam form state.
 */
const form = defineModel<CreateExamForm>('form', { required: true });
</script>

<style scoped>
.exam-card {
  border-radius: 12px;
  background-color: #ffffff;
  border: 1px solid #eef0f2;
}
</style>
