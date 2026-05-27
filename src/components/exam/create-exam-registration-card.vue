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
                class="custom-input cursor-pointer"
                readonly
                hide-bottom-space
                :disable="locked"
                @click="!locked && (showRegStart = true)"
              >
                <template v-slot:append>
                  <q-icon
                    v-if="!locked"
                    name="calendar_today"
                    class="cursor-pointer"
                    size="xs"
                    color="grey-8"
                    @click.stop="showRegStart = true"
                  />
                  <q-menu
                    v-model="showRegStart"
                    anchor="bottom left"
                    self="top left"
                    class="shadow-5 calendar-menu"
                  >
                    <AppCalendar
                      :model-value="beToCeString(form.regStartDate)"
                      @update:model-value="(val: string) => (form.regStartDate = ceToBeString(val))"
                      @click-date="showRegStart = false"
                    />
                  </q-menu>
                </template>
              </q-input>
              <div
                v-if="dateErrors?.regStartDate"
                class="text-caption text-negative q-mt-xs row items-center no-wrap"
              >
                <q-icon name="error" size="14px" class="q-mr-xs animate-bounce" />
                {{ dateErrors.regStartDate }}
              </div>
            </div>

            <div class="col-12" :class="isSpecialRound ? 'col-md-6' : ''">
              <div class="field-label">วันที่สิ้นสุด</div>
              <q-input
                v-model="form.regEndDate"
                outlined
                dense
                class="custom-input cursor-pointer"
                readonly
                hide-bottom-space
                :disable="locked"
                @click="!locked && (showRegEnd = true)"
              >
                <template v-slot:append>
                  <q-icon
                    v-if="!locked"
                    name="calendar_today"
                    class="cursor-pointer"
                    size="xs"
                    color="grey-8"
                    @click.stop="showRegEnd = true"
                  />
                  <q-menu
                    v-model="showRegEnd"
                    anchor="bottom left"
                    self="top left"
                    class="shadow-5 calendar-menu"
                  >
                    <AppCalendar
                      :model-value="beToCeString(form.regEndDate)"
                      @update:model-value="(val: string) => (form.regEndDate = ceToBeString(val))"
                      @click-date="showRegEnd = false"
                    />
                  </q-menu>
                </template>
              </q-input>
              <div
                v-if="dateErrors?.regEndDate"
                class="text-caption text-negative q-mt-xs row items-center no-wrap"
              >
                <q-icon name="error" size="14px" class="q-mr-xs" />
                {{ dateErrors.regEndDate }}
              </div>
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
                class="custom-input cursor-pointer"
                readonly
                hide-bottom-space
                :disable="locked"
                @click="!locked && (showPayStart = true)"
              >
                <template v-slot:append>
                  <q-icon
                    v-if="!locked"
                    name="calendar_today"
                    class="cursor-pointer"
                    size="xs"
                    color="grey-8"
                    @click.stop="showPayStart = true"
                  />
                  <q-menu
                    v-model="showPayStart"
                    anchor="bottom left"
                    self="top left"
                    class="shadow-5 calendar-menu"
                  >
                    <AppCalendar
                      :model-value="beToCeString(form.payStartDate)"
                      @update:model-value="(val: string) => (form.payStartDate = ceToBeString(val))"
                      @click-date="showPayStart = false"
                    />
                  </q-menu>
                </template>
              </q-input>
              <div
                v-if="dateErrors?.payStartDate"
                class="text-caption text-negative q-mt-xs row items-center no-wrap"
              >
                <q-icon name="error" size="14px" class="q-mr-xs" />
                {{ dateErrors.payStartDate }}
              </div>
            </div>

            <div class="col-12">
              <div class="field-label">วันที่สิ้นสุด</div>
              <q-input
                v-model="form.payEndDate"
                outlined
                dense
                class="custom-input cursor-pointer"
                readonly
                hide-bottom-space
                :disable="locked"
                @click="!locked && (showPayEnd = true)"
              >
                <template v-slot:append>
                  <q-icon
                    v-if="!locked"
                    name="calendar_today"
                    class="cursor-pointer"
                    size="xs"
                    color="grey-8"
                    @click.stop="showPayEnd = true"
                  />
                  <q-menu
                    v-model="showPayEnd"
                    anchor="bottom left"
                    self="top left"
                    class="shadow-5 calendar-menu"
                  >
                    <AppCalendar
                      :model-value="beToCeString(form.payEndDate)"
                      @update:model-value="(val: string) => (form.payEndDate = ceToBeString(val))"
                      @click-date="showPayEnd = false"
                    />
                  </q-menu>
                </template>
              </q-input>
              <div
                v-if="dateErrors?.payEndDate"
                class="text-caption text-negative q-mt-xs row items-center no-wrap"
              >
                <q-icon name="error" size="14px" class="q-mr-xs" />
                {{ dateErrors.payEndDate }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { CreateExamForm } from 'src/composables/use-create-exam';
import AppCalendar from 'src/components/shared/app-calendar.vue';
import { beToCeString, ceToBeString } from 'src/utils/thai-date';

defineProps<{
  /** When true, disables all editing */
  locked?: boolean;
  /** When true, hides payment section */
  isSpecialRound?: boolean;
  /** Date validation errors */
  dateErrors?: Record<string, string>;
}>();

const form = defineModel<CreateExamForm>('form', { required: true });

const showRegStart = ref(false);
const showRegEnd = ref(false);
const showPayStart = ref(false);
const showPayEnd = ref(false);
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
.calendar-menu {
  border-radius: var(--radius-lg);
  overflow: hidden;
}
</style>
