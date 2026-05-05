<template>
  <div class="login-card">
    <!-- Header -->
    <div class="card-header">
      <img src="~assets/img/logobuu.png" alt="BUU Logo" class="crest-img" />
      <div class="logo-wordmark"></div>
      <h2>{{ userType === 'thai' ? 'ยินดีต้อนรับ' : 'Welcome Back' }}</h2>
      <p>{{ userType === 'thai' ? 'เข้าสู่ระบบเพื่อใช้งาน' : 'Sign in to continue' }}</p>
    </div>

    <!-- Type Toggle -->
    <div class="type-toggle">
      <button
        class="toggle-btn"
        :class="{ active: userType === 'thai' }"
        @click="userType = 'thai'"
      >
        คนไทย
      </button>
      <button
        class="toggle-btn"
        :class="{ active: userType === 'foreigner' }"
        @click="userType = 'foreigner'"
      >
        Foreigner
      </button>
      <div class="toggle-slider" :class="{ right: userType === 'foreigner' }"></div>
    </div>

    <!-- ThaID (Thai only) -->
    <Transition name="expand">
      <div v-if="userType === 'thai'" class="thaid-section">
        <q-btn class="thaid-btn" unelevated no-caps>
          <q-icon name="fingerprint" size="22px" class="q-mr-sm" />
          เข้าสู่ระบบด้วย ThaID
        </q-btn>
        <div class="or-divider">
          <span>{{ userType === 'thai' ? 'หรือใช้อีเมล' : 'or use email' }}</span>
        </div>
      </div>
    </Transition>

    <!-- Form -->
    <q-form @submit.prevent="onSubmit" class="login-form">
      <!-- Email -->
      <div class="field-block">
        <label>{{ userType === 'thai' ? 'อีเมล' : 'Email' }}</label>
        <q-input v-model="email" outlined dense placeholder="name@buu.ac.th" class="field-input">
          <template v-slot:prepend>
            <q-icon name="mail" size="18px" />
          </template>
        </q-input>
      </div>

      <!-- Password -->
      <div class="field-block">
        <div class="field-label-row">
          <label>{{ userType === 'thai' ? 'รหัสผ่าน' : 'Password' }}</label>
          <a href="#" class="forgot-link">
            {{ userType === 'thai' ? 'ลืมรหัสผ่าน?' : 'Forgot?' }}
          </a>
        </div>
        <q-input
          v-model="password"
          :type="showPwd ? 'text' : 'password'"
          outlined
          dense
          placeholder="••••••••"
          class="field-input"
        >
          <template v-slot:prepend>
            <q-icon name="lock_outline" size="18px" />
          </template>
          <template v-slot:append>
            <q-icon
              :name="showPwd ? 'visibility_off' : 'visibility'"
              size="18px"
              class="cursor-pointer"
              @click="showPwd = !showPwd"
            />
          </template>
        </q-input>
      </div>

      <!-- Submit -->
      <q-btn
        type="submit"
        class="submit-btn"
        unelevated
        no-caps
        :loading="loading"
        @click="loading = true"
      >
        {{ userType === 'thai' ? 'เข้าสู่ระบบ' : 'Sign In' }}
        <span class="btn-arrow">→</span>
      </q-btn>
    </q-form>

    <!-- Register -->
    <div class="register-row">
      <router-link to="/register" class="text-primary text-decoration-none text-body2">
        {{ userType === 'thai' ? 'สร้างบัญชีตอนนี้ ?' : 'Create an account now?' }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const userType = ref<'thai' | 'foreigner'>('thai');
const email = ref('');
const password = ref('');
const showPwd = ref(false);
const loading = ref(false);

const onSubmit = () => {
  console.log('Login:', { type: userType.value, email: email.value });
  setTimeout(() => {
    loading.value = false;
  }, 1500);
};
</script>

<style scoped lang="scss">
// ============================================================
// Card Shell
// ============================================================
.login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 28px;
  padding: 40px 36px 36px;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 8px 32px rgba(0, 0, 0, 0.2),
    0 32px 64px rgba(0, 0, 0, 0.25),
    0 0 120px rgba(30, 137, 229, 0.12);
  animation: floatIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease;

  &:hover {
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.1),
      0 16px 48px rgba(0, 0, 0, 0.25),
      0 40px 80px rgba(0, 0, 0, 0.28),
      0 0 140px rgba(30, 137, 229, 0.18);
    transform: translateY(-4px);
  }
}

@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(32px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// ============================================================
// Header
// ============================================================
.card-header {
  text-align: center;
  margin-bottom: 28px;

  .crest-img {
    display: block;
    width: 64px;
    height: 64px;
    object-fit: contain;
    margin: 0 auto 12px;
    filter: drop-shadow(0 2px 8px rgba(13, 71, 161, 0.12));
  }

  .logo-wordmark {
    display: inline-flex;
    align-items: baseline;
    gap: 0;
    margin: 0 auto 16px;
    line-height: 1;

    .wordmark-buu {
      font-size: 2rem;
      font-weight: 900;
      color: #0d47a1;
      letter-spacing: -0.02em;
    }

    .wordmark-dash {
      font-size: 2rem;
      font-weight: 300;
      color: #94a3b8;
      margin: 0 1px;
    }

    .wordmark-get {
      font-size: 2rem;
      font-weight: 900;
      background: linear-gradient(135deg, #1e89e5, #4dabf5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }
  }

  h2 {
    font-size: 1.35rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 6px;
    letter-spacing: -0.01em;
  }

  p {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0;
  }
}

// ============================================================
// Type Toggle
// ============================================================
.type-toggle {
  position: relative;
  display: flex;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;

  .toggle-slider {
    position: absolute;
    top: 4px;
    left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: #ffffff;
    border-radius: 9px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);

    &.right {
      transform: translateX(100%);
    }
  }

  .toggle-btn {
    position: relative;
    z-index: 1;
    flex: 1;
    padding: 10px 0;
    border: none;
    background: transparent;
    font-size: 0.875rem;
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
    transition: color 0.25s;
    border-radius: 9px;

    &.active {
      color: #0d47a1;
    }
  }
}

// ============================================================
// ThaID Section
// ============================================================
.thaid-section {
  overflow: hidden;
}

.thaid-btn {
  width: 100%;
  height: 50px;
  background: #00006e !important;
  color: #ffffff !important;
  border-radius: 12px !important;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: all 0.2s;

  &:hover {
    filter: brightness(1.12);
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(0, 0, 110, 0.3) !important;
  }
}

.or-divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  gap: 12px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }

  span {
    font-size: 0.78rem;
    color: #94a3b8;
    white-space: nowrap;
    font-weight: 500;
  }
}

// ============================================================
// Form Fields
// ============================================================
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-block {
  label {
    display: block;
    font-size: 0.82rem;
    font-weight: 600;
    color: #334155;
    margin-bottom: 6px;
  }
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.forgot-link {
  font-size: 0.78rem;
  font-weight: 600;
  color: #1e89e5;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.field-input {
  :deep(.q-field__control) {
    background: #f8fafc;
    border-radius: 10px;
    border-color: #e2e8f0;
    transition: all 0.2s;
  }

  :deep(.q-field__control:hover::before) {
    border-color: #94a3b8;
  }

  :deep(.q-field--focused .q-field__control::before) {
    border-color: #0d47a1;
    border-width: 1.5px;
  }

  :deep(.q-field__prepend) {
    color: #94a3b8;
  }
}

// ============================================================
// Submit Button
// ============================================================
.submit-btn {
  width: 100%;
  height: 52px;
  margin-top: 4px;
  background: linear-gradient(135deg, #0d47a1 0%, #1e89e5 100%) !important;
  color: #ffffff !important;
  border-radius: 12px !important;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  box-shadow: 0 6px 18px rgba(13, 71, 161, 0.28) !important;
  transition: all 0.25s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 28px rgba(13, 71, 161, 0.38) !important;
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-arrow {
  margin-left: 8px;
  font-size: 1.1rem;
  font-weight: 400;
  transition: transform 0.2s;
  display: inline-block;
}

.submit-btn:hover .btn-arrow {
  transform: translateX(3px);
}

// ============================================================
// Register Row
// ============================================================
.register-row {
  text-align: center;
  margin-top: 22px;
  font-size: 0.85rem;
  color: #64748b;

  a {
    margin-left: 6px;
    font-weight: 700;
    color: #0d47a1;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

// ============================================================
// Transition
// ============================================================
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
