<template>
  <div>
    <!-- Main Registration Dialog -->
    <q-dialog v-model="isOpen" persistent>
      <q-card style="width: 800px; max-width: 95vw; border-radius: 16px;">
        <q-card-section class="row items-center q-pb-none" style="border-bottom: 1px solid #eee; padding-bottom: 16px;">
          <div>
            <h2 class="text-h6 q-ma-none text-weight-bold" style="color: var(--text-primary)">ระบบลงทะเบียนสอบ</h2>
            <div class="text-caption text-grey-7" style="margin-top: 4px;">รหัสวิชา: {{ exam?.name || 'ไม่ระบุ' }}</div>
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pa-lg">
          <div class="row q-col-gutter-xl">
            <!-- Exam Details -->
            <div class="col-12 col-sm-6">
              <div class="text-subtitle1 text-weight-bold q-mb-md" style="color: var(--text-primary); border-bottom: 2px solid var(--q-primary); display: inline-block; padding-bottom: 4px;">รายละเอียดการสอบ</div>
              
              <div class="row q-col-gutter-y-md">
                <div class="col-4 text-weight-medium" style="color: var(--text-secondary)">รอบสอบ:</div>
                <div class="col-8" style="color: var(--text-primary)">{{ exam?.name || '-' }}</div>
                
                <div class="col-4 text-weight-medium" style="color: var(--text-secondary)">วันที่สอบ:</div>
                <div class="col-8" style="color: var(--text-primary)">{{ exam?.examDate || '-' }}</div>

                <div class="col-4 text-weight-medium" style="color: var(--text-secondary)">สถานที่:</div>
                <div class="col-8" style="color: var(--text-primary)">{{ exam?.location || '-' }}</div>
                
                <div class="col-4 text-weight-medium" style="color: var(--text-secondary)">ค่าธรรมเนียม:</div>
                <div class="col-8 text-weight-bold text-primary">500 บาท</div>
              </div>
            </div>

            <!-- Status Display -->
            <div class="col-12 col-sm-6">
              <div class="text-subtitle1 text-weight-bold q-mb-md" style="color: var(--text-primary); border-bottom: 2px solid var(--q-primary); display: inline-block; padding-bottom: 4px;">สถานะของคุณ</div>
              
              <div class="bg-grey-1 q-pa-md" style="border-radius: 12px; border: 1px solid #e0e0e0;">
                <div class="row items-center q-mb-sm">
                  <div class="col-5 text-weight-medium" style="color: var(--text-secondary)">การสมัคร:</div>
                  <div class="col-7">
                    <q-chip :color="registrationStatusColor" text-color="white" size="sm" class="text-weight-bold q-ma-none" style="border-radius: 6px;">
                      {{ registrationStatusText }}
                    </q-chip>
                  </div>
                </div>
                
                <div class="row items-center">
                  <div class="col-5 text-weight-medium" style="color: var(--text-secondary)">การชำระเงิน:</div>
                  <div class="col-7">
                    <q-chip :color="paymentStatusColor" text-color="white" size="sm" class="text-weight-bold q-ma-none" style="border-radius: 6px;">
                      {{ paymentStatusText }}
                    </q-chip>
                  </div>
                </div>
              </div>
              
              <!-- Countdown Warning -->
              <q-banner 
                v-if="status === 'pending_payment'" 
                dense 
                class="bg-red-1 text-negative q-mt-md shadow-1" 
                rounded 
                style="border: 1px solid #ffcdd2;"
              >
                <template v-slot:avatar>
                  <q-icon name="timer" color="negative" />
                </template>
                <div class="text-caption text-weight-medium">
                  กรุณาชำระเงินภายในเวลา <span class="text-h6 q-px-xs">{{ formattedTimeLeft }}</span> นาที
                </div>
                <div class="text-caption" style="opacity: 0.8; font-size: 0.7rem;">
                  หากเกินเวลา ระบบจะยกเลิกการทำรายการอัตโนมัติ
                </div>
              </q-banner>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md bg-grey-1" style="border-bottom-left-radius: 16px; border-bottom-right-radius: 16px;">
          <!-- Self Cancel Button -->
          <q-btn 
            v-if="status === 'paid' || status === 'pending_payment'" 
            flat 
            color="negative" 
            label="ยกเลิกการทำรายการ" 
            icon="cancel" 
            no-caps
            @click="confirmCancelRegistration" 
          />
          
          <!-- Register Button -->
          <q-btn 
            v-if="status === 'not_registered' || status === 'canceled'" 
            color="primary" 
            text-color="dark"
            label="ลงทะเบียนสอบ" 
            icon="how_to_reg" 
            unelevated
            no-caps
            style="border-radius: 8px; font-weight: 600;"
            @click="registerExam" 
          />

          <!-- Pay Button -->
          <q-btn 
            v-if="status === 'pending_payment'" 
            color="positive" 
            label="เลือกการชำระเงิน" 
            icon="payment" 
            unelevated
            no-caps
            style="border-radius: 8px; font-weight: 600;"
            @click="openPaymentDialog" 
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Cancel Confirmation Dialog -->
    <q-dialog v-model="isCancelDialogOpen" persistent>
      <q-card style="min-width: 350px; border-radius: 12px;">
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-subtitle1 text-weight-bold">ยืนยันการยกเลิก</span>
        </q-card-section>

        <q-card-section class="q-pt-none text-body2">
          {{ status === 'pending_payment' ? 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการทำรายการนี้?' : 'คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการสมัครสอบนี้ด้วยตัวเอง?' }}
        </q-card-section>

        <q-card-actions align="right" class="text-primary">
          <q-btn flat label="ไม่ยกเลิก" v-close-popup />
          <q-btn flat color="negative" label="ยืนยันการยกเลิก" @click="executeCancelRegistration" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Payment Dialog Component (Merged) -->
    <q-dialog v-model="isPaymentDialogOpen" persistent>
      <q-card style="min-width: 450px; max-width: 90vw; border-radius: 16px;">
        <q-card-section class="row items-center bg-primary text-dark">
          <div class="text-h6 text-weight-bold">รูปแบบการชำระเงิน</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-tabs
            v-model="paymentRound"
            dense
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
            narrow-indicator
          >
            <q-tab name="normal" label="รอบทั่วไป" no-caps />
            <q-tab name="special" label="รอบพิเศษ" no-caps />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="paymentRound" animated class="q-mt-md">
            <!-- Normal Round (QR Code) -->
            <q-tab-panel name="normal">
              <div class="text-center">
                <div class="text-subtitle1 text-weight-bold q-mb-md">ชำระเงินผ่าน QR Code (พร้อมเพย์)</div>
                <div class="bg-grey-2 q-mx-auto q-pa-md flex flex-center" style="width: 220px; height: 220px; border-radius: 16px;">
                  <q-icon name="qr_code_2" size="140px" color="grey-8" />
                </div>
                <div class="q-mt-md text-h5 text-primary text-weight-bold" style="color: #d4a900 !important">ยอดชำระ: 500 บาท</div>
                <div class="text-caption text-negative q-mt-sm">
                  * สแกน QR Code นี้เพื่อชำระเงิน การสมัครจะถูกยกเลิกหากหมดเวลา
                </div>
                
                <q-btn 
                  color="positive" 
                  label="จำลองว่าจ่ายเงินสำเร็จ" 
                  class="q-mt-lg full-width" 
                  unelevated
                  no-caps
                  style="border-radius: 8px; font-weight: 600;"
                  @click="simulatePaymentSuccess"
                />
              </div>
            </q-tab-panel>

            <!-- Special Round (Placeholder) -->
            <q-tab-panel name="special">
              <div class="text-center q-pa-xl">
                <q-icon name="info" size="60px" color="warning" class="q-mb-md" />
                <div class="text-h6 text-weight-bold">รอบพิเศษ</div>
                <div class="text-body2 text-grey-8 q-mt-sm">
                  ระบบการชำระเงินสำหรับรอบพิเศษอยู่ระหว่างการพัฒนา<br />กรุณาติดต่อเจ้าหน้าที่หากมีข้อสงสัย
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, watch } from 'vue';
import { useQuasar } from 'quasar';

export interface ExamInfo {
  id?: number;
  name?: string;
  examDate?: string;
  location?: string;
}

const props = defineProps<{
  modelValue: boolean;
  exam: ExamInfo | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const $q = useQuasar();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// Watch for exam changes to reset state
watch(() => props.exam, () => {
  status.value = 'not_registered';
  clearTimer();
});

// --- State Management ---
type RegistrationStatus = 'not_registered' | 'pending_payment' | 'paid' | 'canceled';
const status = ref<RegistrationStatus>('not_registered');

const isPaymentDialogOpen = ref(false);
const isCancelDialogOpen = ref(false);
const paymentRound = ref<'normal' | 'special'>('normal');

// --- Timer Logic ---
const PAYMENT_TIME_LIMIT = 60; // Mock: 60 seconds to pay
const timeLeft = ref(0);
let timerInterval: number | null = null;

const formattedTimeLeft = computed(() => {
  const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0');
  const s = (timeLeft.value % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});

const startTimer = () => {
  timeLeft.value = PAYMENT_TIME_LIMIT;
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = window.setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      // Time limit reached -> revert to not_registered automatically
      clearTimer();
      if (status.value === 'pending_payment') {
        status.value = 'not_registered';
        isPaymentDialogOpen.value = false;
        $q.notify({
          type: 'warning',
          message: 'หมดเวลาชำระเงิน ระบบได้ยกเลิกการทำรายการของคุณแล้ว (กรุณาสมัครใหม่)',
          position: 'top',
          timeout: 4000
        });
      }
    }
  }, 1000);
};

const clearTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

// --- Computed Properties for Display ---
const registrationStatusText = computed(() => {
  switch (status.value) {
    case 'not_registered': return 'ยังไม่สมัคร';
    case 'pending_payment': return 'รอการชำระเงิน';
    case 'paid': return 'สมัครสำเร็จ';
    case 'canceled': return 'ยกเลิกการสมัคร';
    default: return '-';
  }
});

const registrationStatusColor = computed(() => {
  switch (status.value) {
    case 'not_registered': return 'grey';
    case 'pending_payment': return 'warning';
    case 'paid': return 'positive';
    case 'canceled': return 'negative';
    default: return 'grey';
  }
});

const paymentStatusText = computed(() => {
  switch (status.value) {
    case 'not_registered': return 'ยังไม่มีรายการ';
    case 'pending_payment': return 'ยังไม่ชำระเงิน';
    case 'paid': return 'ชำระเงินแล้ว';
    case 'canceled': return 'ยกเลิก / หมดอายุ';
    default: return '-';
  }
});

const paymentStatusColor = computed(() => {
  switch (status.value) {
    case 'not_registered': return 'grey';
    case 'pending_payment': return 'warning';
    case 'paid': return 'positive';
    case 'canceled': return 'negative';
    default: return 'grey';
  }
});

// --- User Actions ---
const registerExam = () => {
  status.value = 'pending_payment';
  startTimer();
  $q.notify({
    type: 'positive',
    message: 'ลงทะเบียนสำเร็จ! กรุณาชำระเงินภายในเวลาที่กำหนด',
    position: 'top'
  });
};

defineExpose({
  registerExam
});

const confirmCancelRegistration = () => {
  isCancelDialogOpen.value = true;
};

const executeCancelRegistration = () => {
  if (status.value === 'pending_payment') {
    status.value = 'not_registered';
    clearTimer();
    $q.notify({
      type: 'negative',
      message: 'คุณได้ทำการยกเลิกการทำรายการเรียบร้อยแล้ว',
      position: 'top'
    });
  } else if (status.value === 'paid') {
    status.value = 'canceled';
    clearTimer();
    $q.notify({
      type: 'negative',
      message: 'คุณได้ทำการยกเลิกการสมัครเรียบร้อยแล้ว',
      position: 'top'
    });
  }
};

const openPaymentDialog = () => {
  isPaymentDialogOpen.value = true;
};

const simulatePaymentSuccess = () => {
  status.value = 'paid';
  clearTimer();
  isPaymentDialogOpen.value = false;
  $q.notify({
    type: 'positive',
    message: 'ชำระเงินสำเร็จ! การสมัครของคุณได้รับการยืนยัน',
    position: 'top'
  });
};

// --- Lifecycle ---
onBeforeUnmount(() => {
  clearTimer();
});
</script>

<style scoped lang="scss">
</style>
