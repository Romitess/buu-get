<template>
  <q-input
    ref="inputRef"
    v-bind="$attrs"
    :model-value="modelValue"
    readonly
    class="app-time-picker cursor-pointer"
    :class="{ 'app-time-picker--open': isOpen }"
    @click="openPicker"
  >
    <template #append>
      <q-icon name="schedule" class="cursor-pointer" @click.stop="openPicker" />
      <q-menu
        ref="menuRef"
        :target="popupTarget"
        no-parent-event
        anchor="bottom left"
        self="top left"
        class="app-time-picker__menu"
        :style="{
          '--app-time-picker-width': `${popupWidth}px`,
        }"
        :offset="[0, 0]"
        @show="handleMenuShow"
        @hide="isOpen = false"
      >
        <div class="time-wheel">
          <div class="time-wheel__body">
            <div class="time-wheel__fade time-wheel__fade--top" />
            <div class="time-wheel__fade time-wheel__fade--bottom" />
            <div
              ref="hourWheelRef"
              class="time-wheel__column"
              :class="{ 'time-wheel__column--dragging': dragType === 'hour' }"
              @scroll="onWheelScroll('hour')"
              @pointerdown="startDrag('hour', $event)"
            >
              <div class="time-wheel__spacer" />
              <button
                v-for="hour in hours"
                :key="hour"
                type="button"
                class="time-wheel__option"
                :class="{ 'time-wheel__option--active': hour === selectedHour }"
                @click="selectWheelValue('hour', hour)"
              >
                {{ hour }}
              </button>
              <div class="time-wheel__spacer" />
            </div>

            <div class="time-wheel__separator">:</div>

            <div
              ref="minuteWheelRef"
              class="time-wheel__column"
              :class="{ 'time-wheel__column--dragging': dragType === 'minute' }"
              @scroll="onWheelScroll('minute')"
              @pointerdown="startDrag('minute', $event)"
            >
              <div class="time-wheel__spacer" />
              <button
                v-for="minute in minutes"
                :key="minute"
                type="button"
                class="time-wheel__option"
                :class="{ 'time-wheel__option--active': minute === selectedMinute }"
                @click="selectWheelValue('minute', minute)"
              >
                {{ minute }}
              </button>
              <div class="time-wheel__spacer" />
            </div>
            <div class="time-wheel__selection" />
          </div>
        </div>
      </q-menu>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import type { QInput, QMenu } from 'quasar';

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'select', value: string): void;
}>();

type WheelType = 'hour' | 'minute';

const ITEM_HEIGHT = 36;
const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

const menuRef = ref<QMenu | null>(null);
const inputRef = ref<QInput | null>(null);
const popupWidth = ref(220);
const popupTarget = ref<HTMLElement | undefined>();
const hourWheelRef = ref<HTMLElement | null>(null);
const minuteWheelRef = ref<HTMLElement | null>(null);
const selectedHour = ref('08');
const selectedMinute = ref('00');
const isOpen = ref(false);
const dragType = ref<WheelType | null>(null);
const scrollTimers: Partial<Record<WheelType, ReturnType<typeof setTimeout>>> = {};
let dragStartY = 0;
let dragStartScrollTop = 0;
let isSnapping = false;
let dragFrame: number | null = null;

const openPicker = (): void => {
  const inputElement = inputRef.value?.$el as HTMLElement | undefined;
  const controlElement = inputElement?.querySelector<HTMLElement>('.q-field__control');
  if (inputElement && controlElement) {
    const controlRect = controlElement.getBoundingClientRect();
    popupWidth.value = controlRect.width;
    popupTarget.value = controlElement;
  }
  isOpen.value = true;
  menuRef.value?.show();
};

const scrollToValue = (type: WheelType, value: string, behavior: ScrollBehavior): void => {
  const values = type === 'hour' ? hours : minutes;
  const element = type === 'hour' ? hourWheelRef.value : minuteWheelRef.value;
  const index = values.indexOf(value);
  if (element && index >= 0) {
    if (behavior === 'auto') {
      element.style.scrollBehavior = 'auto';
      element.scrollTop = index * ITEM_HEIGHT;
      element.style.removeProperty('scroll-behavior');
      return;
    }
    element.scrollTo({ top: index * ITEM_HEIGHT, behavior });
  }
};

const syncPicker = async (): Promise<void> => {
  const [hour = '08', minute = '00'] = (props.modelValue || '08:00').split(':');
  selectedHour.value = hours.includes(hour) ? hour : '08';
  selectedMinute.value = minutes.includes(minute) ? minute : '00';
  await nextTick();
  scrollToValue('hour', selectedHour.value, 'auto');
  scrollToValue('minute', selectedMinute.value, 'auto');
};

const applyPopupWidth = (): void => {
  const menuElement = menuRef.value?.$el as HTMLElement | undefined;
  if (!menuElement) return;
  const width = `${popupWidth.value}px`;
  menuElement.style.setProperty('width', width, 'important');
  menuElement.style.setProperty('min-width', width, 'important');
  menuElement.style.setProperty('max-width', width, 'important');
  menuElement.style.setProperty('box-sizing', 'border-box', 'important');
};

const handleMenuShow = async (): Promise<void> => {
  await syncPicker();
  await nextTick();
  applyPopupWidth();
};

const updateFromScroll = (type: WheelType, shouldSnap = false): void => {
  const values = type === 'hour' ? hours : minutes;
  const element = type === 'hour' ? hourWheelRef.value : minuteWheelRef.value;
  if (!element) return;

  const index = Math.max(
    0,
    Math.min(values.length - 1, Math.round(element.scrollTop / ITEM_HEIGHT)),
  );
  const value = values[index];
  if (!value) return;

  if (type === 'hour') selectedHour.value = value;
  else selectedMinute.value = value;
  emitCurrentTime(false);
  if (shouldSnap) {
    isSnapping = true;
    element.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
    emitCurrentTime(true);
    window.setTimeout(() => {
      isSnapping = false;
    }, 180);
  }
};

const onWheelScroll = (type: WheelType): void => {
  if (isSnapping) return;
  updateFromScroll(type);
  const timer = scrollTimers[type];
  if (timer) clearTimeout(timer);
  scrollTimers[type] = setTimeout(() => updateFromScroll(type, true), 140);
};

const selectWheelValue = (type: WheelType, value: string): void => {
  if (type === 'hour') selectedHour.value = value;
  else selectedMinute.value = value;
  scrollToValue(type, value, 'smooth');
  emitCurrentTime(true);
};

const emitCurrentTime = (completed: boolean): void => {
  const value = `${selectedHour.value}:${selectedMinute.value}`;
  emit('update:modelValue', value);
  if (completed) emit('select', value);
};

const stopDrag = (event: PointerEvent): void => {
  if (!dragType.value) return;
  const type = dragType.value;
  const element = type === 'hour' ? hourWheelRef.value : minuteWheelRef.value;
  element?.releasePointerCapture(event.pointerId);
  updateFromScroll(type, true);
  dragType.value = null;
  if (dragFrame !== null) {
    cancelAnimationFrame(dragFrame);
    dragFrame = null;
  }
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', stopDrag);
  window.removeEventListener('pointercancel', stopDrag);
};

const onDrag = (event: PointerEvent): void => {
  if (!dragType.value || dragFrame !== null) return;
  const type = dragType.value;
  const nextScrollTop = dragStartScrollTop + dragStartY - event.clientY;
  dragFrame = requestAnimationFrame(() => {
    const element = type === 'hour' ? hourWheelRef.value : minuteWheelRef.value;
    if (element) {
      element.scrollTop = nextScrollTop;
      updateFromScroll(type);
    }
    dragFrame = null;
  });
};

const startDrag = (type: WheelType, event: PointerEvent): void => {
  if (event.pointerType === 'touch') return;
  const element = type === 'hour' ? hourWheelRef.value : minuteWheelRef.value;
  if (!element) return;

  dragType.value = type;
  dragStartY = event.clientY;
  dragStartScrollTop = element.scrollTop;
  element.setPointerCapture(event.pointerId);
  window.addEventListener('pointermove', onDrag);
  window.addEventListener('pointerup', stopDrag);
  window.addEventListener('pointercancel', stopDrag);
};
</script>

<style scoped>
.app-time-picker {
  width: 100%;
}

.app-time-picker :deep(.q-field__native) {
  cursor: pointer;
}

.app-time-picker :deep(.q-field__control) {
  transition:
    border-radius 0.16s ease,
    box-shadow 0.16s ease;
}

.app-time-picker--open :deep(.q-field__control) {
  border-radius: var(--radius-sm) var(--radius-sm) 0 0 !important;
  box-shadow: 0 4px 10px rgb(15 23 42 / 6%);
}

.app-time-picker--open :deep(.q-field__control::before),
.app-time-picker--open :deep(.q-field__control::after) {
  border-bottom-color: transparent !important;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0 !important;
}

:global(.app-time-picker__menu) {
  width: var(--app-time-picker-width) !important;
  min-width: var(--app-time-picker-width) !important;
  max-width: var(--app-time-picker-width) !important;
  box-sizing: border-box !important;
  margin-top: -1px !important;
  border: 1px solid var(--primary);
  border-top: 0;
  border-radius: 0 0 var(--radius-sm) var(--radius-sm) !important;
  box-shadow: 0 10px 20px rgb(15 23 42 / 12%) !important;
  overflow: hidden;
}

.time-wheel {
  box-sizing: border-box;
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  background: var(--surface-card);
}

.time-wheel__body {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 24px 1fr;
  align-items: center;
  height: 184px;
  padding: 0 10px;
  overflow: hidden;
  background: var(--surface-card);
}

.time-wheel__column {
  z-index: 1;
  height: 184px;
  overflow-y: auto;
  scrollbar-width: none;
  scroll-snap-type: y proximity;
  scroll-behavior: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  perspective: 220px;
  touch-action: pan-y;
  cursor: grab;
  user-select: none;
}

.time-wheel__column:active {
  cursor: grabbing;
}

.time-wheel__column--dragging {
  scroll-snap-type: none;
}

.time-wheel__column--dragging .time-wheel__option {
  transition: none;
}

.time-wheel__column::-webkit-scrollbar {
  display: none;
}

.time-wheel__spacer {
  height: 74px;
}

.time-wheel__option {
  display: block;
  width: 100%;
  height: 36px;
  padding: 0;
  color: var(--text-primary);
  font: inherit;
  font-size: 16px;
  background: transparent;
  border: 0;
  opacity: 0.38;
  scroll-snap-align: center;
  cursor: pointer;
  transform: scale(0.88);
  transition:
    color 0.15s ease,
    opacity 0.15s ease,
    transform 0.15s ease;
}

.time-wheel__option--active {
  color: var(--primary);
  font-weight: 600;
  opacity: 1;
  transform: scale(1.08);
}

.time-wheel__separator {
  z-index: 2;
  color: var(--primary);
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.time-wheel__selection {
  position: absolute;
  z-index: 0;
  top: 74px;
  right: 14px;
  left: 14px;
  height: 36px;
  background: color-mix(in srgb, var(--primary) 8%, var(--surface-card));
  border-top: 1px solid color-mix(in srgb, var(--primary) 18%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--primary) 18%, transparent);
  border-radius: var(--radius-sm);
  pointer-events: none;
}

.time-wheel__fade {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 3;
  height: 62px;
  pointer-events: none;
}

.time-wheel__fade--top {
  top: 0;
  background: linear-gradient(to bottom, var(--surface-card) 12%, transparent);
}

.time-wheel__fade--bottom {
  bottom: 0;
  background: linear-gradient(to top, var(--surface-card) 12%, transparent);
}
</style>
