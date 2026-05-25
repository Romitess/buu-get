<template>
  <q-card flat bordered class="buu-premium-card q-mb-md">
    <q-card-section>
      <div class="row items-center q-mb-md">
        <q-icon name="schedule" size="20px" class="q-mr-sm text-grey-8" />
        <div class="text-subtitle1 text-weight-bold text-grey-9">
          {{ isSpecialRound ? 'กำหนดการลงทะเบียน' : 'กำหนดการลงทะเบียนและชำระเงิน' }}
        </div>
      </div>

      <div class="row q-col-gutter-xl">
        <!-- Left: ช่วงเวลาลงทะเบียน -->
        <div class="col-12" :class="isSpecialRound ? '' : 'col-md-6'">
          <div class="sub-section-title q-mb-sm">ช่วงเวลาลงทะเบียน</div>

          <div class="row q-col-gutter-md">
            <div class="col-12" :class="isSpecialRound ? 'col-md-6' : 'q-mb-md'">
              <div class="field-label">วันที่เริ่มต้น</div>
              <q-input
                v-model="form.regStartDate"
                outlined
                dense
                class="custom-input"
                readonly
                hide-bottom-space
                :disable="locked"
              >
                <template v-slot:append>
                  <q-icon
                    v-if="!locked"
                    name="calendar_today"
                    class="cursor-pointer"
                    size="xs"
                    color="grey-8"
                  >
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

            <div class="col-12" :class="isSpecialRound ? 'col-md-6' : ''">
              <div class="field-label">วันที่สิ้นสุด</div>
              <q-input
                v-model="form.regEndDate"
                outlined
                dense
                class="custom-input"
                readonly
                hide-bottom-space
                :disable="locked"
              >
                <template v-slot:append>
                  <q-icon
                    v-if="!locked"
                    name="calendar_today"
                    class="cursor-pointer"
                    size="xs"
                    color="grey-8"
                  >
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
        </div>

        <!-- Right: ช่วงเวลาชำระเงิน (ซ่อนถ้ารอบพิเศษ) -->
        <div v-if="!isSpecialRound" class="col-12 col-md-6">
          <div class="sub-section-title q-mb-sm">ช่วงเวลาชำระเงิน</div>

          <div class="row q-col-gutter-md">
            <div class="col-12 q-mb-md">
              <div class="field-label">วันที่เริ่มต้น</div>
              <q-input
                v-model="form.payStartDate"
                outlined
                dense
                class="custom-input"
                readonly
                hide-bottom-space
                :disable="locked"
              >
                <template v-slot:append>
                  <q-icon
                    v-if="!locked"
                    name="calendar_today"
                    class="cursor-pointer"
                    size="xs"
                    color="grey-8"
                  >
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

            <div class="col-12">
              <div class="field-label">วันที่สิ้นสุด</div>
              <q-input
                v-model="form.payEndDate"
                outlined
                dense
                class="custom-input"
                readonly
                hide-bottom-space
                :disable="locked"
              >
                <template v-slot:append>
                  <q-icon
                    v-if="!locked"
                    name="calendar_today"
                    class="cursor-pointer"
                    size="xs"
                    color="grey-8"
                  >
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
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import type { CreateExamForm } from 'src/composables/use-create-exam';

defineProps<{
  /** When true, disables all editing */
  locked?: boolean;
  /** When true, hides payment section */
  isSpecialRound?: boolean;
}>();

const form = defineModel<CreateExamForm>('form', { required: true });
</script>

<style scoped>
.sub-section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--label-color, #444);
  margin-bottom: 4px;
}
.custom-input :deep(.q-field__control) {
  border-radius: var(--radius-sm);
  background-color: var(--surface-card);
}
.custom-input :deep(.q-field__control::before) {
  border-color: var(--neutral-200);
}
</style>
