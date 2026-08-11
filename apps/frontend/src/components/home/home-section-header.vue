<template>
  <div class="home-section-header" :class="{ 'home-section-header--stacked': stackedOnMobile }">
    <div class="home-section-header__title-row row items-center">
      <div class="section-icon q-mr-sm">
        <q-icon :name="icon" color="white" size="18px" />
      </div>
      <div class="text-h6 text-weight-bolder text-dark home-section-header__title">
        {{ title }}
      </div>
    </div>

    <q-btn
      v-if="actionLabel"
      flat
      dense
      color="primary"
      class="text-weight-bold home-section-header__action"
      :label="actionLabel"
      :icon-right="actionIconRight"
      @click="emit('action')"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon: string;
  title: string;
  actionLabel?: string;
  actionIconRight?: string;
  stackedOnMobile?: boolean;
}

withDefaults(defineProps<Props>(), {
  actionLabel: '',
  actionIconRight: 'chevron_right',
  stackedOnMobile: true,
});

const emit = defineEmits<{
  (e: 'action'): void;
}>();
</script>

<style scoped lang="scss">
.home-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 0;

  @media (min-width: 1024px) {
    margin-bottom: 16px;
  }

  &--stacked {
    @media (max-width: 599px) {
      flex-direction: column;
      align-items: stretch;

      .home-section-header__title-row {
        width: 100%;
      }

      .home-section-header__action {
        align-self: flex-end;
        min-height: 44px;
      }
    }
  }
}

.section-icon {
  background: var(--q-primary);
  border-radius: 6px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  @media (min-width: 1024px) {
    border-radius: 4px;
    width: 28px;
    height: 28px;
  }
}

.home-section-header__title {
  line-height: 1.25;
}

@media (max-width: 599px) {
  .home-section-header__title {
    font-size: 1.05rem;
  }
}
</style>
