<template>
  <article class="guideline-card" :style="{ '--index': String(index) }">
    <div class="guideline-card__icon-wrap">
      <q-icon :name="icon" color="primary" size="24px" />
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
.guideline-card__text {
  margin: 0;
  padding-top: 8px;
  line-height: 1.55;
  flex: 1 1 auto;
  min-width: 0;
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
