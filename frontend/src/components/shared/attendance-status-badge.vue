<template>
  <div class="attendance-status-badge" :class="badgeClass">
    {{ label }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ExamAttendStatus } from 'src/types/enrollment.types';

interface Props {
  status: ExamAttendStatus;
}

const props = defineProps<Props>();
const { t } = useI18n();

const label = computed(() => {
  switch (props.status) {
    case ExamAttendStatus.INTIME:
      return t('admin.examAttendance.status.intime');
    case ExamAttendStatus.MISSING:
      return t('admin.examAttendance.status.missing');
    default:
      return t('admin.examAttendance.status.missing');
  }
});

const badgeClass = computed(() => {
  switch (props.status) {
    case ExamAttendStatus.INTIME:
      return 'badge--on-time';
    case ExamAttendStatus.MISSING:
      return 'badge--absent';
    default:
      return 'badge--absent';
  }
});
</script>

<style scoped lang="scss">
.attendance-status-badge {
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
}

.badge--on-time {
  color: var(--badge-success-dot);
  background-color: transparent;
  border: 1.5px solid var(--badge-success-dot);
}

.badge--absent {
  color: var(--badge-error-dot);
  background-color: transparent;
  border: 1.5px solid var(--badge-error-dot);
}
</style>
