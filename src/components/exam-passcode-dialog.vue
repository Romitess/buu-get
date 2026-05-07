<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <q-card
      class="passcode-card q-pa-md"
      style="width: 400px; max-width: 90vw; border-radius: 16px"
    >
      <!-- Close Button -->
      <q-btn
        icon="close"
        flat
        round
        dense
        v-close-popup
        class="absolute-top-right q-ma-sm text-grey-5"
      />

      <q-card-section class="column items-center q-pb-none q-pt-lg">
        <!-- Lock Icon -->
        <div class="lock-icon-container flex flex-center q-mb-md">
          <q-icon name="lock" size="24px" class="text-grey-9" />
        </div>

        <!-- Title -->
        <div class="text-h6 text-weight-bold q-mb-xs">Enter Passcode</div>

        <!-- Subtitle -->
        <div class="text-body2 text-grey-6 q-mb-lg text-center">
          กรุณากรอกรหัสผ่าน 6 หลักเพื่อทำการลงทะเบียนสอบ
        </div>

        <!-- 6 Digit Inputs -->
        <div class="row justify-center q-gutter-x-sm q-mb-xl passcode-inputs">
          <input
            v-for="(digit, index) in 6"
            :key="index"
            ref="inputRefs"
            v-model="passcode[index]"
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="passcode-box text-center text-h6 text-weight-medium"
            @input="handleInput(index, $event)"
            @keydown="handleKeydown(index, $event)"
            @focus="handleFocus(index)"
          />
        </div>

        <!-- Confirm Button -->
        <q-btn
          unelevated
          label="ยืนยัน"
          class="full-width q-py-sm confirm-btn text-weight-bold"
          style="border-radius: 8px"
          @click="submitPasscode"
          :disable="!isComplete"
        />
      </q-card-section>

      <!-- Footer Contact -->
      <q-card-section class="text-center q-pt-sm q-pb-sm">
        <a
          href="#"
          class="text-grey-6 text-caption text-decoration-none contact-link flex flex-center"
          @click.prevent="contactSupport"
        >
          <q-icon name="help_outline" size="16px" class="q-mr-xs" />
          พบปัญหา โปรดติดต่อพนักงาน
        </a>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useDialogPluginComponent } from 'quasar';

// QUASAR DIALOG PLUGIN SUPPORT
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const passcode = ref<string[]>(['', '', '', '', '', '']);
const inputRefs = ref<HTMLInputElement[]>([]);

const isComplete = computed(() => passcode.value.every((d) => d !== ''));

const handleInput = (index: number, event: Event) => {
  const target = event.target as HTMLInputElement;
  const val = target.value;

  // Only allow numbers
  if (!/^\d*$/.test(val)) {
    passcode.value[index] = '';
    return;
  }

  passcode.value[index] = val;

  // Move to next input if filled
  if (val && index < 5) {
    void nextTick(() => {
      inputRefs.value[index + 1]?.focus();
    });
  }
};

const handleKeydown = (index: number, event: KeyboardEvent) => {
  // Move to previous input on backspace if current is empty
  if (event.key === 'Backspace' && !passcode.value[index] && index > 0) {
    void nextTick(() => {
      inputRefs.value[index - 1]?.focus();
      passcode.value[index - 1] = '';
    });
  } else if (event.key === 'ArrowLeft' && index > 0) {
    inputRefs.value[index - 1]?.focus();
  } else if (event.key === 'ArrowRight' && index < 5) {
    inputRefs.value[index + 1]?.focus();
  }
};

const handleFocus = (index: number) => {
  // Optional: Auto-select the text when focused for easier typing
  void nextTick(() => {
    inputRefs.value[index]?.select();
  });
};

const submitPasscode = () => {
  if (isComplete.value) {
    onDialogOK(passcode.value.join(''));
  }
};

const contactSupport = () => {
  // Handle contact support logic here
  console.log('Contact support clicked');
};
</script>

<style scoped lang="scss">
.passcode-card {
  font-family: 'Inter', 'Noto Sans Thai', 'Sarabun', sans-serif;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.lock-icon-container {
  width: 56px;
  height: 56px;
  background-color: var(--border-color);
  border-radius: 14px;
}

.passcode-inputs {
  width: 100%;
}

.passcode-box {
  width: 48px;
  height: 56px;
  border: 1px solid var(--neutral-200);
  border-radius: 8px;
  outline: none;
  transition: all 0.2s ease;
  background-color: var(--surface-card);
  color: var(--text-primary);

  &:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 1px var(--primary);
  }
}

.confirm-btn {
  background-color: var(--primary) !important;
  color: var(--text-on-primary) !important;
  font-size: 16px;
  height: 48px;
  text-transform: none;

  &:disabled {
    opacity: 0.6;
  }
}

.contact-link {
  transition: color 0.2s ease;
  text-decoration: none;

  &:hover {
    color: var(--primary) !important;
  }
}

/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

/* Firefox */
input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
