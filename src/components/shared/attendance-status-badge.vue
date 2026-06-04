<template>
  <div class="attendance-status-badge" :class="badgeClass">
    {{ label }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ExamAttendStatus } from 'src/types/enrollment.types';

interface Props {
  status: ExamAttendStatus;
}

const props = defineProps<Props>();

const label = computed(() => {
  switch (props.status) {
    case ExamAttendStatus.INTIME:
      return 'เข้าสอบแล้ว';
    case ExamAttendStatus.LATE:
      return 'สาย';
    case ExamAttendStatus.MISSING:
      return 'ขาด';
    default:
      return 'ขาด';
  }
});

const badgeClass = computed(() => {
  switch (props.status) {
    case ExamAttendStatus.INTIME:
      return 'badge--on-time';
    case ExamAttendStatus.LATE:
      return 'badge--late';
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
  color: #4caf50;
  background-color: transparent;
  border: 1.5px solid #4caf50;
}

.badge--late {
  color: #fbc02d;
  background-color: transparent;
  border: 1.5px solid #fbc02d;
}

.badge--absent {
  color: #ef5350;
  background-color: transparent;
  border: 1.5px solid #ef5350;
}
</style>
