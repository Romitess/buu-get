<template>
  <q-card flat bordered class="rule-card row no-wrap items-center">
    <q-icon
      name="drag_indicator"
      size="22px"
      color="grey-8"
      class="rule-card__handle"
    />

    <div ref="iconBlockRef" class="rule-card__icon row flex-center cursor-pointer">
      <q-icon :name="iconValue || 'rule'" size="22px" />
      <q-menu
        v-model="isMenuOpen"
        anchor="bottom middle"
        self="top middle"
        class="icon-picker-menu"
        @show="onMenuShow"
        @hide="onMenuHide"
      >
        <div class="column q-pa-sm icon-picker-container">
          <div class="text-caption text-weight-bold text-grey-7 q-mb-xs text-center">{{ $t('admin.pageBuilder.selectIcon') }}</div>
          
          <q-input
            v-model="searchQuery"
            dense
            outlined
            :placeholder="$t('admin.pageBuilder.searchIcon')"
            class="q-mb-sm icon-search-input"
            clearable
          >
            <template #prepend>
              <q-icon name="search" size="18px" />
            </template>
          </q-input>

          <div class="icon-grid-scroll q-pr-xs">
            <div class="row q-col-gutter-xs">
              <div
                v-for="iconName in filteredIcons"
                :key="iconName"
                class="col-3 row flex-center"
              >
                <q-btn
                  v-close-popup
                  outline
                  size="sm"
                  :color="iconValue === iconName ? 'primary' : 'grey-7'"
                  :class="{ 'bg-blue-1': iconValue === iconName }"
                  class="icon-option-btn"
                  @click="iconValue = iconName"
                >
                  <q-icon :name="iconName" size="18px" />
                </q-btn>
              </div>
            </div>
            <div
              v-if="filteredIcons.length === 0"
              class="text-caption text-grey-6 text-center q-py-md"
            >
              {{ $t('admin.pageBuilder.noIconFound') }}
            </div>
          </div>
        </div>
      </q-menu>
    </div>

    <q-input
      v-model="textValue"
      outlined
      dense
      class="col rule-card__input"
      :placeholder="$t('admin.pageBuilder.rulePlaceholder')"
    />

    <q-btn
      flat
      round
      dense
      icon="delete"
      color="grey-9"
      class="rule-card__delete"
      @click="emit('remove')"
    />
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue';
import type { ExamRuleBoxContent } from 'src/types/page-builder.types';
import ALL_ICONS from 'src/utils/material-icons.json';

interface Props {
  editLocale?: 'th' | 'en';
}

const props = withDefaults(defineProps<Props>(), {
  editLocale: 'th',
});

const box = defineModel<ExamRuleBoxContent>({ required: true });

const emit = defineEmits<{ (e: 'remove'): void }>();

const AVAILABLE_ICONS = [
  'history',
  'event_seat',
  'checkroom',
  'edit',
  'contacts',
  'logout',
  'local_police',
  'block',
];

const searchQuery = ref('');

const isMenuOpen = ref(false);
const iconBlockRef = ref<HTMLElement | null>(null);
let scrollTarget: Element | null = null;

const handleScroll = (): void => {
  isMenuOpen.value = false;
};

const onMenuShow = (): void => {
  searchQuery.value = '';
  if (iconBlockRef.value) {
    scrollTarget = iconBlockRef.value.closest('.rule-column__list-container');
    if (scrollTarget) {
      scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
};

const onMenuHide = (): void => {
  if (scrollTarget) {
    scrollTarget.removeEventListener('scroll', handleScroll);
    scrollTarget = null;
  }
  window.removeEventListener('scroll', handleScroll);
};

onBeforeUnmount(() => {
  onMenuHide();
});

const filteredIcons = computed<string[]>(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    const uniqueIcons = new Set<string>([
      ...AVAILABLE_ICONS,
      ...ALL_ICONS.slice(0, 100),
    ]);
    return Array.from(uniqueIcons);
  }
  const matches = ALL_ICONS.filter((name) => name.toLowerCase().includes(query));
  return matches.slice(0, 120);
});

const iconValue = computed<string>({
  get: () => box.value.icon ?? '',
  set: (val) => {
    box.value.icon = val || null;
  },
});

const textValue = computed<string>({
  get: () => box.value.text?.[props.editLocale] ?? '',
  set: (val) => {
    box.value.text = { ...box.value.text, [props.editLocale]: val };
  },
});
</script>

<style scoped lang="scss">
.rule-card {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  gap: 10px;
}

.rule-card__handle {
  flex: 0 0 auto;
  cursor: grab;
}

.rule-card__icon {
  flex: 0 0 auto;
  width: var(--pb-rule-icon-size);
  height: var(--pb-rule-icon-size);
  border-radius: var(--pb-rule-icon-radius) !important;
  border: 1.5px solid var(--pb-rule-icon-border) !important;
  background-color: var(--pb-rule-icon-bg);
  transition: all var(--transition-fast);
  color: var(--pb-rule-icon-color);

  .q-icon {
    color: var(--pb-rule-icon-color);
    transition: color var(--transition-fast);
  }

  &:hover {
    border-color: var(--pb-rule-icon-hover-border) !important;
    background-color: var(--pb-rule-icon-hover-bg);

    .q-icon {
      color: var(--q-primary);
    }
  }
}

.icon-picker-container {
  width: var(--pb-icon-picker-width);
}

.icon-option-btn {
  border-radius: var(--pb-icon-picker-btn-radius) !important;
  width: var(--pb-icon-picker-btn-size);
  height: var(--pb-icon-picker-btn-size);
  min-height: var(--pb-icon-picker-btn-size);
  padding: 0;

  &:hover {
    background-color: var(--pb-icon-picker-selected-bg);
  }
}

.icon-grid-scroll {
  max-height: var(--pb-icon-picker-max-height);
  overflow-y: auto;
  scrollbar-width: thin;
}

.rule-card__delete {
  flex: 0 0 auto;
}

:deep(.q-field--outlined .q-field__control) {
  border-radius: var(--radius-10);
}

@media (max-width: 599px) {
  .rule-card {
    flex-wrap: wrap;
    padding: 12px;
    gap: 8px;
  }

  .rule-card__handle {
    order: 1;
  }

  .rule-card__icon {
    order: 3;
  }

  .rule-card__input {
    order: 4;
    min-width: 0;
  }

  .rule-card__delete {
    order: 2;
    margin-left: auto;
  }
}
</style>
