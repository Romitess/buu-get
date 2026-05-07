<template>
  <Transition name="loading-fade">
    <div v-if="userStore.isLoadingGlobal" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-logo-wrap">
          <img src="~assets/img/logobuu.png" alt="BUU Logo" class="loading-logo" />
        </div>
        <div class="loading-spinner" />
        <p class="loading-text">{{ userStore.loadingText }}</p>
        <p class="loading-subtext">BUU-GET • ระบบลงทะเบียนสอบ</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useUserStore } from 'src/stores/user.store';
const userStore = useUserStore();
</script>

<style lang="scss" scoped>
.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e8e8e8 50%, #f0f0f0 100%);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: loadingContentIn 0.6s ease-out;
}

.loading-logo-wrap {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8px 32px rgba(255, 206, 0, 0.2),
    0 2px 8px rgba(0, 0, 0, 0.06);
  animation: logoPulse 2s ease-in-out infinite;
}

.loading-logo {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 206, 0, 0.2);
  border-top-color: #ffce00;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #424242;
  margin: 0;
  letter-spacing: 0.02em;
}

.loading-subtext {
  font-size: 0.8rem;
  font-weight: 400;
  color: #9e9e9e;
  margin: -8px 0 0;
  letter-spacing: 0.04em;
}

/* Transitions */
.loading-fade-enter-active {
  transition: opacity 0.4s ease;
}
.loading-fade-leave-active {
  transition: opacity 0.3s ease;
}
.loading-fade-enter-from,
.loading-fade-leave-to {
  opacity: 0;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes logoPulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow:
      0 8px 32px rgba(255, 206, 0, 0.2),
      0 2px 8px rgba(0, 0, 0, 0.06);
  }
  50% {
    transform: scale(1.04);
    box-shadow:
      0 12px 40px rgba(255, 206, 0, 0.3),
      0 4px 12px rgba(0, 0, 0, 0.08);
  }
}
@keyframes loadingContentIn {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
