<template>
  <article class="guideline-card" :class="{ 'guideline-card--compact': compact }" :style="{ '--index': String(index) }">
    <div class="guideline-card__icon-wrap">
      <q-icon :name="icon" color="primary" :size="compact ? '20px' : '24px'" />
    </div>
    <p class="guideline-card__text">{{ text }}</p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  text: string;
  index: number;
  compact?: boolean;
}>();
</script>

<style scoped lang="scss">
.guideline-card {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  background: transparent;
  opacity: 0;
  transform: translateY(8px);
  animation: guideline-card-in 200ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
  animation-delay: calc(var(--index, 0) * 40ms);
  transition: background-color 160ms cubic-bezier(0.23, 1, 0.32, 1);
}

.guideline-card--compact {
  padding: 12px 8px;
  opacity: 1;
  transform: none;
  animation: none;
  border-radius: 10px;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(13, 71, 161, 0.06);
  }
}

.guideline-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(13, 71, 161, 0.08);
  flex-shrink: 0;
}

.guideline-card--compact .guideline-card__icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.guideline-card__text {
  margin: 0;
  padding-top: 8px;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: #37474f;
  flex: 1 1 auto;
  min-width: 0;
}

.guideline-card--compact .guideline-card__text {
  padding-top: 6px;
  font-size: 0.875rem;
  line-height: 1.5;
}

@keyframes guideline-card-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (hover: hover) and (pointer: fine) {
  .guideline-card:hover {
    background-color: rgba(13, 71, 161, 0.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .guideline-card {
    animation: none;
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
