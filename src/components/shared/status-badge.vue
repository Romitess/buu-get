<template>
  <q-chip
    v-if="config"
    :label="config.label"
    :color="config.color"
    :outline="config.outline"
    text-color="current"
    square
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
}>();

const STATUS_CONFIG: Record<string, { label: string; color: string; outline: boolean }> = {
  // Exam
  published: { label: 'เผยแพร่แล้ว', color: 'blue-7', outline: true },
  unpublished: { label: 'ยังไม่เผยแพร่', color: 'grey-5', outline: true },

  // Payment
  paid: { label: 'ชำระเงินแล้ว', color: 'green-6', outline: true },
  unpaid: { label: 'ค้างชำระ', color: 'red-6', outline: true },

  // Accuracy
  passed: { label: 'ผ่าน', color: 'green-6', outline: true },
  pending_fix: { label: 'รอการแก้ไข', color: 'red-6', outline: true },
  pending_review: { label: 'รอการตรวจสอบ', color: 'blue-5', outline: true },
  pending_payment: { label: 'รอการชำระเงิน', color: 'grey-7', outline: true },
};

const config = computed(() => STATUS_CONFIG[props.status]);
</script>
