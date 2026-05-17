<template>
  <div>
    <!-- Save Button Trigger -->
    <q-btn
      label="บันทึกข้อมูลการชำระเงินลงทะเบียน"
      unelevated
      :disable="disabled"
      class="btn-save-trigger text-weight-bold full-width"
      :class="{ 'btn-disabled': disabled }"
      @click="showConfirm = true"
    />

    <!-- Confirm Dialog -->
    <q-dialog v-model="showConfirm" persistent>
      <q-card class="confirm-dialog-card">
        <!-- Close Button & Title -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold dialog-title">ยืนยันการบันทึกข้อมูล</div>
          <q-btn icon="close" flat round dense v-close-popup class="text-grey-6" />
        </div>

        <!-- Confirm Message -->
        <div class="text-center q-my-lg message-text">คุณต้องการบันทึกข้อมูลทั้งหมดใช่หรือไม่</div>

        <!-- Action Buttons -->
        <div class="row justify-center q-gutter-x-md q-mt-lg">
          <q-btn
            label="ยกเลิก"
            unelevated
            v-close-popup
            class="btn-dialog-cancel text-weight-bold"
          />
          <q-btn
            label="ยืนยัน"
            unelevated
            @click="onConfirm"
            class="btn-dialog-confirm text-weight-bold"
          />
        </div>
      </q-card>
    </q-dialog>

    <!-- Success Dialog -->
    <q-dialog v-model="showSuccess" persistent>
      <q-card class="success-dialog-card">
        <!-- Close Button & Title -->
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold dialog-title">บันทึกสำเร็จ</div>
          <q-btn icon="close" flat round dense @click="onSuccessClose" class="text-grey-6" />
        </div>

        <!-- Success Message -->
        <div class="text-center q-my-lg message-text">บันทึกข้อมูลเรียบร้อยแล้ว</div>

        <!-- Full width OK Button -->
        <div class="row q-mt-lg">
          <q-btn
            label="ตกลง"
            unelevated
            @click="onSuccessClose"
            class="btn-dialog-ok text-weight-bold full-width"
          />
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

defineProps<{
  disabled?: boolean;
}>();

const router = useRouter();
const showConfirm = ref(false);
const showSuccess = ref(false);

const onConfirm = () => {
  showConfirm.value = false;
  showSuccess.value = true;
};

const onSuccessClose = () => {
  showSuccess.value = false;
  void router.push('/admin/payment-import');
};
</script>

<style scoped lang="scss">
.btn-save-trigger {
  background-color: #0e49b5 !important;
  color: white !important;
  border-radius: 8px;
  height: 48px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &.btn-disabled {
    background-color: #cbd5e1 !important;
    color: #94a3b8 !important;
    cursor: not-allowed;
  }

  &:not(.btn-disabled):hover {
    background-color: #0b3c95 !important;
  }
}

.confirm-dialog-card,
.success-dialog-card {
  width: 450px;
  max-width: 90vw;
  border-radius: 16px;
  padding: 24px 32px;
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08);
}

.dialog-title {
  color: var(--text-primary);
  font-size: 1.15rem;
}

.message-text {
  font-size: 1.05rem;
  color: #334155;
  font-weight: 500;
}

.btn-dialog-cancel {
  background-color: #e2e8f0 !important;
  color: #4a5568 !important;
  width: 120px;
  height: 40px;
  border-radius: 8px;
  text-transform: none;
}

.btn-dialog-confirm {
  background-color: #0e49b5 !important;
  color: white !important;
  width: 120px;
  height: 40px;
  border-radius: 8px;
  text-transform: none;

  &:hover {
    background-color: #0b3c95 !important;
  }
}

.btn-dialog-ok {
  background-color: #0e49b5 !important;
  color: white !important;
  height: 44px;
  border-radius: 8px;
  text-transform: none;
  font-size: 1rem;

  &:hover {
    background-color: #0b3c95 !important;
  }
}
</style>
