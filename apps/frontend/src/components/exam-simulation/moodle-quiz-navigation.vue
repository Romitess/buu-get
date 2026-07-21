<template>
  <aside
    class="moodle-quiz-navigation"
    :class="{ 'moodle-quiz-navigation--collapsed': !open }"
    aria-label="Quiz navigation panel"
  >
    <div class="quiz-navigation-toggle-row">
      <q-btn
        flat
        round
        dense
        icon="menu"
        color="grey-8"
        :aria-controls="navigationId"
        :aria-expanded="open"
        :aria-label="open ? 'Hide quiz navigation' : 'Show quiz navigation'"
        @click="toggleOpen"
      />
    </div>

    <div class="quiz-navigation-content" :aria-hidden="!open">
      <section
        :id="navigationId"
        class="quiz-navigation-card"
        data-tour="quiz-navigation"
        aria-label="Quiz navigation"
      >
        <div class="quiz-navigation-card__title">{{ title }}</div>
        <div class="quiz-navigation-card__pages" role="list">
          <button
            v-for="page in pages"
            :key="page"
            type="button"
            class="quiz-navigation-card__page"
            :class="{
              'quiz-navigation-card__page--active': page === activePage,
              'quiz-navigation-card__page--answered': isPageAnswered(page),
            }"
            :aria-current="page === activePage ? 'step' : undefined"
            :tabindex="open ? 0 : -1"
            @click="emitSelectPage(page)"
          >
            {{ page }}
          </button>
        </div>
        <button
          type="button"
          class="quiz-navigation-card__finish"
          :tabindex="open ? 0 : -1"
          @click="emitFinish"
        >
          {{ finishLabel }}
        </button>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
interface Props {
  open?: boolean;
  pages?: number[];
  answeredPages?: number[];
  activePage?: number;
  navigationId?: string;
  title?: string;
  finishLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  open: true,
  pages: () => [1, 2, 3, 4, 5],
  answeredPages: () => [],
  activePage: 1,
  navigationId: 'moodle-quiz-navigation',
  title: 'Quiz navigation',
  finishLabel: 'Finish attempt ...',
});

const emit = defineEmits<{
  'update:open': [value: boolean];
  selectPage: [page: number];
  finish: [];
}>();

const toggleOpen = (): void => {
  emit('update:open', !props.open);
};

const emitSelectPage = (page: number): void => {
  emit('selectPage', page);
};

const isPageAnswered = (page: number): boolean => props.answeredPages.includes(page);

const emitFinish = (): void => {
  emit('finish');
};
</script>

<style scoped lang="scss">
.moodle-quiz-navigation {
  background-color: #f8f9fa;
  box-sizing: border-box;
  flex-shrink: 0;
  min-height: 100%;
  min-width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  transition: background-color var(--quiz-navigation-transition-duration, 0.25s)
    var(--quiz-navigation-transition-easing, ease);
  width: 100%;
}

.moodle-quiz-navigation--collapsed {
  background-color: #ffffff;

  .quiz-navigation-content {
    opacity: 0;
    pointer-events: none;
    transition-delay: 0s;
  }
}

.quiz-navigation-toggle-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 8px 4px;
}

.quiz-navigation-content {
  opacity: 1;
  padding: 8px 20px 0;
  transition: opacity 0.15s ease 0.08s;
  white-space: nowrap;
}

.quiz-navigation-card {
  background-color: #ffffff;
  border: 1px solid #cfd6df;
  border-radius: 6px;
  box-sizing: border-box;
  padding: 20px 16px 18px;
  width: 100%;

  &__title {
    color: #111827;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.2;
    margin-bottom: 16px;
  }

  &__pages {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
  }

  &__page {
    background-color: #ffffff;
    border: 1px solid #b8c1d1;
    border-radius: 5px;
    color: #111827;
    cursor: pointer;
    font-family: inherit;
    font-size: 1rem;
    height: 42px;
    line-height: 1;
    padding: 0;
    width: 30px;

    &--active {
      background-color: #eff6ff;
      border-color: var(--q-primary);
      color: var(--q-primary);
      font-weight: 700;
    }

    &--answered {
      background-color: var(--q-secondary);
      border-color: var(--q-secondary);
      color: #ffffff;
      font-weight: 700;
    }
  }

  &__finish {
    background: transparent;
    border: 0;
    color: var(--q-primary);
    cursor: pointer;
    font-family: inherit;
    font-size: 0.95rem;
    padding: 0;
    text-align: left;

    &:hover {
      text-decoration: underline;
    }
  }
}

@media (max-width: 980px) {
  .moodle-quiz-navigation {
    justify-self: end;
    max-width: var(--quiz-navigation-column-width, 280px);
    transition:
      max-width var(--quiz-navigation-transition-duration, 0.25s)
        var(--quiz-navigation-transition-easing, ease),
      background-color var(--quiz-navigation-transition-duration, 0.25s)
        var(--quiz-navigation-transition-easing, ease);
  }

  .moodle-quiz-navigation--collapsed {
    max-width: var(--quiz-navigation-collapsed-width, 48px);
  }
}
</style>
