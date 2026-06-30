<template>
  <aside class="question-status" aria-label="Question status">
    <div class="question-status__title">Question {{ questionNumber }}</div>
    <div class="question-status__text">{{ statusLabel }}</div>
    <div class="question-status__text">Marked out of {{ markedOutOf }}</div>
    <button
      type="button"
      class="question-status__flag"
      :class="{ 'question-status__flag--active': flagged }"
      :aria-pressed="flagged"
      @click="emitToggleFlag"
    >
      <q-icon name="outlined_flag" size="16px" />
      <span>Flag question</span>
    </button>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  questionNumber: number;
  answered?: boolean;
  markedOutOf?: string;
  flagged?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  answered: false,
  markedOutOf: '2.00',
  flagged: false,
});

const emit = defineEmits<{
  toggleFlag: [];
}>();

const statusLabel = computed<string>(() => (props.answered ? 'Answered' : 'Not yet answered'));

const emitToggleFlag = (): void => {
  emit('toggleFlag');
};
</script>

<style scoped lang="scss">
.question-status {
  background-color: #ffffff;
  border: 1px solid #cfd6df;
  border-radius: 6px;
  color: #111827;
  min-height: 199px;
  padding: 19px 16px;

  &__title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 14px;
  }

  &__text {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 11px;
  }

  &__flag {
    align-items: center;
    background: transparent;
    border: 0;
    color: var(--q-primary);
    cursor: pointer;
    display: inline-flex;
    font-family: inherit;
    font-size: 14px;
    gap: 5px;
    margin-top: 4px;
    padding: 0;

    &--active {
      font-weight: 600;
    }
  }
}
</style>
