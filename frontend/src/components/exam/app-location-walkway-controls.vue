<template>
  <div class="location-walkway-controls">
    <div class="buu-label-muted">
      {{ t('admin.locationManagement.createPage.fields.walkway') }}
    </div>

    <div class="location-walkway-controls__content">
      <TransitionGroup
        v-if="props.positions.length > 0"
        name="location-walkway-chip"
        tag="div"
        class="location-walkway-controls__chips"
        :class="{ 'location-walkway-controls__chips--scroll': props.positions.length > 2 }"
      >
        <div
          v-for="position in props.positions"
          :key="`${position.type}-${position.index}`"
          class="location-walkway-controls__chip"
        >
          <span class="location-walkway-controls__chip-label">
            {{ getPositionLabel(position) }}
          </span>
          <button
            type="button"
            class="location-walkway-controls__remove"
            aria-label="Remove walkway"
            @click="emit('remove', position)"
          >
            ×
          </button>
        </div>
      </TransitionGroup>

      <AppButton
        outline
        dense
        no-caps
        color="primary"
        icon="add"
        :label="t('admin.locationManagement.createPage.actions.addWalkway')"
        class="location-walkway-controls__add"
        @click="emit('add')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppButton from 'src/components/base/app-button.vue';

interface WalkwayPosition {
  type: 'row' | 'column';
  index: number;
}

interface Props {
  positions: WalkwayPosition[];
  numberingDirection: 'horizontal' | 'vertical';
}

const props = withDefaults(defineProps<Props>(), {
  positions: () => [],
  numberingDirection: 'vertical',
});
const emit = defineEmits<{
  (event: 'add'): void;
  (event: 'remove', position: WalkwayPosition): void;
}>();
const { t } = useI18n();
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const getPositionLabel = (position: WalkwayPosition): string => {
  const isRow = position.type === 'row';
  const label = isRow ? 'หลังแถว' : 'หลังคอลัมน์';
  const useLetters = props.numberingDirection === 'horizontal' ? isRow : !isRow;
  const positionLabel = useLetters
    ? (alphabet[position.index - 1] ?? `${position.index}`)
    : `${position.index}`;

  return `${label} ${positionLabel}`;
};
</script>

<style scoped lang="scss">
.location-walkway-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  min-width: 0;
  margin-top: 18px;
}

.location-walkway-controls__content {
  display: flex;
  gap: 4px;
  align-items: flex-start;
  width: 100%;
  min-height: 39px;
}

.location-walkway-controls__chips {
  display: flex;
  flex: 0 1 auto;
  gap: 4px;
  align-items: center;
  width: max-content;
  min-width: 0;
  max-width: calc(100% - 124px);
  min-height: 39px;
  overflow: visible;
}

.location-walkway-controls__chips--scroll {
  flex: 1 1 auto;
  width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 10px;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #8d8d8d;
    border-radius: 999px;
  }
}

.location-walkway-controls__chip {
  box-sizing: border-box;
  display: inline-flex;
  flex: 0 0 110px;
  align-items: center;
  gap: 4px;
  width: 110px;
  min-width: 0;
  height: 39px;
  padding: 0 6px;
  border: 1px solid #dddddd;
  border-radius: 12px;
  background: #ffffff;
  color: #111111;
  font-family: Sarabun, sans-serif;
  font-size: 12px;
}

.location-walkway-controls__chip-label {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-walkway-controls__remove {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 8px;
  height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #000000;
  cursor: pointer;
  font-family: Arial, sans-serif;
  font-size: 16px;
  line-height: 18px;
}

.location-walkway-controls__add {
  width: 120px;
  min-width: 120px;
  height: 39px;
  min-height: 39px;
  padding: 0 8px;
  border-radius: 12px;
  background: #ffffff;
  color: var(--primary, #0d47a1);

  &::before {
    border: 1px solid var(--primary, #0d47a1);
  }

  :deep(.q-btn__content) {
    gap: 4px;
    flex-wrap: nowrap;
    justify-content: center;
    width: 100%;
  }

  :deep(.q-icon) {
    font-size: 18px;
    color: var(--primary, #0d47a1);
  }

  :deep(.q-icon.on-left) {
    margin-right: 0;
  }

  :deep(.block) {
    color: var(--primary, #0d47a1);
    font-size: 12px;
    line-height: 1;
    white-space: nowrap;
  }
}

.location-walkway-chip-enter-active {
  transition:
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 220ms ease;
}

.location-walkway-chip-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}

.location-walkway-chip-leave-active {
  position: absolute;
  opacity: 0;
}
</style>
