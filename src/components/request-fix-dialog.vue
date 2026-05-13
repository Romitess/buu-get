<template>
  <q-dialog v-model="internalValue" persistent>
    <q-card class="request-fix-dialog" style="width: 480px; max-width: 95vw; border-radius: 16px">
      <q-card-section class="q-px-lg q-pt-lg q-pb-md">
        <div class="text-h5 text-weight-bold" style="color: #212121">
          แจ้งให้ผู้สมัครแก้ไขข้อมูล
        </div>
        <div class="text-subtitle2 text-grey-7 q-mt-xs">
          กรอกรายละเอียดเพื่อส่งคำขอแก้ไขไปยังผู้สมัคร
        </div>
      </q-card-section>

      <q-separator style="height: 1.2px" color="grey-3" />

      <q-card-section class="q-px-lg q-pt-lg q-pb-none">
        <div class="profile-info-block row items-center q-pa-md q-mb-lg">
          <q-avatar color="primary" text-color="white" size="48px" class="q-mr-md text-weight-bold">
            {{ initials }}
          </q-avatar>
          <div class="column">
            <div class="text-subtitle1 text-weight-bold text-dark">{{ fullName }}</div>
            <div class="text-caption text-grey-7">
              เลขที่สมัคร: {{ regId }} · สอบวันที่ {{ examDate }}
            </div>
          </div>
        </div>

        <div class="q-mb-md">
          <label class="field-label q-mb-xs block"
            >กำหนดแก้ไขภายใน <span class="text-negative">*</span></label
          >
          <AppLabeledInput
            v-model="form.fixDeadline"
            readonly
            :placeholder="`${examDate}`"
            @click="datePicker?.show()"
          >
            <template #prepend>
              <q-icon name="event" class="cursor-pointer" color="grey-7" size="20px" />
            </template>
            <q-popup-proxy ref="datePicker" transition-show="scale" transition-hide="scale">
              <q-date v-model="form.fixDeadline" mask="DD MMM YYYY">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup label="Close" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </AppLabeledInput>
          <div class="text-caption text-grey-5 q-mt-xs">
            ผู้สมัครต้องแก้ไขภายในวันและเวลาที่กำหนด มิฉะนั้นถือว่าสละสิทธิ์
          </div>
        </div>

        <div class="column q-gutter-y-sm q-mb-md">
          <q-checkbox
            v-model="form.reasons"
            val="photo"
            label="รูปถ่ายไม่ถูกต้อง"
            class="custom-checkbox"
            dense
            size="32px"
          />
          <q-checkbox
            v-model="form.reasons"
            val="info"
            label="กรอกข้อมูลไม่ถูกต้อง"
            class="custom-checkbox"
            dense
            size="32px"
          />
          <q-checkbox
            v-model="form.reasons"
            val="other"
            label="อื่น ๆ (ระบุในหมายเหตุ)"
            class="custom-checkbox"
            dense
            size="32px"
          />
        </div>

        <div class="q-mb-none">
          <label class="field-label q-mb-xs block">
            หมายเหตุถึงผู้สมัคร <span class="text-weight-light text-grey-5">(ไม่บังคับ)</span>
          </label>
          <q-input
            v-model="form.notes"
            type="textarea"
            outlined
            dense
            autogrow
            placeholder="เช่น กรุณากรอกข้อมูลรหัสบัตรประชาชนให้ถูกต้อง"
            class="custom-input"
            maxlength="300"
          />
          <div class="row justify-end q-mt-xs">
            <div class="text-caption text-grey-5">{{ form.notes.length }} / 300</div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-px-lg q-pb-lg q-pt-md q-gutter-md">
        <AppButton
          label="ยกเลิก"
          outline
          color="grey-4"
          text-color="grey-7"
          class="bg-white border-grey"
          style="min-width: 100px; border: 1px solid #e0e0e0"
          @click="internalValue = false"
        />
        <AppButton
          label="ส่งคืนเพื่อแก้ไข"
          color="primary"
          icon="send"
          style="min-width: 160px"
          @click="handleSubmit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppButton from 'src/components/base/app-button.vue';
import AppLabeledInput from 'src/components/base/app-labeled-input.vue';

interface Props {
  modelValue: boolean;
  fullName: string;
  regId: string;
  examDate: string;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:modelValue', 'submit']);

const $q = useQuasar();

const internalValue = ref(props.modelValue);

interface PopupProxy {
  show: () => void;
  hide: () => void;
}
const datePicker = ref<PopupProxy | null>(null);

const form = ref({
  fixDeadline: '',
  reasons: [] as string[],
  notes: '',
});

watch(
  () => props.modelValue,
  (val) => {
    internalValue.value = val;
  },
);

watch(internalValue, (val) => {
  emit('update:modelValue', val);
});

const initials = computed(() => {
  if (!props.fullName || props.fullName === 'ไม่ทราบชื่อ') return '??';
  const parts = props.fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    const firstPart = parts[0];
    const lastPart = parts[parts.length - 1];
    if (firstPart && lastPart) {
      return (firstPart[0] || '') + (lastPart[0] || '');
    }
  }
  return props.fullName.substring(0, 2);
});

const isFormValid = computed(() => {
  return form.value.reasons.length > 0;
});

const handleSubmit = (): void => {
  if (!isFormValid.value) {
    $q.notify({
      type: 'warning',
      message: 'กรุณาเลือกระบุเหตุผลอย่างน้อย 1 ข้อ',
      position: 'top',
    });
    return;
  }

  emit('submit', { ...form.value });
  internalValue.value = false;
};
</script>

<style scoped lang="scss">
.request-fix-dialog {
  background-color: #ffffff;
}

.profile-info-block {
  background: #f0f7ff;
  border: 1.5px solid #bbdefb;
  border-radius: 12px;
}

.field-label {
  font-size: 1rem;
  font-weight: 700;
  color: #212121;
}

.custom-input {
  :deep(.q-field__control) {
    border-radius: 10px;
    background-color: #fcfcfc;
    transition: all 0.3s ease;

    &:before {
      border: 1px solid #eeeeee !important;
      border-style: solid !important;
    }

    &:hover:before {
      border-color: #e0e0e0 !important;
    }
  }

  :deep(.q-field__native) {
    font-weight: 500;
    color: #424242;
  }
}

.custom-checkbox {
  border: 1px solid #eeeeee;
  border-radius: 8px;
  padding: 6px 12px;
  width: 100%;
  transition: all 0.2s ease;
  background-color: #ffffff;

  &:hover {
    background-color: #fcfcfc;
    border-color: #e0e0e0;
  }

  :deep(.q-checkbox__inner) {
    font-size: 28px;
  }

  :deep(.q-checkbox__label) {
    font-weight: 500;
    color: #424242;
    font-size: 0.9rem;
  }
}

.border-grey {
  border: 1px solid #e0e0e0 !important;
}

.text-dark {
  color: #212121 !important;
}
</style>
