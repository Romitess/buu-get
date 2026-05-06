<template>
  <div class="login-root">
    <!-- ===== Global Background Decorations ===== -->
    <div class="geo geo-1"></div>
    <div class="geo geo-2"></div>
    <div class="geo geo-3"></div>
    <div class="geo geo-4"></div>
    <div class="geo geo-5"></div>
    <div class="geo geo-6"></div>
    <div class="grid-lines"></div>

    <!-- ===== LEFT PANEL: Brand & Visual ===== -->
    <div class="left-panel">
      <div class="left-content">
        <!-- BUU-GET wordmark pill (text only) -->
        <div class="brand-pill">
          <div class="pill-wordmark">
            <span class="pill-buu">BUU</span><span class="pill-dash">-</span
            ><span class="pill-get">GET</span>
          </div>
        </div>

        <!-- BUU-GET main logo image -->
        <div class="brand-logo-wrap">
          <img src="~assets/img/BUU-GET LOGO.png" alt="BUU-GET Logo" class="brand-logo-img" />
        </div>

        <div class="brand-headline">
          <p>ระบบทดสอบวัดความสามารถทางภาษาอังกฤษ</p>
        </div>
      </div>
    </div>

    <!-- ===== RIGHT PANEL: Login Form ===== -->
    <div class="right-panel">
      <div class="form-center">
        <LoginCard />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LoginCard from 'src/components/LoginCard.vue';
</script>

<style scoped lang="scss">
// ============================================================
// Root
// ============================================================
.login-root {
  display: flex;
  min-height: 100dvh;
  overflow: hidden;
  font-family: 'Inter', 'Noto Sans Thai', sans-serif;
  background: linear-gradient(145deg, #0a2468 0%, #0d47a1 55%, #1565c0 100%);
  position: relative;
}

// ============================================================
// PANELS
// ============================================================
.left-panel {
  position: relative;
  flex: 1.1;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;

  @media (max-width: 1024px) {
    display: none;
  }
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  padding: 40px 32px 32px;
  position: relative;
  z-index: 1;
}

// ============================================================
// Geometric CSS art (Fixed position to cover whole page)
// ============================================================
.geo {
  position: fixed;
  border-radius: 50%;
  opacity: 0.12;
  pointer-events: none;
  z-index: 0;
}

.geo-1 {
  width: 560px;
  height: 560px;
  background: radial-gradient(circle, #4dabf5 0%, transparent 70%);
  top: -180px;
  right: -120px;
  animation: pulse 8s ease-in-out infinite;
}

.geo-2 {
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, #82b1ff 0%, transparent 70%);
  bottom: -100px;
  left: -80px;
  animation: pulse 10s ease-in-out 2s infinite;
}

.geo-3 {
  width: 200px;
  height: 200px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 0;
  top: 15%;
  left: 12%;
  transform: rotate(30deg);
  animation: spin 30s linear infinite;
  opacity: 0.3;
}

.geo-4 {
  width: 110px;
  height: 110px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 0;
  bottom: 20%;
  right: 15%;
  transform: rotate(15deg);
  animation: spin 20s linear reverse infinite;
  opacity: 0.35;
}

.geo-5 {
  width: 70px;
  height: 70px;
  background: rgba(255, 255, 255, 0.07);
  top: 50%;
  left: 8%;
  transform: rotate(45deg);
  border-radius: 8px;
  animation: float 6s ease-in-out infinite;
}

.geo-6 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #64b5f6 0%, transparent 70%);
  top: 30%;
  right: 5%;
  opacity: 0.1;
  animation: pulse 12s ease-in-out 4s infinite;
}

.grid-lines {
  position: fixed;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
  z-index: 0;
}

// ============================================================
// Left Content Styles
// ============================================================
.left-content {
  position: relative;
  z-index: 2;
  padding: 48px;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 0;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 100px;
  padding: 10px 24px;
  margin-bottom: 32px;
  animation: fadeInDown 0.7s ease-out;

  .pill-wordmark {
    display: inline-flex;
    align-items: baseline;
    gap: 0;
  }

  .pill-buu {
    font-size: 1.1rem;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -0.01em;
  }

  .pill-dash {
    font-size: 1.1rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.5);
    margin: 0 2px;
  }

  .pill-get {
    font-size: 1.1rem;
    font-weight: 900;
    color: #90caf9;
    letter-spacing: -0.01em;
  }
}

.brand-logo-wrap {
  margin-bottom: 24px;
  animation: fadeInUp 0.7s ease-out 0.05s both;

  .brand-logo-img {
    max-width: 260px;
    width: 100%;
    object-fit: contain;
    filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.3)) brightness(1.05);
  }
}

.brand-headline {
  animation: fadeInUp 0.7s ease-out 0.15s both;

  p {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.7;
    margin-bottom: 40px;
  }
}

// ============================================================
// Right Content Styles
// ============================================================
.form-center {
  width: 100%;
  max-width: 420px;
  animation: fadeIn 0.7s ease-out;
}

.login-footer {
  width: 100%;
  text-align: center;
  padding-top: 20px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;

  .footer-sep {
    color: rgba(255, 255, 255, 0.2);
  }
}

// ============================================================
// Animations
// ============================================================
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.12;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.18;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%,
  100% {
    transform: rotate(45deg) translateY(0);
  }
  50% {
    transform: rotate(45deg) translateY(-14px);
  }
}
</style>
