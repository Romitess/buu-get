<template>
  <section class="question-card" :aria-labelledby="questionTitleId">
    <p :id="questionTitleId" class="question-card__prompt">
      {{ question.prompt }}
    </p>

    <div class="question-card__choices">
      <label v-for="choice in question.choices" :key="choice.value" class="question-choice">
        <input v-model="selectedValue" type="radio" :name="radioGroupName" :value="choice.value" />
        <span>{{ choice.label }}</span>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface QuizChoice {
  label: string;
  value: string;
}

interface QuizQuestion {
  id: number;
  number: number;
  prompt: string;
  choices: QuizChoice[];
}

interface Props {
  modelValue?: string;
  question: QuizQuestion;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const selectedValue = computed<string>({
  get: () => props.modelValue,
  set: (value: string): void => {
    emit('update:modelValue', value);
  },
});

const questionTitleId = computed<string>(() => `moodle-question-${props.question.id}`);
const radioGroupName = computed<string>(() => `moodle-samulation-answer-${props.question.id}`);
</script>

<style scoped lang="scss">
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
</style>
