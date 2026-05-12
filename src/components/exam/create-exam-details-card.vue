<template>
  <q-card flat class="q-pa-lg q-mb-md buu-card">
    <div class="row items-center q-mb-md section-header">
      <q-icon name="article" size="20px" class="q-mr-xs" color="dark" />
      <div class="section-title">รายละเอียดการสอบ</div>
    </div>

    <div class="row q-col-gutter-x-lg q-col-gutter-y-sm">
      <!-- Row 1: ชื่อการสอบ (50%) | สถานที่สอบ (50%) -->
      <div class="col-12 col-md-6">
        <div class="field-label">ชื่อการสอบ</div>
        <q-input
          v-model="form.examName"
          outlined
          dense
          placeholder="การสอบวัดระบบภาษาอังกฤษ BUU-GET"
          class="custom-input"
          hide-bottom-space
        />
      </div>
      <div class="col-12 col-md-6">
        <div class="field-label">สถานที่สอบ</div>
        <q-select
          v-model="form.locationId"
          :options="locationOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          outlined
          dense
          placeholder="เลือกสถานที่สอบ"
          class="custom-input"
          :loading="isLoadingData"
          hide-bottom-space
        />
      </div>

      <!-- Row 2: ประเภทการสอบ (50%) | รหัสผังแหล่งเงิน (50%) -->
      <div class="col-12 col-md-6">
        <div class="field-label">ประเภทการสอบ</div>
        <q-select
          v-model="form.examType"
          :options="examTypeOptions"
          outlined
          dense
          class="custom-input"
          hide-bottom-space
        />
      </div>
      <div class="col-12 col-md-6">
        <div class="field-label">รหัสผังแหล่งเงิน</div>
        <q-select
          v-model="form.fundSourceId"
          :options="fundSourceOptions"
          option-label="label"
          option-value="value"
          emit-value
          map-options
          outlined
          dense
          placeholder="เลือกแหล่งเงิน"
          class="custom-input"
          :loading="isLoadingData"
          hide-bottom-space
        />
      </div>

      <!-- Row 3: ค่าธรรมเนียม (25%) | จำนวนที่นั่ง (25%) | สถานะเผยแพร่ (50%) -->
      <div class="col-12 col-md-3">
        <div class="field-label">ค่าธรรมเนียม</div>
        <q-input
          v-model="form.fee"
          outlined
          dense
          placeholder="0.00"
          class="custom-input"
          hide-bottom-space
        >
          <template v-slot:append>
            <div class="row items-center text-grey-7" style="font-size: 13px">
              THB
              <q-icon name="unfold_more" size="xs" />
            </div>
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-3">
        <div class="field-label">จำนวนที่นั่ง</div>
        <q-input
          v-model.number="form.seats"
          type="number"
          outlined
          dense
          class="custom-input"
          hide-bottom-space
        >
          <template v-slot:append>
            <div class="column justify-center cursor-pointer">
              <q-icon
                name="arrow_drop_up"
                size="xs"
                style="margin-bottom: -8px"
                @click="form.seats++"
              />
              <q-icon
                name="arrow_drop_down"
                size="xs"
                @click="form.seats > 0 ? form.seats-- : null"
              />
            </div>
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-6">
        <!-- Invisible label to align vertically -->
        <div class="field-label select-none" style="visibility: hidden">&nbsp;</div>
        <q-field outlined dense class="custom-input bg-white" hide-bottom-space>
          <template v-slot:control>
            <div class="full-width row items-center justify-between" style="height: 100%">
              <div style="font-size: 13px; font-weight: 600; color: var(--neutral-700)">
                สถานะเผยแพร่
              </div>
              <q-toggle v-model="form.isPublished" color="primary" />
            </div>
          </template>
        </q-field>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { type PropType } from 'vue';
import type { ExamLocationOption } from 'src/services/exam.service';
import type { CreateExamForm } from 'src/composables/use-create-exam';

const form = defineModel<CreateExamForm>('form', { required: true });

defineProps({
  locationOptions: {
    type: Array as PropType<ExamLocationOption[]>,
    default: () => [],
  },
  examTypeOptions: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  fundSourceOptions: {
    type: Array as PropType<{ label: string; value: number }[]>,
    default: () => [],
  },
  isLoadingData: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.section-header {
  gap: 2px;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: 6px;
}
.custom-input :deep(.q-field__control) {
  border-radius: var(--radius-sm);
  background-color: var(--surface-card);
}
.custom-input :deep(.q-field__control::before) {
  border-color: var(--neutral-200);
}
.custom-input :deep(input::placeholder) {
  color: var(--neutral-400);
}
.select-none {
  user-select: none;
}
</style>
