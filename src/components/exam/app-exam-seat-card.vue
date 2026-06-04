<template>
  <q-card :class="['exam-seat-card', hasSeat ? 'seat-assigned' : 'seat-unassigned']" flat>
    <q-card-section class="q-pa-md row items-center no-wrap">
      <!-- Avatar Section -->
      <div class="avatar-wrapper q-mr-md">
        <q-avatar size="56px" class="bg-primary">
          <img v-if="avatarUrl" :src="avatarUrl" alt="Student Avatar" />
          <q-icon v-else name="person" color="white" />
        </q-avatar>
      </div>

      <!-- Information Section -->
      <div class="info-section col">
        <div class="student-name line-height-tight q-mb-xs">
          {{ studentName }}
        </div>
        <div class="row no-wrap items-center q-gutter-x-md text-body2 info-details text-black">
          <span v-if="displayRemark" :class="['remark-badge', remarkBadgeClass]">
            หมายเหตุ: {{ displayRemark }}
          </span>
          <span v-if="hasSeat" class="text-no-wrap seat-label">
            เลขที่นั่งสอบ: {{ seatNumber }}
          </span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  studentName: string;
  studentId: string;
  seatNumber?: string | null;
  avatarUrl?: string | null;
  remark?: string;
  isForeigner?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  seatNumber: null,
  avatarUrl: null,
  remark: '',
  isForeigner: false,
});

const hasSeat = computed((): boolean => {
  return (
    props.seatNumber !== null && props.seatNumber !== undefined && props.seatNumber.trim() !== ''
  );
});

const displayRemark = computed((): string => {
  return props.remark || '';
});

const remarkBadgeClass = computed((): string => {
  if (props.isForeigner) return 'remark-foreigner';
  if (props.remark && props.remark !== 'ชาวไทย') return 'remark-special';
  return 'remark-default';
});
</script>

<style scoped lang="scss">
.exam-seat-card {
  border-radius: 8px;
  transition: all 0.3s ease;

  &.seat-assigned {
    background-color: var(--surface-card);
    border: 1px solid #000000;
    color: var(--text-primary);
  }

  &.seat-unassigned {
    background-color: #8fbceb; /* Rich blue matching the mockup precisely */
    border: 1px solid #000000;
    color: var(--text-primary);
  }
}

.line-height-tight {
  line-height: 1.2;
}

.student-name {
  font-family: 'Sarabun', sans-serif;
  font-weight: 500;
  font-size: 20px;
  line-height: 100%;
  vertical-align: middle;
  color: var(--text-primary, #000000);
}

.info-details {
  font-family: 'Sarabun', sans-serif;
  font-weight: 500;
  font-size: 16px;
  line-height: 100%;
  vertical-align: middle;
  color: var(--text-primary, #000000);
}

.remark-badge {
  font-weight: 500;
  white-space: nowrap;
}

.remark-foreigner {
  color: var(--badge-error-text);
}

.remark-special {
  color: var(--badge-warning-text);
}

.remark-default {
  color: inherit;
}

.seat-label {
  color: inherit;
}

.dots-section {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px; /* Requested width: 20 */
}

.dots-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted); /* Standardized muted color */
}
</style>
