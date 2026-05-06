<template>
  <q-page class="register-page-bg flex flex-center">
    <!-- Centered Container with equal side margins -->
    <div class="register-container row no-wrap items-stretch">
      <!-- Left Side (Logo) - Blue Panel -->
      <div class="logo-panel flex flex-center">
        <img src="~assets/img/BUU-GET LOGO.png" alt="BUU-GET Logo" class="large-logo" />
      </div>

      <!-- Right Side (Register Form) - White Panel -->
      <div class="form-panel flex flex-center">
        <RegisterCard />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import RegisterCard from 'src/components/RegisterCard.vue';

// หมายเหตุ: โลจิกเดิมสำหรับการ Validate และการเรียกใช้ UserStore
// สามารถนำไปประยุกต์ใส่ใน RegisterCard.vue ได้ในภายหลังเมื่อต้องการต่อ API ครับ
</script>

<style scoped>
.register-layout {
  position: relative;
}

.register-page-bg {
  background-color: #eef1f6;
  min-height: 100vh;
}

.register-container {
  width: 94%;
  max-width: 1100px; /* ปรับลดความกว้างลงจาก 1400px เพื่อไม่ให้ดูกว้างเกินไป (อ้วนไป) */
  margin: 0 auto;
  min-height: 580px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
}

/* Panel สีน้ำเงินฝั่งซ้าย (โลโก้) */
.logo-panel {
  flex: 1;
  background-color: #0d47a1;
  padding: 2rem;
}

.large-logo {
  max-width: 80%;
  max-height: 60vh;
  object-fit: contain;
}

/* Panel สีขาวฝั่งขวา (ฟอร์ม) */
.form-panel {
  flex: 0 0 52%;
  max-width: 52%;
  background-color: #ffffff;
  padding: 2.5rem 3rem;
  z-index: 2; /* ให้อยู่เหนือ panel สีน้ำเงิน */
  border-top-left-radius: 36px;
  border-bottom-left-radius: 36px;
  margin-left: -32px; /* ดึงกล่องสีขาวให้ซ้อนทับกล่องสีน้ำเงิน */
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.25); /* เงาเข้มขึ้น พาดไปทางซ้ายทับสีน้ำเงินให้ดูเหมือนซ้อนทับกันชัดเจน */
}

/* ซ่อนโลโก้ด้านซ้ายในหน้าจอมือถือ (ให้โชว์เฉพาะฟอร์มสมัครสมาชิก) */
@media (max-width: 1023px) {
  .logo-panel {
    display: none;
  }
  .form-panel {
    flex: 0 0 100%;
    max-width: 100%;
  }
  .register-container {
    width: 95%;
    max-width: 480px;
  }
}
</style>
