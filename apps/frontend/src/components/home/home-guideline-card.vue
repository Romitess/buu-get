<template>
  <article class="guideline-card" role="listitem" :style="{ '--index': String(index) }">
    <div class="guideline-card__icon-wrap">
      <q-icon :name="icon" color="primary" size="28px" />
    </div>
    <p class="guideline-card__text text-body2 text-grey-9">
      {{ text }}
    </p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  icon: string;
  text: string;
  /** Zero-based index for stagger animation delay. */
  index: number;
}>();
</script>

<style scoped>
.guideline-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background: #fafbfd;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(13, 71, 161, 0.06);
  opacity: 0;
  transform: translateX(12px);
  animation: guideline-card-in 200ms cubic-bezier(0.23, 1, 0.32, 1) forwards;
  animation-delay: calc(var(--index, 0) * 40ms);
  transition:
    transform 160ms cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 160ms cubic-bezier(0.23, 1, 0.32, 1);
  will-change: transform, opacity;
}
.guideline-card:active {
  transform: scale(0.97);
}
.guideline-card__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: rgba(13, 71, 161, 0.08);
  flex-shrink: 0;
}
.guideline-card__text {
  margin: 0;
  line-height: 1.55;
}
@keyframes guideline-card-in {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
@media (hover: hover) and (pointer: fine) {
  .guideline-card:hover {
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .guideline-card {
    animation: none;
    opacity: 1;
    transform: none;
    transition: none;
  }
  .guideline-card:active,
  .guideline-card:hover {
    transform: none;
  }
}
</style>
