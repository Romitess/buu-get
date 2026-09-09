<template>
  <div class="audit-status-badge" :class="badgeClass">
    {{ label }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AuditLogStatus } from 'src/types/audit-logs.types';

const props = defineProps<{
  status: AuditLogStatus;
}>();

const { t, locale } = useI18n();

const label = computed((): string => {
  void locale.value;
  return t(`admin.auditLogs.status.${props.status}`);
});

const badgeClass = computed((): string => {
  if (props.status === 'SUCCESS') return 'badge--success';
  if (props.status === 'FAILURE') return 'badge--failure';
  return 'badge--partial';
});
</script>

<style scoped lang="scss">
.audit-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  min-width: 120px;
  text-align: center;
  background-color: transparent;
}

.badge--success {
  color: var(--badge-success-text);
  border: 1.5px solid var(--badge-success-dot);
}

.badge--failure {
  color: var(--badge-error-text);
  border: 1.5px solid var(--badge-error-dot);
}

.badge--partial {
  color: var(--badge-warning-text);
  border: 1.5px solid var(--badge-warning-dot);
}
</style>
