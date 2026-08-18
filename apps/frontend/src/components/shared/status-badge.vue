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
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  status: string;
}>();

const { t, locale } = useI18n();

const STATUS_I18N_CONFIG: Record<string, { key: string; color: string; outline: boolean }> = {
  published: { key: 'admin.examManagement.status.published', color: 'blue-7', outline: true },
  unpublished: { key: 'admin.examManagement.status.unpublished', color: 'grey-5', outline: true },
  paid: { key: 'exam.status.paymentCompleted', color: 'green-6', outline: true },
  unpaid: { key: 'exam.status.pending', color: 'red-6', outline: true },
  passed: { key: 'exam.status.passed', color: 'green-6', outline: true },
  pending_fix: {
    key: 'admin.registrantManagement.verifyStatus.waitFixed',
    color: 'red-6',
    outline: true,
  },
  pending_review: {
    key: 'admin.registrantManagement.verifyStatus.unchecked',
    color: 'blue-5',
    outline: true,
  },
  pending_payment: { key: 'exam.status.pending', color: 'grey-7', outline: true },
};

const config = computed(() => {
  void locale.value;

  const entry = STATUS_I18N_CONFIG[props.status];
  if (!entry) return null;

  return {
    label: t(entry.key),
    color: entry.color,
    outline: entry.outline,
  };
});
</script>
