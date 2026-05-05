<template>
  <q-card
    class="exam-card cursor-pointer"
    bordered
    @click="$emit('select', exam)"
  >
    <!-- ชื่อการสอบ, ประเภท และ ค่าธรรมเนียม -->
    <q-card-section class="q-pa-md">
      <div class="row items-start justify-between no-wrap">
        <div class="col">
          <div class="text-subtitle1 text-weight-bold" style="line-height: 1.3; min-height: 3.9em; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word;">
            {{ exam.name }}
          </div>
          <div class="text-subtitle1 text-primary text-weight-bolder q-mt-xs">
            {{ formatCurrency(exam.fee) }}
          </div>
        </div>
        <q-chip
          :color="getTypeColor(exam.type)"
          text-color="white"
          size="xs"
          dense
          class="q-ml-sm shadow-1"
        >
          {{ exam.type }}
        </q-chip>
      </div>
    </q-card-section>

    <q-separator />

    <!-- หัว: จำนวนที่นั่ง -->
    <q-card-section class="q-py-sm q-px-md">
      <div class="section-header q-mb-xs">
        <q-icon name="event_seat" color="primary" size="xs" class="q-mr-xs" />
        <span class="text-caption text-weight-bold">จำนวนที่นั่ง</span>
      </div>
      <div class="row items-center">
        <q-linear-progress
          :value="seatRatio"
          :color="exam.availableSeats > 0 ? 'positive' : 'negative'"
          track-color="grey-3"
          rounded
          size="6px"
          class="col q-mr-sm"
        />
        <span class="text-caption">
          <span :class="exam.availableSeats > 0 ? 'text-positive' : 'text-negative'" class="text-weight-bold">
            {{ exam.availableSeats }}
          </span>
          / {{ exam.totalSeats }}
        </span>
      </div>
    </q-card-section>

    <q-separator inset />

    <!-- หัว: กำหนดการสอบ -->
    <q-card-section class="q-py-sm q-px-md">
      <div class="section-header q-mb-xs">
        <q-icon name="event" color="primary" size="xs" class="q-mr-xs" />
        <span class="text-caption text-weight-bold">กำหนดการสอบ</span>
      </div>
      <div class="text-caption">
        {{ formatDate(exam.schedule.examDate) }}
        <span class="text-grey-7">|</span>
        {{ exam.schedule.startTime }} - {{ exam.schedule.endTime }}
      </div>
      <div class="text-caption text-grey-6" style="font-size: 11px">
        <q-icon name="place" size="12px" class="q-mr-xs" />{{ exam.schedule.venue }}
      </div>
    </q-card-section>

    <q-separator inset />

    <!-- หัว: กำหนดการลงทะเบียน -->
    <q-card-section class="q-py-sm q-px-md">
      <div class="section-header q-mb-xs">
        <q-icon name="how_to_reg" color="primary" size="xs" class="q-mr-xs" />
        <span class="text-caption text-weight-bold">กำหนดการลงทะเบียน</span>
      </div>
      <div class="text-caption">
        {{ formatDate(exam.registration.startDate) }} - {{ formatDate(exam.registration.endDate) }}
      </div>
    </q-card-section>

    <q-separator inset />

    <!-- หัว: กำหนดการชำระเงิน -->
    <q-card-section class="q-py-sm q-px-md q-pb-md">
      <div class="section-header q-mb-xs">
        <q-icon name="payment" color="primary" size="xs" class="q-mr-xs" />
        <span class="text-caption text-weight-bold">กำหนดการชำระเงิน</span>
      </div>
      <div class="text-caption">
        ชำระภายใน {{ formatDate(exam.payment.deadline) }}
      </div>
    </q-card-section>

    <!-- ปุ่มลงทะเบียน (Center Bottom) -->
    <q-card-actions align="center" class="q-pa-md q-pt-none">
      <AppButton
        :label="exam.availableSeats > 0 ? 'ลงทะเบียน' : 'ที่นั่งเต็มแล้ว'"
        :icon="exam.availableSeats > 0 ? 'add' : 'event_busy'"
        :disable="exam.availableSeats <= 0 || !exam.isRegistrationOpen"
        class="full-width"
        :class="{ 'btn-full': exam.availableSeats <= 0 }"
        @click.stop="$emit('register', exam)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Exam } from './models'
import AppButton from './base/AppButton.vue'

// Props
interface Props {
  exam: Exam
}

const props = defineProps<Props>()

// Emits
defineEmits<{
  select: [exam: Exam]
  register: [exam: Exam]
}>()

// ================== Computed ==================
const seatRatio = computed(() => {
  if (props.exam.totalSeats === 0) return 0
  return (props.exam.totalSeats - props.exam.availableSeats) / props.exam.totalSeats
})

// ================== Helpers ==================
const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'กสพ': 'blue',
    'ความถนัด': 'green',
    'ภาษา': 'orange',
    'สมรรถนะ': 'purple',
    'อื่นๆ': 'grey'
  }
  return colors[type] || 'grey'
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<style scoped lang="scss">
.exam-card {
  border-radius: 16px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.section-header {
  display: flex;
  align-items: center;
}

.btn-full {
  opacity: 0.5 !important;
  filter: grayscale(0.6);
  pointer-events: none;
}
</style>
