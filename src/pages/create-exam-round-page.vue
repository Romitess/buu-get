<template>
  <q-page class="q-px-xl q-pt-md q-pb-sm flex column items-center" style="min-height: 0 !important">
    <div class="form-container full-width" style="max-width: 1100px">
      <!-- Page Title -->
      <div class="page-title q-mb-md">สร้างรอบสอบ</div>

      <!-- Card 1: รายละเอียดการสอบ -->
      <q-card flat class="q-pa-lg q-mb-md buu-card">
        <div class="row items-center q-mb-md section-header">
          <q-icon name="article" size="20px" class="q-mr-xs" color="dark" />
          <div class="section-title">รายละเอียดการสอบ</div>
        </div>

        <div class="row q-col-gutter-md">
          <!-- Row 1: ชื่อการสอบ (50%) | สถานที่สอบ (50%) -->
          <div class="col-12 col-md-6">
            <div class="field-label">ชื่อการสอบ</div>
            <q-input
              v-model="form.examName"
              outlined
              dense
              placeholder="การสอบวัดระบบภาษาอังกฤษ BUU-GET"
              class="custom-input"
            />
          </div>
          <div class="col-12 col-md-6">
            <div class="field-label">สถานที่สอบ</div>
            <q-input
              v-model="form.location"
              outlined
              dense
              placeholder="Computer Center, BUU (L201)"
              class="custom-input"
            />
          </div>

          <!-- Row 2: ประเภทการสอบ (25%) | รหัสผังแหล่งเงิน (25%) | รูปแบบการสอบ (50%) -->
          <div class="col-12 col-md-3">
            <div class="field-label">ประเภทการสอบ</div>
            <q-select
              v-model="form.examType"
              :options="examTypeOptions"
              outlined
              dense
              class="custom-input"
            />
          </div>
          <div class="col-12 col-md-3">
            <div class="field-label">รหัสผังแหล่งเงิน</div>
            <q-input
              v-model="form.fundingCode"
              outlined
              dense
              placeholder="XXXXXXXXXX"
              class="custom-input"
            />
          </div>
          <div class="col-12 col-md-6">
            <div class="field-label">รูปแบบการสอบ</div>
            <q-select
              v-model="form.examFormat"
              :options="examFormatOptions"
              outlined
              dense
              class="custom-input"
            />
          </div>

          <!-- Row 3: ค่าธรรมเนียม (25%) | จำนวนที่นั่ง (25%) | สถานะเผยแพร่ (50%) -->
          <div class="col-12 col-md-3">
            <div class="field-label">ค่าธรรมเนียม</div>
            <q-input v-model="form.fee" outlined dense placeholder="0.00" class="custom-input">
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
            <q-input v-model.number="form.seats" type="number" outlined dense class="custom-input">
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
            <div class="toggle-row">
              <div class="toggle-label">สถานะเผยแพร่</div>
              <q-toggle v-model="form.isPublished" color="primary" dense />
            </div>
          </div>
        </div>
      </q-card>

      <!-- Card 2: กำหนดการสอบ -->
      <q-card flat class="q-pa-lg buu-card">
        <div class="row items-center q-mb-md section-header">
          <q-icon name="calendar_today" size="20px" class="q-mr-xs" color="dark" />
          <div class="section-title">กำหนดการสอบ</div>
        </div>

        <div class="row q-col-gutter-lg">
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
              <div class="row items-center q-mb-sm q-col-gutter-sm">
                <div class="col">
                  <q-input
                    v-model="form.startTime1"
                    outlined
                    dense
                    class="custom-input bg-white"
                    placeholder="08 : 00"
                  />
                </div>
                <div class="col-auto time-separator">ถึง</div>
                <div class="col">
                  <q-input
                    v-model="form.endTime1"
                    outlined
                    dense
                    class="custom-input bg-white"
                    placeholder="10 : 00"
                  />
                </div>
                <div class="col-auto">
                  <q-icon name="delete" class="cursor-pointer" size="sm" color="grey-8" />
                </div>
              </div>

              <div class="row items-center q-col-gutter-sm">
                <div class="col">
                  <q-input
                    v-model="form.startTime2"
                    outlined
                    dense
                    class="custom-input bg-white"
                    placeholder="10 : 00"
                  />
                </div>
                <div class="col-auto time-separator">ถึง</div>
                <div class="col">
                  <q-input
                    v-model="form.endTime2"
                    outlined
                    dense
                    class="custom-input bg-white"
                    placeholder="12 : 00"
                  />
                </div>
                <div class="col-auto">
                  <q-icon name="delete" class="cursor-pointer" size="sm" color="grey-8" />
                </div>
              </div>
            </div>
          </div>

          <!-- Right side: ช่วงเวลาลงทะเบียน & ชำระเงิน -->
          <div class="col-12 col-md-7">
            <!-- ช่วงเวลาการลงทะเบียน -->
            <div class="right-section-title q-mb-xs">ช่วงเวลาการลงทะเบียน</div>
            <div class="row q-col-gutter-sm q-mb-lg">
              <div class="col-6">
                <div class="field-label-bold">วันที่เริ่มต้น</div>
                <q-input v-model="form.regStartDate" outlined dense class="custom-input" readonly>
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
                <q-input v-model="form.regEndDate" outlined dense class="custom-input" readonly>
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
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="field-label-bold">วันที่เริ่มต้น</div>
                <q-input v-model="form.payStartDate" outlined dense class="custom-input" readonly>
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
                <q-input v-model="form.payEndDate" outlined dense class="custom-input" readonly>
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

      <!-- Action Buttons -->
      <div class="row justify-end q-mt-lg q-gutter-md q-mb-md">
        <q-btn label="ยกเลิก" unelevated class="action-btn cancel-btn text-weight-bold" />
        <q-btn label="บันทึก" unelevated class="action-btn save-btn text-white text-weight-bold" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const examTypeOptions: string[] = ['รอบทั่วไป'];
const examFormatOptions: string[] = ['แบบกระดาษ'];

const form = ref({
  examName: '',
  location: '',
  examType: 'รอบทั่วไป',
  fundingCode: '',
  examFormat: 'แบบกระดาษ',
  fee: '0.00',
  seats: 1,
  isPublished: true,
  examDate: '02/05/2569',
  startTime1: '08 : 00',
  endTime1: '10 : 00',
  startTime2: '10 : 00',
  endTime2: '12 : 00',
  regStartDate: '02/05/2569',
  regEndDate: '02/05/2569',
  payStartDate: '02/05/2569',
  payEndDate: '02/05/2569',
});
</script>

<style scoped>
/* Section header row */
.section-header {
  gap: 2px;
}
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
}

/* Field labels — normal weight */
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: 6px;
}

/* Field labels — bold (inside schedule box & date sections) */
.field-label-bold {
  font-size: 13px;
  font-weight: 600;
  color: var(--neutral-700);
  margin-bottom: 4px;
}

/* Right-side section titles (bold, navy blue) */
.right-section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

/* Toggle row (สถานะเผยแพร่) */
.toggle-row {
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--neutral-200);
  background-color: var(--surface-card);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--neutral-700);
}

/* Schedule grey box */
.schedule-box {
  background-color: var(--neutral-100);
  padding: 20px;
  border-radius: var(--radius-sm);
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

/* Time separator text */
.time-separator {
  font-size: 13px;
  font-weight: 500;
  color: var(--neutral-500);
  padding: 0 4px;
}

/* Custom Input Styling */
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

/* Action Buttons */
.action-btn {
  min-width: 140px;
  border-radius: var(--radius-sm);
  font-size: 15px;
  padding: 10px 28px;
}
.cancel-btn {
  background-color: var(--neutral-200) !important;
  color: var(--text-primary) !important;
}
.save-btn {
  background-color: var(--primary) !important;
}

/* Footer border */
.border-top {
  border-top: 1px solid var(--border-color);
}

.select-none {
  user-select: none;
}
</style>
