<template>
  <q-card class="register-card shadow-1 q-pa-lg">
    <!-- Toggle Buttons -->
    <div class="user-type-toggle q-mb-lg">
      <div class="toggle-btn" :class="{ active: userType === 'thai' }" @click="userType = 'thai'">
        คนไทย
      </div>
      <div
        class="toggle-btn"
        :class="{ active: userType === 'foreigner' }"
        @click="userType = 'foreigner'"
      >
        Foreigner
      </div>
    </div>

    <!-- Title -->
    <div class="text-center q-mb-lg">
      <div class="text-h5 text-weight-bold">
        {{ userType === 'thai' ? 'สมัครสมาชิก' : 'Sign Up' }}
      </div>
    </div>

    <!-- Form -->
    <q-form @submit.prevent="onSubmit">
      <!-- Email -->
      <div class="q-mb-md">
        <div class="text-body2 text-weight-medium q-mb-xs">
          {{ userType === 'thai' ? 'อีเมล (กำหนดเป็นชื่อผู้ใช้งาน)' : 'Email (Set as username)' }}
        </div>
        <q-input
          v-model="email"
          outlined
          dense
          placeholder="example@email.com"
          class="custom-input"
        />
      </div>

      <!-- Password -->
      <div class="q-mb-md">
        <div class="text-body2 text-weight-medium q-mb-xs">
          {{
            userType === 'thai'
              ? 'รหัสผ่าน (ตัวอักษรหรือตัวเลข 8 ตำแหน่งขึ้นไป)'
              : 'Password (8 characters or more)'
          }}
        </div>
        <q-input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          class="custom-input"
        >
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
              color="grey-6"
              size="20px"
            />
          </template>
        </q-input>
      </div>

      <!-- Confirm Password -->
      <div class="q-mb-lg">
        <div class="text-body2 text-weight-medium q-mb-xs">
          {{ userType === 'thai' ? 'ยืนยันรหัสผ่าน' : 'Confirm Password' }}
        </div>
        <q-input
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          outlined
          dense
          class="custom-input"
        >
          <template v-slot:append>
            <q-icon
              :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showConfirmPassword = !showConfirmPassword"
              color="grey-6"
              size="20px"
            />
          </template>
        </q-input>
      </div>

      <!-- Submit Button -->
      <q-btn
        type="submit"
        color="primary"
        class="full-width q-mb-md submit-btn"
        :label="userType === 'thai' ? 'สมัครสมาชิก' : 'Sign Up'"
        no-caps
        unelevated
      />

      <!-- Extra options container to maintain fixed card height without jumping -->
      <div :style="{ visibility: userType === 'thai' ? 'visible' : 'hidden' }">
        <!-- Divider -->
        <div class="row items-center q-mb-md">
          <q-separator class="col" color="grey-4" />
          <div class="q-px-sm text-grey-6 text-body2 font-weight-medium">หรือ</div>
          <q-separator class="col" color="grey-4" />
        </div>

        <!-- ThaID Button -->
        <q-btn class="full-width thaid-btn" no-caps unelevated :disable="userType !== 'thai'">
          <q-icon name="fingerprint" size="xs" class="q-mr-sm" />
          สมัครสมาชิกด้วย ThaID
        </q-btn>
      </div>
    </q-form>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const userType = ref<'thai' | 'foreigner'>('thai');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const onSubmit = () => {
  console.log('Register attempt', {
    type: userType.value,
    email: email.value,
    password: password.value,
  });
};
</script>

<style scoped>
.register-card {
  width: 100%;
  max-width: 420px;
  border-radius: 20px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.08) !important;
  margin: 0 auto;
}

/* User Type Toggle */
.user-type-toggle {
  display: flex;
  background-color: #f5f6f8;
  border-radius: 10px;
  padding: 4px;
}
.toggle-btn {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  border-radius: 8px;
  color: #6b7280;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}
.toggle-btn.active {
  background-color: white;
  color: #0d47a1; /* Primary Blue */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* ThaID Button */
.thaid-btn {
  background-color: #000066; /* Deep Navy Blue */
  color: white;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 0;
}

/* Form Inputs */
.custom-input :deep(.q-field__control) {
  border-radius: 8px;
  border-color: #e5e7eb;
}

/* Submit Button */
.submit-btn {
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  padding: 12px 0;
}
</style>
