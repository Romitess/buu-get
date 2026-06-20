<template>
  <q-tabs
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    dense
    class="app-exam-session-tabs q-mb-sm"
    active-color="blue-6"
    indicator-color="blue-6"
    align="left"
    narrow-indicator
    no-caps
  >
    <q-tab
      v-for="session in uniqueSessions"
      :key="session.SS_ID"
      :name="session.SS_ID"
      :label="formatSessionLabel(session)"
    />
  </q-tabs>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { BackendSession } from 'src/types/exam';

interface Props {
  modelValue: number | null;
  sessions?: BackendSession[] | undefined;
}

const props = defineProps<Props>();

defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
}>();

const formatSessionLabel = (session: BackendSession): string => {
  const start = (session.SS_START_TIME || '').substring(0, 5);
  const end = (session.SS_END_TIME || '').substring(0, 5);
  if (!start || !end) return '-';
  return `${start}-${end}`;
};

const getSessionTimeKey = (session: BackendSession): string => {
  return `${session.SS_START_TIME || ''}-${session.SS_END_TIME || ''}`;
};

const uniqueSessions = computed<BackendSession[]>(() => {
  const seen = new Set<string>();
  return (props.sessions || []).filter((session) => {
    const key = getSessionTimeKey(session);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});
</script>

<style scoped lang="scss">
.app-exam-session-tabs {
  border-bottom: 2px solid var(--dashboard-tab-border);

  :deep(.q-tab) {
    padding: 0 16px;
    min-height: 48px;
    color: var(--text-primary);

    .q-tab__label {
      font-size: 18px;
      font-weight: 500;
      letter-spacing: 0.01em;
    }
  }

  :deep(.q-tab--active) {
    .q-tab__label {
      font-weight: 500;
    }
  }
}
</style>
