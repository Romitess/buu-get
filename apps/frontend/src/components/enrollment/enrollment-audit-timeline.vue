<template>
  <section class="enrollment-audit-timeline">
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn
        v-for="option in categoryOptions"
        :key="option.value"
        dense
        unelevated
        :outline="modelCategory !== option.value"
        :color="modelCategory === option.value ? 'primary' : 'grey-7'"
        :label="option.label"
        @click="modelCategory = option.value"
      />
    </div>

    <q-banner v-if="hint" dense class="bg-grey-2 text-grey-8 q-mb-md rounded-borders">
      {{ hint }}
    </q-banner>

    <div v-if="loading" class="text-center q-pa-lg">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else-if="filteredEvents.length === 0" class="text-center text-grey-7 q-pa-lg">
      {{ emptyLabel }}
    </div>

    <q-timeline v-else color="primary" class="audit-timeline">
      <q-timeline-entry
        v-for="event in filteredEvents"
        :key="event.id"
        :title="eventTitle(event)"
        :subtitle="formatOccurredAt(event.occurredAt)"
        :icon="eventIcon(event.category)"
      >
        <div class="text-body2">{{ event.message || '—' }}</div>
        <div v-if="statusTransition(event)" class="text-caption text-grey-7 q-mt-xs">
          {{ statusTransition(event) }}
        </div>
        <ul
          v-if="detailLines(event).length > 0"
          class="audit-detail-lines text-caption text-grey-8 q-mt-xs q-mb-none"
        >
          <li v-for="(line, idx) in detailLines(event)" :key="`${event.id}-${idx}`">
            <span class="text-weight-medium">{{ line.label }}:</span> {{ line.value }}
          </li>
        </ul>
        <div class="text-caption text-grey-7 q-mt-xs">
          {{ actorLabel(event) }} · {{ sourceLabel(event.source) }}
        </div>
      </q-timeline-entry>
    </q-timeline>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { date } from 'quasar';
import type { EnrollmentAuditEvent } from 'src/types/enrollment-audit.types';
import {
  buildAuditEventDetailLines,
  formatAuditStatusTransition,
} from 'src/utils/enrollment-audit-labels';

const props = withDefaults(
  defineProps<{
    events: EnrollmentAuditEvent[];
    loading?: boolean;
    hint?: string;
    emptyLabel?: string;
  }>(),
  {
    loading: false,
    hint: '',
    emptyLabel: '',
  },
);

const { t } = useI18n();
const modelCategory = ref<string>('all');

const categoryOptions = computed(() => [
  { value: 'all', label: t('admin.applicantAudit.categories.all') },
  { value: 'enrollment', label: t('admin.applicantAudit.categories.enrollment') },
  { value: 'payment', label: t('admin.applicantAudit.categories.payment') },
  { value: 'profile', label: t('admin.applicantAudit.categories.profile') },
  { value: 'passcode', label: t('admin.applicantAudit.categories.passcode') },
  { value: 'system', label: t('admin.applicantAudit.categories.system') },
]);

const filteredEvents = computed(() => {
  if (modelCategory.value === 'all') return props.events;
  return props.events.filter((event) => event.category === modelCategory.value);
});

watch(
  () => props.events,
  () => {
    // keep selected filter when refreshing
  },
);

const formatOccurredAt = (iso: string): string =>
  date.formatDate(iso, 'DD/MM/YYYY HH:mm:ss') || iso;

const eventTitle = (event: EnrollmentAuditEvent): string => {
  const key = `admin.applicantAudit.eventTypes.${event.eventType}`;
  const translated = t(key);
  return translated === key ? event.eventType : translated;
};

const statusTransition = (event: EnrollmentAuditEvent): string =>
  formatAuditStatusTransition(event, t);

const detailLines = (event: EnrollmentAuditEvent) =>
  buildAuditEventDetailLines(event, t, { formatDateTime: formatOccurredAt });

const actorLabel = (event: EnrollmentAuditEvent): string => {
  const typeKey = `admin.applicantAudit.actors.${event.actor.type}`;
  const typeLabel = t(typeKey) === typeKey ? event.actor.type : t(typeKey);
  return event.actor.name ? `${typeLabel}: ${event.actor.name}` : typeLabel;
};

const sourceLabel = (source: string): string => {
  const key = `admin.applicantAudit.sources.${source}`;
  const translated = t(key);
  return translated === key ? source : translated;
};

const eventIcon = (category: string): string => {
  switch (category) {
    case 'payment':
      return 'payments';
    case 'profile':
      return 'person';
    case 'passcode':
      return 'vpn_key';
    case 'system':
      return 'settings';
    default:
      return 'history';
  }
};
</script>

<style scoped lang="scss">
.enrollment-audit-timeline {
  min-width: 0;
}

.audit-timeline {
  padding-left: 4px;
}

.audit-detail-lines {
  padding-left: 1.1rem;
  list-style: disc;
}
</style>
