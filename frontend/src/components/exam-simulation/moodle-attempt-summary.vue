<template>
  <section class="attempt-summary" aria-labelledby="attempt-summary-title">
    <h1 class="attempt-summary__course-title">แบบทดสอบ</h1>
    <h2 id="attempt-summary-title" class="attempt-summary__title">Summary of attempt</h2>

    <table class="attempt-summary-table">
      <thead>
        <tr>
          <th scope="col">Question</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="question in questions" :key="question.number">
          <td>{{ question.number }}</td>
          <td>{{ question.answered ? 'Answer saved' : 'Not yet answered' }}</td>
        </tr>
      </tbody>
    </table>

    <div class="attempt-summary__actions">
      <q-btn
        unelevated
        no-caps
        label="Return to attempt"
        class="attempt-summary__return-btn"
        @click="emitReturnAttempt"
      />
      <q-btn
        unelevated
        no-caps
        label="Submit all and finish"
        color="primary"
        class="attempt-summary__submit-btn"
        @click="openSubmitDialog"
      />
    </div>

    <q-dialog v-model="isSubmitDialogOpen">
      <q-card class="submit-confirm-dialog">
        <div class="submit-confirm-dialog__header">
          <div id="submit-confirm-dialog-title" class="submit-confirm-dialog__title">
            Submit all your answers and finish?
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            color="grey-7"
            aria-label="Close dialog"
            @click="closeSubmitDialog"
          />
        </div>

        <div id="submit-confirm-dialog-description" class="submit-confirm-dialog__body">
          Once you submit your answers, you won’t be able to change them.
        </div>

        <div class="submit-confirm-dialog__actions">
          <q-btn
            unelevated
            no-caps
            label="Cancel"
            class="submit-confirm-dialog__cancel-btn"
            @click="closeSubmitDialog"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Submit all and finish"
            class="submit-confirm-dialog__submit-btn"
            @click="emitSubmitFinish"
          />
        </div>
      </q-card>
    </q-dialog>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface SummaryQuestion {
  number: number;
  answered: boolean;
}

interface Props {
  questions: SummaryQuestion[];
}

defineProps<Props>();

const emit = defineEmits<{
  returnAttempt: [];
  submitFinish: [];
}>();

const isSubmitDialogOpen = ref<boolean>(false);

const openSubmitDialog = (): void => {
  isSubmitDialogOpen.value = true;
};

const closeSubmitDialog = (): void => {
  isSubmitDialogOpen.value = false;
};

const emitReturnAttempt = (): void => {
  emit('returnAttempt');
};

const emitSubmitFinish = (): void => {
  isSubmitDialogOpen.value = false;
  emit('submitFinish');
};
</script>

<style scoped lang="scss">
.attempt-summary {
  color: #111111;
  margin-top: 23px;
  max-width: 637px;
  width: 100%;

  &__course-title {
    font-size: 1.5rem;
    font-weight: 700;
    line-height: 1.18;
    margin: 0;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 400;
    line-height: 1.18;
    margin: 2px 0 12px;
  }

  &__actions {
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 21px;
  }

  &__return-btn,
  &__submit-btn {
    border-radius: 7px;
    font-size: 16px !important;
    font-weight: 700;
    min-height: 45px;
    padding: 8px 24px;
    white-space: nowrap;
    width: 220px;
  }

  &__return-btn {
    background-color: #cbd2da !important;
    color: #111111 !important;
  }
}

.attempt-summary-table {
  border-collapse: collapse;
  border-top: 1px solid #b7b7b7;
  color: #222222;
  font-size: 16px;
  width: 100%;

  th,
  td {
    height: 45px;
    padding: 0 14px;
    text-align: left;
    vertical-align: middle;
  }

  th {
    border-bottom: 1px solid #b7b7b7;
    color: #111111;
    font-weight: 700;
  }

  tbody {
    border-bottom: 1px solid #d8d8d8;
  }

  tbody tr {
    border-bottom: 1px solid #d8d8d8;

    &:nth-child(odd) {
      background-color: #eeeeee;
    }
  }

  tbody tr:last-child {
    border-bottom: 0;
  }

  th:first-child,
  td:first-child {
    width: 35%;
  }

  td:first-child {
    padding-left: 22px;
  }
}

.submit-confirm-dialog {
  border-radius: 6px;
  max-width: calc(100vw - 32px);
  width: 562px;

  &__header {
    align-items: center;
    border-bottom: 1px solid #c6c6c6;
    display: flex;
    justify-content: space-between;
    min-height: 71px;
    padding: 0 20px 0 28px;
  }

  &__title {
    color: #000000;
    font-size: 22px;
    font-weight: 400;
    line-height: 1.25;
  }

  &__body {
    color: #000000;
    font-size: 22px;
    line-height: 1.32;
    min-height: 153px;
    padding: 42px 28px 24px;
  }

  &__actions {
    align-items: center;
    border-top: 1px solid #d6d6d6;
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    min-height: 72px;
    padding: 12px 17px;
  }

  &__cancel-btn,
  &__submit-btn {
    border-radius: 7px;
    font-size: 20px !important;
    font-weight: 700;
    min-height: 44px;
    padding: 6px 20px;
  }

  &__cancel-btn {
    background-color: #e2e2e2 !important;
    color: #000000 !important;
    min-width: 113px;
  }
}

@media (max-width: 640px) {
  .attempt-summary {
    max-width: none;

    &__course-title,
    &__title {
      font-size: 1.35rem;
    }
  }

  .attempt-summary-table {
    font-size: 15px;
  }

  .submit-confirm-dialog {
    &__title,
    &__body {
      font-size: 18px;
    }

    &__actions {
      align-items: stretch;
      flex-direction: column;
    }

    &__cancel-btn,
    &__submit-btn {
      width: 100%;
    }
  }
}
</style>
