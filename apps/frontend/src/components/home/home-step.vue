<template>
  <div class="home-step column">
    <div class="home-step__top row items-center no-wrap">
      <div class="home-step__number">{{ number }}</div>
      <div class="home-step__line col"></div>
    </div>
    <div class="home-step__content">
      <h4 class="home-step__title">{{ title }}</h4>
      <p class="home-step__description">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  number: string;
  title: string;
  description: string;
  isLast?: boolean;
}>();
</script>

<style scoped lang="scss">
.home-step {
  height: 100%;
  max-width: 220px;
  margin: 0 auto;
}

.home-step__top {
  margin-bottom: 16px;
}

.home-step__number {
  font-size: 2.125rem;
  font-weight: 700;
  color: var(--primary, #0d47a1);
  line-height: 1;
}

.home-step__line {
  height: 1px;
  margin-left: 20px;
  margin-right: 20px;
  background: #bdbdbd;
}

.home-step__title {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 700;
  color: #212121;
  line-height: 1.35;
}

.home-step__description {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #616161;
  font-weight: 400;
}

@media (max-width: 1023px) {
  .home-step {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 14px;
    max-width: none;
    margin: 0;
    padding: 14px 16px;
    background: #fff;
    border: 1px solid rgba(13, 71, 161, 0.1);
    border-radius: 14px;
  }

  .home-step__top {
    flex-shrink: 0;
    margin-bottom: 0;
  }

  .home-step__number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    font-size: 0.875rem;
    background: rgba(13, 71, 161, 0.08);
    border-radius: 50%;
  }

  .home-step__line {
    display: none;
  }

  .home-step__content {
    flex: 1;
    min-width: 0;
    padding-top: 2px;
  }

  .home-step__title {
    font-size: 0.9375rem;
  }

  .home-step__description {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: #546e7a;
  }
}
</style>
