<template>
  <section class="attempt-finished" aria-labelledby="attempt-finished-title">
    <p class="attempt-finished__opened">Opened: Monday, 22 June 2026, 9:00 AM</p>

    <div v-if="isNoticeVisible" class="attempt-finished-notice" role="status">
      <span>You are not allowed to review this quiz</span>
      <button
        type="button"
        class="attempt-finished-notice__close"
        aria-label="Dismiss notice"
        @click="hideNotice"
      >
        <q-icon name="close" size="28px" />
      </button>
    </div>

    <p class="attempt-finished__allowed">Attempts allowed: 1</p>

    <h2 id="attempt-finished-title" class="attempt-finished__title">Your attempts</h2>

    <div class="attempt-finished-card">
      <div class="attempt-finished-card__header">Attempt</div>
      <dl class="attempt-finished-details">
        <div class="attempt-finished-details__row">
          <dt>Status</dt>
          <dd>Finished</dd>
        </div>
        <div class="attempt-finished-details__row">
          <dt>Started</dt>
          <dd>Tuesday, 23 June 2026, 3:29 PM</dd>
        </div>
        <div class="attempt-finished-details__row">
          <dt>Completed</dt>
          <dd>Tuesday, 23 June 2026, 3:38 PM</dd>
        </div>
        <div class="attempt-finished-details__row">
          <dt>Duration</dt>
          <dd>8 mins 46 secs</dd>
        </div>
      </dl>
      <div class="attempt-finished-card__footer">Review not permitted</div>
    </div>

    <p class="attempt-finished__no-more">No more attempts are allowed</p>

    <div class="attempt-finished__actions">
      <q-btn
        unelevated
        no-caps
        label="Back to the course"
        class="attempt-finished__back-btn"
        @click="emitBackCourse"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  backCourse: [];
}>();

const isNoticeVisible = ref<boolean>(true);

const hideNotice = (): void => {
  isNoticeVisible.value = false;
};

const emitBackCourse = (): void => {
  emit('backCourse');
};
</script>

<style scoped lang="scss">
.attempt-finished {
  color: #000000;
  max-width: var(--attempt-content-width, 736px);
  width: 100%;

  &__opened,
  &__allowed,
  &__no-more {
    font-size: 16px;
    line-height: 1.35;
    margin: 0;
  }

  &__opened {
    margin-bottom: 13px;
  }

  &__allowed {
    font-weight: 600;
    margin-top: 15px;
  }

  &__title {
    font-size: 1.35rem;
    font-weight: 500;
    line-height: 1.2;
    margin: 22px 0 13px;
  }

  &__no-more {
    margin-top: 23px;
  }

  &__actions {
    display: flex;
    justify-content: center;
    margin-top: 26px;
  }

  &__back-btn {
    background-color: #cbd2da !important;
    border-radius: 7px;
    color: #111111 !important;
    font-size: 15px !important;
    font-weight: 700;
    min-height: 45px;
    padding: 8px 24px;
    width: 190px;
  }
}

.attempt-finished-notice {
  align-items: center;
  background-color: #cfe4f8;
  border-radius: 7px;
  color: #000000;
  display: flex;
  font-size: 16px;
  justify-content: space-between;
  line-height: 1.35;
  min-height: 54px;
  padding: 10px 17px 10px 15px;

  &__close {
    align-items: center;
    background: transparent;
    border: 0;
    color: #333333;
    cursor: pointer;
    display: inline-flex;
    justify-content: center;
    margin-left: 16px;
    padding: 0;
  }
}

.attempt-finished-card {
  border: 1px solid #d8d8d8;
  border-radius: 7px;
  max-width: 501px;
  overflow: hidden;
  width: 100%;

  &__header {
    border-bottom: 1px solid #c7c7c7;
    font-size: 15px;
    font-weight: 700;
    min-height: 43px;
    padding: 13px 14px 9px;
  }

  &__footer {
    border-top: 1px solid #d8d8d8;
    color: #333333;
    font-size: 15px;
    min-height: 45px;
    padding: 13px 14px 9px;
  }
}

.attempt-finished-details {
  margin: 0;

  &__row {
    border-bottom: 1px solid #d8d8d8;
    display: grid;
    grid-template-columns: 181px minmax(0, 1fr);
    min-height: 45px;

    &:last-child {
      border-bottom: 0;
    }
  }

  dt,
  dd {
    align-items: center;
    display: flex;
    font-size: 15px;
    line-height: 1.25;
    margin: 0;
    padding: 10px 14px;
  }

  dt {
    background-color: #eeeeee;
    font-weight: 700;
    justify-content: flex-end;
    text-align: right;
  }

  dd {
    color: #333333;
  }
}

@media (max-width: 640px) {
  .attempt-finished {
    max-width: none;

    &__opened,
    &__allowed,
    &__no-more {
      font-size: 16px;
    }
  }

  .attempt-finished-card {
    max-width: none;
  }

  .attempt-finished-details {
    &__row {
      grid-template-columns: 128px minmax(0, 1fr);
    }

    dt,
    dd {
      font-size: 14px;
      padding: 10px 12px;
    }
  }
}
</style>
