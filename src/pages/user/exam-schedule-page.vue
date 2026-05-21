<template>
  <div class="page-container exam-schedule q-pa-lg">
    <AppBreadcrumbs />
    <AppPageHeader
      :title="t('examSchedule.registrationTitle')"
      :subtitle="t('examSchedule.registrationSubtitle')"
    />

    <ExamDetail
      :badge-text="examInfo.badgeText"
      :title="examInfo.title"
      :subtitle="examInfo.subtitle"
      :location-text="examInfo.locationText"
      :fee-text="examInfo.feeText"
    />

    <div class="exam-schedule__content row q-col-gutter-lg q-mt-sm">
      <div class="col-12 col-md-5">
        <ExamCalendar
          v-model="selectedDate"
          :availability="calendarAvailability"
          @change-month="onMonthChange"
          @main-card-resize="onCalendarResize"
        />
      </div>

      <div class="col-12 col-md-7">
        <q-card class="exam-schedule__rounds-section" :style="roundsSectionStyle">
          <q-card-section class="exam-schedule__rounds-header q-pa-none">
            <div class="exam-schedule__rounds-title-row">
              <q-icon name="calendar_today" size="20px" color="dark" class="q-mr-sm" />
              <h3 class="exam-schedule__rounds-title">
                {{ t('examSchedule.title') }} {{ t('examSchedule.dateLabel') }}
                {{ formattedSelectedDate }}
              </h3>
            </div>
            <p class="exam-schedule__rounds-subtitle text-grey-7">
              {{ t('examSchedule.subtitle') }}
            </p>
          </q-card-section>

          <div
            class="exam-schedule__rounds-list"
            :style="{
              overflowY: roundsListOverflow,
            }"
          >
            <template v-if="selectedDateRounds.length > 0">
              <RoundExam
                v-for="round in selectedDateRounds"
                :key="round.id"
                :title="round.title"
                :time-range="round.timeRange"
                :available-seats="round.availableSeats"
                :total-seats="round.totalSeats"
                :round-type-label="round.roundTypeLabel"
                :reg-start-date="round.regStartDate"
                :reg-end-date="round.regEndDate"
                :exam-date="round.examDate"
                @register="(isExpiredOrNotOpen) => handleRegister(round, isExpiredOrNotOpen)"
              />
            </template>

            <q-card-section v-else class="exam-schedule__rounds-empty text-center q-pa-xl">
              <q-icon name="event_busy" size="48px" color="grey-4" />
              <p class="text-grey-6 q-mt-md">{{ t('examSchedule.emptyRounds') }}</p>
            </q-card-section>
          </div>
        </q-card>
      </div>
    </div>

    <DialogConfirm
      v-model="showConfirmDialog"
      :exam-date="formattedSelectedDate"
      :exam-time="selectedRound?.timeRange || ''"
      @confirm="onConfirmRegistration"
    />

    <ExamPasscodeInputDialog ref="passcodeDialogRef" @confirm="onPasscodeConfirm" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import ExamDetail from 'src/components/exam-detail.vue';
import ExamCalendar from 'src/components/exam/exam-calendar.vue';
import RoundExam from 'src/components/exam/round-exam.vue';
import DialogConfirm from 'src/components/exam/dialog-confirm.vue';
import ExamPasscodeInputDialog from 'src/components/exam-passcode-input-dialog.vue';
import { useExamSchedule } from 'src/composables/use-exam-schedule';

const { t } = useI18n();

const {
  examInfo,
  selectedDate,
  selectedDateRounds,
  calendarAvailability,
  formattedSelectedDate,
  showConfirmDialog,
  passcodeDialogRef,
  selectedRound,
  roundsSectionStyle,
  roundsListOverflow,
  onCalendarResize,
  onMonthChange,
  handleRegister,
  onConfirmRegistration,
  onPasscodeConfirm,
} = useExamSchedule();
</script>
