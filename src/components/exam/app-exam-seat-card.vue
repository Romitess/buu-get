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
        <div class="text-h6 text-weight-bold line-height-tight q-mb-xs">
          {{ studentName }}
        </div>
        <div class="row q-gutter-x-lg text-body2 info-details">
          <div>รหัส: {{ studentId }}</div>
          <div v-if="hasSeat">เลขที่นั่งสอบ: {{ seatNumber }}</div>
          <div v-else>ยังไม่มีที่นั่ง</div>
        </div>
      </div>

      <!-- Dots Section -->
      <div class="dots-section q-ml-md">
        <div class="dots-grid">
          <div v-for="n in 6" :key="n" class="dot"></div>
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
}

const props = withDefaults(defineProps<Props>(), {
  seatNumber: null,
  avatarUrl: null,
});

const hasSeat = computed(() => {
  return (
    props.seatNumber !== null && props.seatNumber !== undefined && props.seatNumber.trim() !== ''
  );
});
</script>

<style scoped lang="scss">
.exam-seat-card {
  border-radius: 8px;
  transition: all 0.3s ease;

  &.seat-assigned {
    background-color: #ffffff;
    color: #000000;
  }

  &.seat-unassigned {
    /* Dim background color as requested when there is no seat */
    background-color: #31648c; /* Matched from typical slate blue visuals */
    color: #000000; /* Keeping text dark as per the image */
  }
}

.line-height-tight {
  line-height: 1.2;
}

.info-details {
  font-size: 14px;
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
  background: #9d9d9d; /* Requested color for dots */
}
</style>
