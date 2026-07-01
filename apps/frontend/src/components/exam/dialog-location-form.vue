<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card class="location-form-dialog-card q-pa-none">
      <q-card-section class="bg-primary text-white q-pa-md row items-center no-wrap dialog-header">
        <q-avatar class="q-mr-md header-avatar" size="48px">
          <q-icon name="meeting_room" size="28px" color="white" />
        </q-avatar>
        <div class="column">
          <div class="dialog-title">
            {{ $t('admin.locationManagement.dialogs.editTitle') }}
          </div>
          <div class="dialog-subtitle">
            {{ $t('admin.locationManagement.dialogs.editSubtitle') }}
          </div>
        </div>
      </q-card-section>

      <q-form ref="formRef" @submit.prevent="onFormSubmit">
        <q-card-section class="q-pt-lg q-px-lg q-pb-md q-gutter-y-md">
          <q-input
            v-model="form.LOCATION_ROOM_NO"
            outlined
            dense
            :label="$t('admin.locationManagement.dialogs.roomNameLabel')"
            :rules="[(val) => !!val || $t('profile.required')]"
            lazy-rules
            class="custom-input"
          />

          <q-input
            v-model="form.LOCATION_NAME"
            outlined
            dense
            type="textarea"
            rows="3"
            :label="$t('admin.locationManagement.dialogs.locationNameLabel')"
            :rules="[(val) => !!val || $t('profile.required')]"
            lazy-rules
            class="custom-input"
          />

          <div class="preview-container q-pa-md q-mt-sm" v-if="form.LOCATION_ROOM_NO">
            <div class="preview-header q-mb-sm row items-center">
              <q-icon name="meeting_room" color="primary" size="18px" class="q-mr-xs" />
              <span class="text-caption text-weight-bold text-primary">
                {{ $t('admin.locationManagement.dialogs.roomDetails') }}
              </span>
            </div>
            <div class="row q-col-gutter-x-md">
              <div class="col-6 column">
                <span class="preview-label">{{
                  $t('admin.locationManagement.dialogs.floorLabel')
                }}</span>
                <span class="preview-value text-grey-8">{{ computedFloor }}</span>
              </div>
              <div class="col-6 column">
                <span class="preview-label">{{
                  $t('admin.locationManagement.dialogs.capacityLabel')
                }}</span>
                <span class="preview-value text-primary text-weight-bold">
                  {{
                    $t('admin.locationManagement.dialogs.seatsValue', {
                      capacity: computedCapacity,
                    })
                  }}
                </span>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="q-px-lg q-pb-lg q-pt-sm row no-wrap action-container">
          <AppButton
            flat
            no-caps
            :label="$t('profile.cancel')"
            color="grey-7"
            class="action-btn"
            @click="onCancelClick"
          />
          <AppButton
            unelevated
            no-caps
            type="submit"
            :label="$t('profile.save')"
            color="primary"
            :loading="loading"
            class="action-btn text-weight-bold"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import type { QForm } from 'quasar';
import AppButton from 'src/components/base/app-button.vue';
import { useFocusFirstInvalidField } from 'src/composables/use-focus-first-invalid-field';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      LOCATION_NAME: '',
      LOCATION_ROOM_NO: '',
    }),
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const formRef = ref<QForm | null>(null);
const { validateAndFocusFirstInvalid } = useFocusFirstInvalidField(formRef);

const form = ref({
  LOCATION_NAME: props.initialData?.LOCATION_NAME || '',
  LOCATION_ROOM_NO: props.initialData?.LOCATION_ROOM_NO || '',
});

const parseFloor = (roomNo: string | undefined | null): number => {
  if (!roomNo) return 1;
  const match = roomNo.match(/\d+/g);
  if (match && match.length > 0) {
    const lastNum = match[match.length - 1];
    if (lastNum && lastNum.length >= 3) {
      return parseInt(lastNum.substring(0, 1)) || 1;
    }
    if (lastNum) {
      return parseInt(lastNum) || 1;
    }
  }
  return 1;
};

const parseCapacity = (roomNo: string | undefined | null): number => {
  if (!roomNo) return 60;
  const floor = parseFloor(roomNo);
  return floor === 1 ? 40 : 60;
};

const computedFloor = computed(() => parseFloor(form.value.LOCATION_ROOM_NO));
const computedCapacity = computed(() => parseCapacity(form.value.LOCATION_ROOM_NO));

async function onFormSubmit(): Promise<void> {
  const isValid = await validateAndFocusFirstInvalid();
  if (!isValid) {
    return;
  }

  onDialogOK({
    LOCATION_NAME: form.value.LOCATION_NAME,
    LOCATION_ROOM_NO: form.value.LOCATION_ROOM_NO,
    LOCATION_FLOOR_NO: computedFloor.value,
  });
}

function onCancelClick() {
  onDialogCancel();
}
</script>

<style lang="scss" scoped>
.location-form-dialog-card {
  width: 100%;
  max-width: 460px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background-color: var(--surface-card);
  font-family: var(--font-family-base);
}

.dialog-header {
  border-top-left-radius: var(--radius-md);
  border-top-right-radius: var(--radius-md);

  .dialog-title {
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .dialog-subtitle {
    font-size: 0.85rem;
    opacity: 0.85;
    line-height: 1.4;
    margin-top: 2px;
  }
}

.header-avatar {
  background-color: var(--white-alpha-20);
}

.custom-input {
  :deep(.q-field__control) {
    border-radius: 8px !important;
  }
}

.preview-container {
  background-color: var(--location-preview-bg);
  border-radius: 8px;
  border: 1px solid var(--location-preview-border);

  .preview-label {
    font-size: 11px;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .preview-value {
    font-size: 16px;
    font-weight: 600;
    margin-top: 2px;
  }
}

.action-container {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.action-btn {
  border-radius: 8px !important;
  padding: 10px 16px !important;
  min-height: 40px !important;
  flex: 1;
  box-shadow: none !important;
}
</style>
