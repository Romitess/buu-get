<template>
  <div
    class="moodle-test-samulation"
    :class="{ 'moodle-test-samulation--nav-closed': !isQuizNavigationOpen }"
  >
    <div class="attempt-left-column">
      <div class="attempt-breadcrumb">
        <span class="attempt-breadcrumb__link">SSSS</span>
        <span class="attempt-breadcrumb__separator">/</span>
        <span class="attempt-breadcrumb__link">แบบทดสอบ</span>
        <span class="attempt-breadcrumb__separator">/</span>
        <span>แบบทดสอบ</span>
      </div>

      <div class="attempt-title-row">
        <q-icon name="assignment" size="28px" class="attempt-title-row__icon" />
        <h2 class="attempt-title-row__title">แบบทดสอบ</h2>
      </div>

      <main class="attempt-main" aria-label="Quiz attempt">
        <AppButton
          label="Back"
          color="grey-4"
          text-color="black"
          size="sm"
          class="attempt-back-btn"
          @click="emitBack"
        />

        <div class="attempt-question-row">
          <aside class="question-status" aria-label="Question status">
            <div class="question-status__title">Question 1</div>
            <div class="question-status__text">Not yet answered</div>
            <div class="question-status__text">Marked out of 2.00</div>
            <button type="button" class="question-status__flag">
              <q-icon name="outlined_flag" size="16px" />
              <span>Flag question</span>
            </button>
          </aside>

          <section class="question-card" aria-labelledby="moodle-question-one">
            <p id="moodle-question-one" class="question-card__prompt">
              Can you ______ out how to answer these mathematical questions?
            </p>

            <div class="question-card__choices">
              <label v-for="choice in quizChoices" :key="choice.value" class="question-choice">
                <input
                  v-model="selectedAnswer"
                  type="radio"
                  name="moodle-samulation-answer"
                  :value="choice.value"
                />
                <span>{{ choice.label }}</span>
              </label>
            </div>
          </section>
        </div>

        <div class="attempt-next-row">
          <q-btn
            color="primary"
            label="Next Page"
            no-caps
            unelevated
            size="sm"
            class="attempt-next-btn"
          />
        </div>

        <div class="attempt-preview-answer">a. It eliminates the need for studying.</div>
      </main>
    </div>

    <aside
      class="quiz-navigation-panel"
      :class="{ 'quiz-navigation-panel--closed': !isQuizNavigationOpen }"
      aria-label="Quiz navigation panel"
    >
      <AppButton
        flat
        round
        icon="menu"
        color="grey-9"
        size="sm"
        class="quiz-navigation-toggle"
        :aria-controls="quizNavigationId"
        :aria-expanded="isQuizNavigationOpen"
        :aria-label="isQuizNavigationOpen ? 'Hide quiz navigation' : 'Show quiz navigation'"
        @click="toggleQuizNavigation"
      />

      <section
        v-show="isQuizNavigationOpen"
        :id="quizNavigationId"
        class="quiz-navigation-card"
        aria-label="Quiz navigation"
      >
        <div class="quiz-navigation-card__title">Quiz navigation</div>
        <div class="quiz-navigation-card__pages" role="list">
          <button
            v-for="page in quizPages"
            :key="page"
            type="button"
            class="quiz-navigation-card__page"
            :class="{ 'quiz-navigation-card__page--active': page === 1 }"
            :aria-current="page === 1 ? 'step' : undefined"
          >
            {{ page }}
          </button>
        </div>
        <button type="button" class="quiz-navigation-card__finish">Finish attempt ...</button>
      </section>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AppButton from 'src/components/base/app-button.vue';

interface QuizChoice {
  label: string;
  value: string;
}

const emit = defineEmits<{
  back: [];
}>();

const quizChoices: QuizChoice[] = [
  { label: 'a. value', value: 'value' },
  { label: 'b. model', value: 'model' },
  { label: 'c. specify', value: 'specify' },
  { label: 'd. figure', value: 'figure' },
];

const quizPages = [1, 2, 3, 4, 5];
const quizNavigationId = 'moodle-quiz-navigation';
const isQuizNavigationOpen = ref<boolean>(true);
const selectedAnswer = ref<string>('');

const emitBack = (): void => {
  emit('back');
};

const toggleQuizNavigation = (): void => {
  isQuizNavigationOpen.value = !isQuizNavigationOpen.value;
};
</script>

<style scoped lang="scss">
.moodle-test-samulation {
  --attempt-content-width: 780px;
  --attempt-question-gap: 22px;
  --attempt-status-width: 150px;
  --quiz-navigation-collapsed-width: 40px;
  --quiz-navigation-column-width: 280px;

  box-sizing: border-box;
  color: #1f2933;
  column-gap: 32px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--quiz-navigation-column-width);
  align-items: start;
  min-height: 100%;
  padding: 0;
  width: 100%;
}

.moodle-test-samulation--nav-closed {
  grid-template-columns: minmax(0, 1fr) var(--quiz-navigation-collapsed-width);
}

.attempt-breadcrumb {
  color: #4b5563;
  font-size: 0.82rem;
  line-height: 1.2;
  margin-bottom: 26px;

  &__link {
    color: var(--q-primary);
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  &__separator {
    color: #9ca3af;
    margin: 0 4px;
  }
}

.attempt-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;

  &__icon {
    color: #1f2933;
  }

  &__title {
    color: #111827;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.15;
    margin: 0;
  }
}

.attempt-left-column {
  justify-self: center;
  max-width: var(--attempt-content-width);
  min-width: 0;
  width: 100%;
}

.attempt-main {
  min-width: 0;
}

.attempt-back-btn {
  border-radius: 6px;
  font-size: 0.95rem !important;
  font-weight: 700;
  min-height: 46px;
  padding: 8px 20px !important;
}

.attempt-question-row {
  display: grid;
  grid-template-columns: var(--attempt-status-width) minmax(0, 1fr);
  gap: var(--attempt-question-gap);
  align-items: start;
  margin-top: 26px;
  max-width: calc(var(--attempt-status-width) + var(--attempt-question-gap) + 564px);
  width: 100%;
}

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
  }
}

.question-card {
  background-color: #ffffff;
  border: 1px solid #cfd6df;
  border-radius: 6px;
  min-height: 235px;
  padding: 24px 34px;

  &__prompt {
    color: #111827;
    font-size: 17px;
    line-height: 1.28;
    margin: 0 0 22px;
  }

  &__choices {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.question-choice {
  align-items: center;
  color: #111827;
  cursor: pointer;
  display: inline-flex;
  font-size: 16px;
  gap: 12px;
  line-height: 1;

  input {
    accent-color: #111827;
    cursor: pointer;
    height: 17px;
    margin: 0;
    width: 17px;
  }
}

.attempt-next-row {
  display: flex;
  justify-content: flex-end;
  margin-left: calc(var(--attempt-status-width) + var(--attempt-question-gap));
  margin-top: 29px;
  max-width: 564px;
  width: calc(100% - var(--attempt-status-width) - var(--attempt-question-gap));
}

.attempt-next-btn {
  border-radius: 6px;
  font-size: 16px !important;
  font-weight: 700;
  min-height: 50px;
  min-width: 156px;
  padding: 8px 26px;
}

.attempt-preview-answer {
  color: #111827;
  font-size: 1rem;
  line-height: 1.2;
  margin-top: 110px;
  text-align: center;
}

.quiz-navigation-panel {
  justify-self: end;
  min-height: 100%;
  position: relative;
  width: 100%;
}

.quiz-navigation-panel--closed {
  width: var(--quiz-navigation-collapsed-width);
}

.quiz-navigation-toggle {
  border-radius: 4px;
  height: 32px;
  min-height: 32px !important;
  min-width: 32px !important;
  padding: 0 !important;
  position: absolute;
  right: 0;
  top: -4px;
  width: 32px;
  z-index: 1;

  :deep(.q-icon) {
    font-size: 22px;
  }
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
  }

  &__finish {
    background: transparent;
    border: 0;
    color: #1e5fbf;
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
  .moodle-test-samulation {
    grid-template-columns: 1fr;
    row-gap: 24px;
  }

  .moodle-test-samulation--nav-closed {
    grid-template-columns: 1fr;
  }

  .quiz-navigation-panel {
    justify-self: end;
    max-width: var(--quiz-navigation-column-width);
  }

  .quiz-navigation-card {
    max-width: var(--quiz-navigation-column-width);
  }
}

@media (max-width: 640px) {
  .attempt-question-row {
    grid-template-columns: 1fr;
  }

  .question-status {
    max-width: 150px;
  }

  .attempt-next-row {
    margin-left: 0;
    max-width: none;
  }

  .attempt-preview-answer {
    margin-left: 0;
    margin-top: 64px;
  }
}
</style>
