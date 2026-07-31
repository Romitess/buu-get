<template>
  <q-card
    :class="[
      'exam-seat-card',
      hasSeat ? 'seat-assigned' : 'seat-unassigned',
      { 'is-draggable': isDraggable },
    ]"
    :style="cardStyle"
    flat
    :draggable="isDraggable"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <q-card-section class="q-pa-md row items-center no-wrap">
      <!-- Avatar Section -->
      <div class="avatar-wrapper q-mr-md">
        <q-avatar size="60px" class="bg-primary">
          <img v-if="avatarUrl" :src="avatarUrl" alt="Student Avatar" class="avatar-img" />
          <q-icon v-else name="person" color="white" />
        </q-avatar>
      </div>

      <!-- Information Section -->
      <div class="info-section col">
        <div class="student-name line-height-tight q-mb-sm">
          {{ studentName }}
        </div>
        <div class="row no-wrap items-center justify-between text-body2 info-details info-row">
          <span v-if="displayRemark" :class="['remark-badge', remarkBadgeClass]">
            หมายเหตุ: {{ displayRemark }}
          </span>
          <span v-if="hasSeat" class="text-no-wrap seat-label">
            เลขที่นั่งสอบ: {{ seatNumber }}
          </span>
          <span v-else class="text-no-wrap seat-label seat-unassigned-hint">
            {{ dragHint }}
          </span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';
import { SEAT_STUDENT_DRAG_MIME } from 'src/composables/use-exam-seat-management';
import {
  DEFAULT_PHYSICAL_STATUS_BG_COLOR,
  getPhysicalStatusBgColor,
} from 'src/constants/physical-status';

const SEAT_DRAG_GHOST_SIZE = 64;

interface Props {
  studentName: string;
  studentId: string;
  ermId?: number | null;
  seatNumber?: string | null;
  avatarUrl?: string | null;
  remark?: string;
  bgColor?: string | null;
  isForeigner?: boolean;
  dragHint?: string;
}

const props = withDefaults(defineProps<Props>(), {
  ermId: null,
  seatNumber: null,
  avatarUrl: null,
  remark: '',
  bgColor: null,
  isForeigner: false,
  dragHint: '',
});

let activeDragGhost: HTMLElement | null = null;

const hasSeat = computed((): boolean => {
  return (
    props.seatNumber !== null && props.seatNumber !== undefined && props.seatNumber.trim() !== ''
  );
});

const isDraggable = computed((): boolean => !hasSeat.value && props.ermId != null);

const displayRemark = computed((): string => {
  return props.remark || '';
});

const typeBgColor = computed((): string => {
  return props.bgColor || getPhysicalStatusBgColor(props.remark) || DEFAULT_PHYSICAL_STATUS_BG_COLOR;
});

/** Unassigned cards use type color; assigned cards stay on the surface */
const cardStyle = computed((): Record<string, string> | undefined => {
  if (hasSeat.value) return undefined;
  return {
    backgroundColor: typeBgColor.value,
    color: '#ffffff',
  };
});

const remarkBadgeClass = computed((): string => {
  if (props.isForeigner) return 'remark-foreigner';
  if (props.remark && props.remark !== 'ชาวไทย') return 'remark-special';
  return 'remark-default';
});

/** Same short-name rule as the seat assignment tile */
const getShortDragName = (fullName: string): string => {
  const name = fullName.trim();
  if (!name) return 'Name';

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && /^[A-Za-z.]+$/.test(parts[0] ?? '')) {
    return parts[1] ?? name;
  }

  return parts[0] ?? name;
};

const removeDragGhost = (): void => {
  if (!activeDragGhost) return;
  activeDragGhost.remove();
  activeDragGhost = null;
};

const createSeatSizedDragGhost = (): HTMLElement => {
  removeDragGhost();

  const ghost = document.createElement('div');
  ghost.className = 'seat-card-drag-ghost';
  ghost.setAttribute('aria-hidden', 'true');

  const tile = document.createElement('div');
  tile.className = 'seat-card-drag-ghost__tile';
  tile.style.backgroundColor = typeBgColor.value;
  tile.style.borderColor = typeBgColor.value;

  const nameEl = document.createElement('div');
  nameEl.className = 'seat-card-drag-ghost__name';
  nameEl.textContent = getShortDragName(props.studentName);

  const avatarEl = document.createElement('div');
  avatarEl.className = 'seat-card-drag-ghost__avatar';

  if (props.avatarUrl) {
    const img = document.createElement('img');
    img.src = props.avatarUrl;
    img.alt = '';
    avatarEl.appendChild(img);
  } else {
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('width', '21');
    icon.setAttribute('height', '21');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML =
      '<path fill="#ffffff" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>';
    avatarEl.appendChild(icon);
  }

  tile.appendChild(nameEl);
  tile.appendChild(avatarEl);
  ghost.appendChild(tile);
  document.body.appendChild(ghost);
  activeDragGhost = ghost;
  return ghost;
};

const onDragStart = (event: DragEvent): void => {
  if (!isDraggable.value || props.ermId == null || !event.dataTransfer) return;

  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData(SEAT_STUDENT_DRAG_MIME, String(props.ermId));
  event.dataTransfer.setData('text/plain', String(props.ermId));

  const ghost = createSeatSizedDragGhost();
  const offset = SEAT_DRAG_GHOST_SIZE / 2;
  event.dataTransfer.setDragImage(ghost, offset, offset);
};

const onDragEnd = (): void => {
  removeDragGhost();
};

onBeforeUnmount(() => {
  removeDragGhost();
});
</script>

<style scoped lang="scss">
.exam-seat-card {
  width: 100%;
  min-width: 0;
  border-radius: 4px;
  transition: all 0.3s ease;

  &.seat-assigned {
    background-color: var(--surface-card);
    border: 1px solid #676767b2;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12);
    color: var(--text-primary);
  }

  &.seat-unassigned {
    /* สีพื้นหลังถูก override ผ่าน inline style ตามประเภทผู้เข้าสอบ */
    background-color: var(--primary-light, #1e89e5);
    border: 1px solid #676767b2;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12);
    color: #ffffff;
  }

  &.is-draggable {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }
  }
}

.exam-seat-card :deep(.q-card__section) {
  min-width: 0;
}

.avatar-wrapper {
  flex: 0 0 auto;
}

.info-section {
  min-width: 0;
}

.line-height-tight {
  line-height: 1.3;
}

.student-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  font-size: 20px;
  line-height: 1.25;
  vertical-align: middle;
  color: inherit;
}

.info-details {
  font-weight: 500;
  font-size: 16px;
  line-height: 1.3;
  vertical-align: middle;
  color: inherit;
}

.info-row {
  min-width: 0;
  flex-wrap: nowrap;
  gap: 12px;
}

.remark-badge {
  flex: 1 1 auto;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remark-foreigner {
  color: inherit;
}

.remark-special {
  color: inherit;
}

.remark-default {
  color: inherit;
}

.seat-label {
  color: inherit;
  flex: 0 0 auto;
  max-width: 42%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seat-unassigned-hint {
  max-width: 55%;
  font-size: 14px;
  opacity: 0.85;
}

.avatar-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
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

<style lang="scss">
.seat-card-drag-ghost {
  position: fixed;
  top: -1000px;
  left: -1000px;
  z-index: -1;
  pointer-events: none;
}

.seat-card-drag-ghost__tile {
  width: 64px;
  height: 64px;
  border-radius: 7px;
  border: 1px solid var(--primary-light, #1e89e5);
  background: var(--primary-light, #1e89e5);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
  box-shadow: 0 6px 16px rgba(30, 137, 229, 0.28);
}

.seat-card-drag-ghost__name {
  max-width: 56px;
  font-size: 15px;
  line-height: 1;
  color: #ffffff;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seat-card-drag-ghost__avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 34px;
    height: 34px;
    object-fit: cover;
  }
}
</style>
