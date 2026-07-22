<template>
  <article class="candidate-activity-card row no-wrap">
    <div class="activity-visual col-auto">
      <img
        :src="illustrationSrc"
        :alt="''"
        class="activity-illustration"
        width="120"
        height="120"
        loading="lazy"
      />
    </div>

    <div class="activity-body col column justify-between">
      <div>
        <div class="row items-center q-gutter-x-sm q-mb-xs">
          <AppStatusBadge :label="$t(activity.badgeLabelKey)" :type="activity.badgeType" />
          <span v-if="activity.fee !== undefined && activity.kind === 'unpaid'" class="fee-text">
            {{ activity.fee.toLocaleString() }} ฿
          </span>
        </div>

        <h3 class="activity-title q-my-none">{{ activity.title }}</h3>

        <div
          v-if="activity.kind === 'unpaid' && displayDeadline"
          class="deadline-text row items-center q-mt-xs"
        >
          <q-icon name="warning_amber" size="18px" class="q-mr-xs" />
          {{ $t('home.candidateActivity.paymentDeadline') }} {{ displayDeadline }}
        </div>

        <div class="meta-row row items-center q-gutter-x-md q-mt-sm">
          <div class="meta-item row items-center">
            <q-icon name="event" size="18px" class="q-mr-xs" />
            {{ activity.date }}
          </div>
          <div class="meta-item row items-center">
            <q-icon name="schedule" size="18px" class="q-mr-xs" />
            {{ activity.time }}
          </div>
          <div class="meta-item row items-center">
            <q-icon name="place" size="18px" class="q-mr-xs" />
            {{ activity.location }}
          </div>
          <div v-if="activity.seatLabel" class="meta-item row items-center">
            <q-icon name="event_seat" size="18px" class="q-mr-xs" />
            {{ $t('home.candidateActivity.seat') }} {{ activity.seatLabel }}
          </div>
        </div>
      </div>

      <div class="q-mt-md">
        <AppButton
          :label="$t(activity.ctaLabelKey)"
          :icon="ctaIcon"
          class="cta-btn"
          @click="emit('action', activity)"
        />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppStatusBadge from 'src/components/base/app-status-badge.vue';
import AppButton from 'src/components/base/app-button.vue';
import { useCountdown } from 'src/composables/use-countdown';
import type { CandidateHomeActivity } from 'src/composables/use-candidate-home-activities';
import payIllustration from 'src/assets/img/activity/pay.svg';
import examDayIllustration from 'src/assets/img/activity/exam-day.svg';
import seatReadyIllustration from 'src/assets/img/activity/seat-ready.svg';

const ILLUSTRATIONS = {
  unpaid: payIllustration,
  upcoming: examDayIllustration,
  seatReady: seatReadyIllustration,
} as const;

const CTA_ICONS = {
  unpaid: 'payments',
  upcoming: 'arrow_forward',
  seatReady: 'badge',
} as const;

interface Props {
  activity: CandidateHomeActivity;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'action', activity: CandidateHomeActivity): void;
  (e: 'timeout'): void;
}>();

const deadline = computed(() => props.activity.deadline);
const { displayDeadline } = useCountdown(deadline, () => emit('timeout'));

const illustrationSrc = computed(() => ILLUSTRATIONS[props.activity.imageKey]);
const ctaIcon = computed(() => CTA_ICONS[props.activity.kind]);
</script>

<style scoped lang="scss">
.candidate-activity-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(13, 71, 161, 0.12);
  box-shadow: 0 8px 16px -6px rgba(13, 71, 161, 0.18);
  overflow: hidden;
  min-height: 148px;
  transition:
    transform 200ms cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 200ms cubic-bezier(0.23, 1, 0.32, 1);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 20px -6px rgba(13, 71, 161, 0.28);
  }
}

.activity-visual {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: linear-gradient(160deg, #e8f1fb 0%, #f7fbff 100%);
  width: 140px;
  flex-shrink: 0;
}

.activity-illustration {
  width: 112px;
  height: 112px;
  object-fit: contain;
  display: block;
}

.activity-body {
  padding: 16px 18px 16px 8px;
  min-width: 0;
}

.activity-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--primary-dark, #0a3578);
  line-height: 1.35;
}

.fee-text {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--primary);
}

.deadline-text {
  color: #e65100;
  font-size: 0.8rem;
  font-weight: 600;
}

.meta-row {
  flex-wrap: wrap;
  row-gap: 6px;
}

.meta-item {
  color: #546e7a;
  font-size: 0.85rem;
}

.cta-btn {
  min-width: 140px;
}

@media (max-width: 599px) {
  .candidate-activity-card {
    flex-direction: column;
  }

  .activity-visual {
    width: 100%;
    padding: 16px;
  }

  .activity-body {
    padding: 12px 16px 16px;
  }
}
</style>
