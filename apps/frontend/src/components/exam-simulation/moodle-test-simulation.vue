<template>
  <div
    class="moodle-test-samulation"
    :class="{
      'moodle-test-samulation--nav-closed': !isQuizNavigationOpen && !isFinishedView,
      'moodle-test-samulation--finished': isFinishedView,
      'moodle-test-samulation--summary': isSummaryView,
    }"
  >
    <div
      class="attempt-left-column"
      :class="{
        'attempt-left-column--finished': isFinishedView,
        'attempt-left-column--summary': isSummaryView,
      }"
    >
      <div class="attempt-breadcrumb">
        <span class="attempt-breadcrumb__link">SSSS</span>
        <span class="attempt-breadcrumb__separator">/</span>
        <button type="button" class="attempt-breadcrumb__link" @click="emitCourse">
          วันที่ 22 มิถุนายน 2569 (รอบสอบ 9.00)
        </button>
        <span class="attempt-breadcrumb__separator">/</span>
        <span>แบบทดสอบ</span>
      </div>

      <div class="attempt-title-row">
        <q-icon name="assignment" size="28px" class="attempt-title-row__icon" />
        <h2 class="attempt-title-row__title">แบบทดสอบ</h2>
      </div>

      <AppButton
        v-if="!isFinishedView"
        data-tour="attempt-back"
        label="Back"
        color="grey-4"
        text-color="black"
        size="sm"
        class="attempt-back-btn"
        @click="emitBack"
      />

      <MoodleAttemptSummary
        v-if="isSummaryView"
        :questions="summaryQuestions"
        @return-attempt="returnToAttempt"
        @submit-finish="submitAllAndFinish"
      />

      <MoodleAttemptFinished
        v-else-if="isFinishedView"
        class="attempt-finished-panel"
        @back-course="emitCourse"
      />

      <template v-else>
        <main class="attempt-main" aria-label="Quiz attempt">
          <div class="attempt-question-row">
            <MoodleQuestionStatus
              :question-number="currentQuestion.number"
              :answered="isCurrentQuestionAnswered"
              :marked-out-of="currentQuestion.markedOutOf"
              :flagged="isCurrentQuestionFlagged"
              @toggle-flag="toggleCurrentQuestionFlag"
            />

            <div data-tour="question-answer">
              <MoodleQuestionCard v-model="currentAnswer" :question="currentQuestion" />
            </div>
          </div>

          <div class="attempt-page-actions" :class="{ 'attempt-page-actions--first': isFirstPage }">
            <q-btn
              v-if="!isFirstPage"
              color="grey-4"
              text-color="black"
              label="Previous Page"
              no-caps
              unelevated
              size="sm"
              class="attempt-page-btn attempt-page-btn--previous"
              @click="goToPreviousQuestion"
            />
            <q-btn
              v-if="!isLastPage"
              data-tour="next-page"
              color="primary"
              label="Next Page"
              no-caps
              unelevated
              size="sm"
              class="attempt-page-btn attempt-page-btn--next"
              @click="goToNextQuestion"
            />
            <q-btn
              v-else
              color="primary"
              label="Finish attempt"
              no-caps
              unelevated
              size="sm"
              :disable="!areAllQuestionsAnswered"
              class="attempt-page-btn attempt-page-btn--next"
              @click="finishAttempt"
            />
          </div>

          <div v-if="currentQuestion.previewAnswer" class="attempt-preview-answer">
            {{ currentQuestion.previewAnswer }}
          </div>
        </main>
      </template>
    </div>

    <q-btn
      round
      color="grey-5"
      text-color="white"
      icon="question_mark"
      class="attempt-help-btn shadow-0"
      size="sm"
      :aria-label="restartTourLabel"
      @click="emit('restart-tour')"
    />

    <MoodleQuizNavigation
      v-if="!isFinishedView"
      v-model:open="isQuizNavigationOpen"
      :pages="quizPages"
      :active-page="currentQuestion.number"
      :answered-pages="answeredPages"
      @select-page="selectQuestionFromNavigation"
      @finish="finishAttempt"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import AppButton from 'src/components/base/app-button.vue';
import MoodleAttemptFinished from 'src/components/exam-simulation/moodle-attempt-finished.vue';
import MoodleAttemptSummary from 'src/components/exam-simulation/moodle-attempt-summary.vue';
import MoodleQuestionCard from 'src/components/exam-simulation/moodle-question-card.vue';
import MoodleQuestionStatus from 'src/components/exam-simulation/moodle-question-status.vue';
import MoodleQuizNavigation from 'src/components/exam-simulation/moodle-quiz-navigation.vue';

interface QuizChoice {
  label: string;
  value: string;
}

interface QuizQuestion {
  id: number;
  number: number;
  prompt: string;
  choices: QuizChoice[];
  markedOutOf: string;
  previewAnswer?: string;
}

interface SummaryQuestion {
  number: number;
  answered: boolean;
}

const emit = defineEmits<{
  back: [];
  course: [];
  finish: [];
  'attempt-ready': [];
  'restart-tour': [];
}>();

const { t } = useI18n();

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    number: 1,
    prompt: 'Can you ______ out how to answer these mathematical questions?',
    choices: [
      { label: 'a. value', value: 'value' },
      { label: 'b. model', value: 'model' },
      { label: 'c. specify', value: 'specify' },
      { label: 'd. figure', value: 'figure' },
    ],
    markedOutOf: '2.00',
  },
  {
    id: 2,
    number: 2,
    prompt:
      'All international firms have clearly defined policies to ______ employees who violate company rules.',
    choices: [
      { label: 'a. ensure', value: 'ensure' },
      { label: 'b. discipline', value: 'discipline' },
      { label: 'c. combine', value: 'combine' },
      { label: 'd. extend', value: 'extend' },
    ],
    markedOutOf: '2.00',
  },
  {
    id: 3,
    number: 3,
    prompt: 'My professor ______ me that she had worked here for twenty years.',
    choices: [
      { label: 'a. said', value: 'said' },
      { label: 'b. told', value: 'told' },
      { label: 'c. talked', value: 'talked' },
      { label: 'd. spoke', value: 'spoke' },
    ],
    markedOutOf: '2.00',
  },
  {
    id: 4,
    number: 4,
    prompt:
      'Experts assumed that, after the end of this year, English ______ in Thailand for more than sixty-five years.',
    choices: [
      { label: 'a. will be teaching', value: 'will-be-teaching' },
      { label: 'b. will have taught', value: 'will-have-taught' },
      { label: 'c. will have been taught', value: 'will-have-been-taught' },
      { label: 'd. will have been teaching', value: 'will-have-been-teaching' },
    ],
    markedOutOf: '2.00',
  },
  {
    id: 5,
    number: 5,
    prompt: 'Which of the following is an example of the AI',
    choices: [
      { label: 'a. Calculator', value: 'calculator' },
      { label: 'b. Virtual Assistant (e.g Siri or Google Assistant)', value: 'virtual-assistant' },
      { label: 'c. Keyboard', value: 'keyboard' },
      { label: 'd. flash drive', value: 'flash-drive' },
    ],
    markedOutOf: '2.00',
  },
];

const quizPages = quizQuestions.map((question) => question.number);
const returnToAttemptQuestionNumber = 5;
const isQuizNavigationOpen = ref<boolean>(true);
const isFinishedView = ref<boolean>(false);
const isSummaryView = ref<boolean>(false);
const currentQuestionIndex = ref<number>(0);
const answers = ref<Record<number, string>>({});
const flaggedQuestionIds = ref<number[]>([]);
const firstQuestion = quizQuestions[0] as QuizQuestion;

const currentQuestion = computed<QuizQuestion>(
  () => quizQuestions[currentQuestionIndex.value] ?? firstQuestion,
);

const currentAnswer = computed<string>({
  get: () => answers.value[currentQuestion.value.id] ?? '',
  set: (value: string): void => {
    answers.value = {
      ...answers.value,
      [currentQuestion.value.id]: value,
    };
  },
});

const isFirstPage = computed<boolean>(() => currentQuestionIndex.value === 0);
const isLastPage = computed<boolean>(() => currentQuestionIndex.value === quizQuestions.length - 1);
const isCurrentQuestionAnswered = computed<boolean>(() =>
  Boolean(answers.value[currentQuestion.value.id]),
);
const isCurrentQuestionFlagged = computed<boolean>(() =>
  flaggedQuestionIds.value.includes(currentQuestion.value.id),
);
const answeredPages = computed<number[]>(() =>
  quizQuestions
    .filter((question) => Boolean(answers.value[question.id]))
    .map((question) => question.number),
);
const summaryQuestions = computed<SummaryQuestion[]>(() =>
  quizQuestions.map((question) => ({
    number: question.number,
    answered: Boolean(answers.value[question.id]),
  })),
);
const areAllQuestionsAnswered = computed<boolean>(() =>
  quizQuestions.every((question) => Boolean(answers.value[question.id])),
);

const emitBack = (): void => {
  emit('back');
};

const emitCourse = (): void => {
  emit('course');
};

const goToQuestion = (page: number): void => {
  const questionIndex = quizQuestions.findIndex((question) => question.number === page);
  if (questionIndex !== -1) {
    currentQuestionIndex.value = questionIndex;
  }
};

const selectQuestionFromNavigation = (page: number): void => {
  goToQuestion(page);
  isSummaryView.value = false;
};

const goToPreviousQuestion = (): void => {
  if (!isFirstPage.value) {
    currentQuestionIndex.value -= 1;
  }
};

const goToNextQuestion = (): void => {
  if (!isLastPage.value) {
    currentQuestionIndex.value += 1;
  }
};

const toggleCurrentQuestionFlag = (): void => {
  const questionId = currentQuestion.value.id;
  flaggedQuestionIds.value = flaggedQuestionIds.value.includes(questionId)
    ? flaggedQuestionIds.value.filter((flaggedQuestionId) => flaggedQuestionId !== questionId)
    : [...flaggedQuestionIds.value, questionId];
};

const finishAttempt = (): void => {
  if (!areAllQuestionsAnswered.value) {
    return;
  }

  isFinishedView.value = false;
  isSummaryView.value = true;
};

const returnToAttempt = (): void => {
  goToQuestion(returnToAttemptQuestionNumber);
  isFinishedView.value = false;
  isSummaryView.value = false;
};

const submitAllAndFinish = (): void => {
  isSummaryView.value = false;
  isFinishedView.value = true;
};

const restartTourLabel = computed(() => t('examSimulation.tour.restartLabel'));

onMounted(() => {
  emit('attempt-ready');
});
</script>

<style scoped lang="scss">
.moodle-test-samulation {
  --attempt-question-gap: 22px;
  --attempt-question-card-width: 564px;
  --attempt-question-row-width: calc(
    var(--attempt-status-width) + var(--attempt-question-gap) + var(--attempt-question-card-width)
  );
  --attempt-status-width: 150px;
  --attempt-content-width: var(--attempt-question-row-width);
  --attempt-summary-width: 637px;
  --quiz-navigation-collapsed-width: 48px;
  --quiz-navigation-column-width: 280px;
  --quiz-navigation-current-width: var(--quiz-navigation-column-width);
  --quiz-navigation-transition-duration: 0.25s;
  --quiz-navigation-transition-easing: ease;
  --attempt-help-button-right: calc(var(--quiz-navigation-current-width) + 24px);

  box-sizing: border-box;
  color: #1f2933;
  column-gap: 32px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--quiz-navigation-current-width);
  align-items: start;
  min-height: 100%;
  padding: 0;
  position: relative;
  transition: grid-template-columns var(--quiz-navigation-transition-duration)
    var(--quiz-navigation-transition-easing);
  will-change: grid-template-columns;
  width: 100%;
}

.moodle-test-samulation--nav-closed {
  --quiz-navigation-current-width: var(--quiz-navigation-collapsed-width);
}

.moodle-test-samulation--finished {
  --attempt-help-button-right: 24px;

  grid-template-columns: minmax(0, 1fr);
}

.attempt-breadcrumb {
  color: #4b5563;
  font-size: 0.82rem;
  line-height: 1.2;
  margin-bottom: 26px;

  &__link {
    background: transparent;
    border: 0;
    color: var(--q-primary);
    cursor: pointer;
    font: inherit;
    padding: 0;

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
  box-sizing: border-box;
  justify-self: center;
  max-width: var(--attempt-content-width);
  min-width: 0;
  padding-top: 40px;
  width: 100%;
}

.attempt-left-column--summary {
  max-width: var(--attempt-summary-width);
  padding-top: 40px;
  padding-bottom: 10px;
}

.attempt-left-column--finished {
  justify-self: center;
  max-width: var(--attempt-content-width);
  padding-top: 40px;
  padding-bottom: 10px;
}

.attempt-finished-panel {
  margin-top: 22px;
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
  max-width: var(--attempt-question-row-width);
  width: 100%;
}

.attempt-page-actions {
  display: grid;
  grid-template-columns: var(--attempt-status-width) minmax(0, 1fr);
  gap: var(--attempt-question-gap);
  margin-top: 29px;
  max-width: var(--attempt-question-row-width);
  width: 100%;

  &--first {
    display: flex;
    justify-content: flex-end;
    margin-left: calc(var(--attempt-status-width) + var(--attempt-question-gap));
    max-width: 564px;
    width: calc(100% - var(--attempt-status-width) - var(--attempt-question-gap));
  }
}

.attempt-page-btn {
  border-radius: 6px;
  font-size: 16px !important;
  font-weight: 700;
  min-height: 50px;
  min-width: 156px;
  padding: 8px 26px;

  &--previous {
    justify-self: start;
  }

  &--next {
    justify-self: end;
  }
}

.attempt-preview-answer {
  bottom: 30px;
  color: #111827;
  font-size: 1rem;
  line-height: 1.2;
  left: 0;
  margin-top: 0;
  position: absolute;
  right: calc(var(--quiz-navigation-current-width) + 32px);
  text-align: center;
  transition: right var(--quiz-navigation-transition-duration)
    var(--quiz-navigation-transition-easing);
}

.attempt-help-btn {
  bottom: 24px;
  position: absolute;
  right: var(--attempt-help-button-right);
  transition: right var(--quiz-navigation-transition-duration)
    var(--quiz-navigation-transition-easing);
  z-index: 2;
}

@media (max-width: 980px) {
  .moodle-test-samulation {
    grid-template-columns: 1fr;
    row-gap: 24px;
  }

  .moodle-test-samulation--nav-closed,
  .moodle-test-samulation--finished {
    grid-template-columns: 1fr;
  }

  .attempt-help-btn {
    bottom: 24px;
    right: 24px;
  }
}

@media (max-width: 640px) {
  .attempt-question-row {
    grid-template-columns: 1fr;
  }

  .question-status {
    max-width: 150px;
  }

  .attempt-left-column--summary {
    max-width: none;
  }

  .attempt-left-column--finished {
    max-width: none;
  }

  .attempt-page-actions,
  .attempt-page-actions--first {
    display: flex;
    gap: 12px;
    justify-content: space-between;
    margin-left: 0;
    max-width: none;
    width: 100%;
  }

  .attempt-preview-answer {
    bottom: 5px;
    left: 0;
    margin-left: 0;
    right: 0;
  }
}
</style>
