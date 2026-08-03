<template>
  <div class="login-card">
    <!-- Header -->
    <div class="card-header">
      <img src="~assets/img/buu-logo.png" alt="BUU Logo" class="crest-img" />
      <h2>{{ $t('auth.welcome') }}</h2>
      <p>{{ $t('auth.signInToContinue') }}</p>
    </div>

    <!-- Type Toggle -->
    <div class="type-toggle">
      <button
        class="toggle-btn"
        :class="{ active: userType === 'thai' }"
        @click="toggleUserType('thai')"
      >
        {{ $t('auth.thaiPerson') }}
      </button>
      <button
        class="toggle-btn"
        :class="{ active: userType === 'foreigner' }"
        @click="toggleUserType('foreigner')"
      >
        {{ $t('auth.foreigner') }}
      </button>
      <div class="toggle-slider" :class="{ right: userType === 'foreigner' }"></div>
    </div>

    <!-- ThaID (Thai only) -->
    <Transition name="expand">
      <div v-if="userType === 'thai'" class="thaid-section">
        <q-btn class="thaid-btn" unelevated no-caps>
          <q-icon name="fingerprint" size="18px" class="q-mr-sm" />
          {{ $t('auth.loginThaID') }}
        </q-btn>
        <div class="or-divider">
          <span>{{ $t('auth.orUseEmail') }}</span>
        </div>
      </div>
    </Transition>

    <!-- Form -->
    <q-form @submit.prevent="onSubmit" class="login-form">
      <!-- Email -->
      <div class="field-block">
        <div class="text-body2 text-weight-medium q-mb-xs field-label block">
          {{ $t('auth.email') }}
        </div>
        <q-input
          v-model="email"
          outlined
          dense
          :placeholder="$t('auth.emailPlaceholder')"
          class="custom-input"
        >
          <template v-slot:prepend>
            <q-icon name="mail" size="18px" />
          </template>
        </q-input>
      </div>

      <!-- Password -->
      <div class="field-block">
        <div class="field-label-row">
          <div class="text-body2 text-weight-medium q-mb-xs field-label block">
            {{ $t('auth.password') }}
          </div>
          <a href="#" class="forgot-link">
            {{ $t('auth.forgotPassword') }}
          </a>
        </div>
        <q-input
          v-model="password"
          :type="showPwd ? 'text' : 'password'"
          outlined
          dense
          :placeholder="$t('auth.passwordPlaceholder')"
          class="custom-input"
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
      <q-btn type="submit" class="submit-btn" unelevated no-caps :loading="isLoading">
        {{ $t('auth.login') }}
      </q-btn>
    </q-form>

    <!-- Register -->
    <div class="register-row">
      <router-link to="/register" class="text-primary text-decoration-none text-body2">
        {{ $t('auth.createAccount') }}
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from 'src/stores/user.store';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { ROLES } from 'src/constants/roles';
import { getDefaultRouteForRole } from 'src/utils/default-route';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const $q = useQuasar();

const { t, locale } = useI18n();

const userType = ref<'thai' | 'foreigner'>('thai');
const email = ref('');
const password = ref('');
const showPwd = ref(false);
const isLoading = ref(false);

onMounted(() => {
  userType.value = locale.value === 'th' ? 'thai' : 'foreigner';
  // Prefetch destination chunks ที่ใช้บ่อยหลัง login เพื่อลด cold-chunk spike
  void import('pages/user/exam-schedule-page.vue');
  void import('pages/admin/exam-management-page.vue');
});

const toggleUserType = (type: 'thai' | 'foreigner') => {
  userType.value = type;
  locale.value = type === 'thai' ? 'th' : 'en-US';
};

const onSubmit = async () => {
  if (!email.value || !password.value) {
    $q.notify({
      type: 'warning',
      message: t('auth.notify.required'),
    });
    return;
  }

  isLoading.value = true;
  try {
    const success = await userStore.login(email.value, password.value);

    if (success) {
      // ปลด spinner ก่อน navigate เพื่อไม่ให้ lazy chunk รวมในปุ่ม loading
      isLoading.value = false;
      // โหลด profile เต็มแบบ background — ไม่รอ / ไม่ค้าง spinner
      void userStore.ensureProfileLoaded();

      $q.notify({
        type: 'positive',
        message: t('auth.notify.success'),
      });

      // Deep Linking Redirect: ถ้ามี redirect parameter (เช่นมาจากอีเมล) ให้ไปหน้านั้นเลย
      if (route.query.redirect) {
        await router.push(route.query.redirect as string);
        return;
      }

      // Role-based redirection
      const role = userStore.userRole;

      if (role === ROLES.CANDIDATE && userStore.currentUser?.remark) {
        await router.push({ name: 'user-profile', query: { from: 'email' } });
      } else {
        await router.push(getDefaultRouteForRole(role));
      }
    } else {
      $q.notify({
        type: 'negative',
        message: t('auth.notify.failed'),
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    $q.notify({
      type: 'negative',
      message: t('auth.notify.error'),
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
// ============================================================
// Card Shell
// ============================================================
.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface-card);
  border-radius: 12px;
  padding: 40px 36px 36px;
  zoom: 0.9;
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
  margin-bottom: 24px;

  .crest-img {
    display: block;
    width: 68px;
    height: 68px;
    object-fit: contain;
    margin: 0 auto 8px;
    filter: drop-shadow(0 2px 8px rgba(var(--primary-rgb), 0.12));
  }

  h2 {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--neutral-900);
    margin: 0 0 8px;
    letter-spacing: -0.01em;
  }

  p {
    font-size: 1rem;
    color: var(--neutral-500);
    margin: 0;
  }
}

// ============================================================
// Type Toggle
// ============================================================
.type-toggle {
  position: relative;
  display: flex;
  background: var(--neutral-100);
  border-radius: 12px;
  padding: 3px;
  margin-bottom: 24px;

  .toggle-slider {
    position: absolute;
    top: 3px;
    left: 3px;
    width: calc(50% - 3px);
    height: calc(100% - 6px);
    background: var(--surface-card);
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
    font-size: 16px !important;
    font-weight: 600;
    color: var(--neutral-400);
    cursor: pointer;
    transition: color 0.25s;
    border-radius: 9px;

    &.active {
      color: var(--primary);
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
  height: 48px;
  background: var(--thaid-bg) !important;
  color: var(--text-on-primary) !important;
  border-radius: 8px !important;
  font-size: 16px !important;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: all 0.2s;

  &:hover {
    filter: brightness(1.12);
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(var(--thaid-bg-rgb), 0.3) !important;
  }
}

.or-divider {
  display: flex;
  align-items: center;
  margin: 16px 0;
  gap: 10px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--neutral-200);
  }

  span {
    font-size: 0.75rem;
    color: var(--neutral-400);
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
  gap: 13px;
}

.field-block {
}

.field-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.forgot-link {
  font-size: 14px !important;
  font-weight: 600;
  color: var(--primary-light);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

// ============================================================
// Submit Button
// ============================================================
.submit-btn {
  width: 100%;
  height: 48px;
  margin-top: 3px;
  background: var(--primary) !important;
  color: var(--text-on-primary) !important;
  border-radius: 8px !important;
  font-size: 16px !important;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: all 0.25s;

  &:hover {
    filter: brightness(1.1);
  }

  &:active {
    transform: translateY(0);
  }
}

// ============================================================
// Register Row
// ============================================================
.register-row {
  text-align: center;
  margin-top: 16px;
  font-size: 15px !important;
  color: var(--neutral-500);

  a {
    margin-left: 6px;
    font-weight: 700;
    color: var(--primary);
    text-decoration: none;
    font-size: 15px !important;

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
