<template>
  <q-card flat class="q-pa-lg buu-card">
    <div class="row items-center q-mb-md section-header">
      <q-icon name="calendar_today" size="20px" class="q-mr-xs" color="dark" />
      <div class="section-title">กำหนดการสอบ</div>
    </div>

    <div class="row q-col-gutter-x-lg">
      <!-- Left side: ช่วงเวลาการจัดสอบ -->
      <div class="col-12 col-md-5">
        <div class="schedule-box">
          <div class="schedule-box-title q-mb-sm">
            <span class="bullet-dot">•</span> ช่วงเวลาการจัดสอบ
          </div>

          <div class="field-label-bold">วันที่สอบ</div>
          <q-input
            v-model="form.examDate"
            outlined
            dense
            class="custom-input q-mb-md bg-white"
            readonly
            hide-bottom-space
          >
            <template v-slot:append>
              <q-icon name="calendar_today" class="cursor-pointer" size="xs" color="grey-8">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="form.examDate" mask="DD/MM/YYYY">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="ปิด" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <div class="field-label-bold">เวลาสอบ</div>
          <div class="time-slots-container q-pr-sm">
            <div
              v-for="(slot, index) in form.timeSlots"
              :key="index"
              class="row items-center q-mb-sm q-col-gutter-sm"
            >
              <div class="col">
                <q-input
                  v-model="slot.startTime"
                  outlined
                  dense
                  class="custom-input bg-white"
                  placeholder="00 : 00"
                  hide-bottom-space
                />
              </div>
              <div class="col-auto time-separator">ถึง</div>
              <div class="col">
                <q-input
                  v-model="slot.endTime"
                  outlined
                  dense
                  class="custom-input bg-white"
                  placeholder="00 : 00"
                  hide-bottom-space
                />
              </div>
              <div class="col-auto">
                <q-icon
                  name="delete"
                  class="cursor-pointer"
                  size="sm"
                  color="grey-8"
                  @click="$emit('remove-time-slot', index)"
                />
              </div>
            </div>
          </div>

          <!-- Add Session Button -->
          <div class="row justify-end q-mt-sm">
            <q-btn
              label="เพิ่มรอบเวลาสอบ"
              color="primary"
              unelevated
              dense
              class="q-px-md"
              style="border-radius: 8px; font-size: 13px"
              :disabled="form.timeSlots.length >= 4"
              @click="$emit('add-time-slot')"
            />
          </div>
        </div>
      </div>

      <!-- Right side: ช่วงเวลาลงทะเบียน & ชำระเงิน -->
      <div class="col-12 col-md-7">
        <!-- ช่วงเวลาการลงทะเบียน -->
        <div class="right-section-title q-mb-xs">ช่วงเวลาการลงทะเบียน</div>
        <div class="row q-col-gutter-x-lg q-col-gutter-y-sm q-mb-md">
          <div class="col-6">
            <div class="field-label-bold">วันที่เริ่มต้น</div>
            <q-input
              v-model="form.regStartDate"
              outlined
              dense
              class="custom-input"
              readonly
              hide-bottom-space
            >
              <template v-slot:append>
                <q-icon name="calendar_today" class="cursor-pointer" size="xs" color="grey-8">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.regStartDate" mask="DD/MM/YYYY">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="ปิด" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-6">
            <div class="field-label-bold">วันที่สิ้นสุด</div>
            <q-input
              v-model="form.regEndDate"
              outlined
              dense
              class="custom-input"
              readonly
              hide-bottom-space
            >
              <template v-slot:append>
                <q-icon name="calendar_today" class="cursor-pointer" size="xs" color="grey-8">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.regEndDate" mask="DD/MM/YYYY">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="ปิด" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>

        <!-- ช่วงเวลาการชำระค่าธรรมเนียม -->
        <div class="right-section-title q-mb-xs">ช่วงเวลาการชำระค่าธรรมเนียม</div>
        <div class="row q-col-gutter-x-lg q-col-gutter-y-sm">
          <div class="col-6">
            <div class="field-label-bold">วันที่เริ่มต้น</div>
            <q-input
              v-model="form.payStartDate"
              outlined
              dense
              class="custom-input"
              readonly
              hide-bottom-space
            >
              <template v-slot:append>
                <q-icon name="calendar_today" class="cursor-pointer" size="xs" color="grey-8">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.payStartDate" mask="DD/MM/YYYY">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="ปิด" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-6">
            <div class="field-label-bold">วันที่สิ้นสุด</div>
            <q-input
              v-model="form.payEndDate"
              outlined
              dense
              class="custom-input"
              readonly
              hide-bottom-space
            >
              <template v-slot:append>
                <q-icon name="calendar_today" class="cursor-pointer" size="xs" color="grey-8">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.payEndDate" mask="DD/MM/YYYY">
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="ปิด" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import type { CreateExamForm } from 'src/composables/use-create-exam';

const form = defineModel<CreateExamForm>('form', { required: true });

defineEmits(['add-time-slot', 'remove-time-slot']);
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
.field-label-bold {
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: 4px;
}
.right-section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.schedule-box {
  background-color: #f3f3f3;
  padding: 16px;
  border-radius: var(--radius-sm);
  height: 320px;
  display: flex;
  flex-direction: column;
}
.schedule-box-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}
.bullet-dot {
  font-size: 24px;
  line-height: 0;
  margin-right: 8px;
}
.time-separator {
  font-size: 13px;
  font-weight: 500;
  color: var(--neutral-500);
  padding: 0 4px;
}
.time-slots-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}
.time-slots-container::-webkit-scrollbar {
  width: 6px;
}
.time-slots-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 10px;
}
.time-slots-container::-webkit-scrollbar-thumb {
  background: #bbb;
  border-radius: 10px;
}
.time-slots-container::-webkit-scrollbar-thumb:hover {
  background: var(--neutral-500);
}
.custom-input :deep(.q-field__control) {
  border-radius: var(--radius-sm);
  background-color: var(--surface-card);
}
.custom-input :deep(.q-field__control::before) {
  border-color: var(--neutral-200);
}
</style>
