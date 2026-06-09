<template>
  <!-- ─── (1,1) รูปภาพ + ข้อกำหนดรูปภาพ 6 ข้อ ─── -->
  <div class="photo-section">
    <!-- Upload Box -->
    <div class="photo-upload-cell">
      <ImageUpload
        v-model="profileImage"
        folder="/user_images"
        :alt="t('profile.photoRequirementsTitle')"
        class="photo-upload-box"
      />
    </div>
    <!-- Requirements Box -->
    <div class="requirements-cell">
      <div class="requirements-card bg-white">
        <div class="requirements-title">
          {{ t('profile.photoRequirementsTitle') }}
        </div>
        <div class="requirements-content">
          <div class="requirements-copy">
            <ul class="requirements-list">
              <li>{{ t('profile.photoReq1') }}</li>
              <li>{{ t('profile.photoReq2') }}</li>
              <li>{{ t('profile.photoReq3') }}</li>
              <li>{{ t('profile.photoReq4') }}</li>
              <li>{{ t('profile.photoReq5') }}</li>
              <li>{{ t('profile.photoReq6') }}</li>
            </ul>
          </div>
          <div class="requirements-sample">
            <div class="sample-photo-container">
              <img
                src="/sample-img.png"
                :alt="t('profile.samplePhotoAlt')"
                class="sample-photo-img"
              />
            </div>
            <div class="sample-photo-text">
              {{ t('profile.samplePhoto') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import ImageUpload from 'src/components/base/image-upload.vue';

const { t } = useI18n();

const profileImage = defineModel<string>('profileImage', { required: true });
</script>

<style scoped lang="scss">
.photo-section {
  display: grid;
  grid-template-columns: 161px minmax(0, 1fr);
  gap: 12px;
  height: 100%; // เต็มความสูงของเซลล์ (1,1)
  font-family: var(--font-family-base);
}

.photo-upload-cell,
.requirements-cell {
  min-width: 0;
  display: flex; // ให้ลูกยืดเต็มความสูง
}

.photo-upload-box {
  width: 100%;
  height: 100%;
  min-height: 160px; // ความสูงขั้นต่ำเมื่อแถวเตี้ย
  border-radius: var(--radius-sm);
}

.requirements-card {
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  min-height: auto;
  padding: 16px 19px 12px;
}

.requirements-title {
  margin-bottom: 8px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.requirements-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 93px;
  align-items: center;
  gap: 15px;
}

.requirements-copy {
  min-width: 0;
}

.requirements-list {
  margin: 0;
  list-style-type: none;
  padding-left: 0;
  font-size: 14px;
  line-height: 1.65;
}

.requirements-sample {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sample-photo-text {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.2;
}

.sample-photo-container {
  width: 93px;
  aspect-ratio: 4 / 5;
  border-radius: var(--radius-xs);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.sample-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 1200px) {
  .photo-section {
    grid-template-columns: 121px minmax(0, 1fr);
  }

  .photo-upload-box {
    height: 147px;
    min-height: 147px;
  }

  .requirements-card {
    min-height: auto;
    padding: 12px 11px 9px;
  }

  .requirements-content {
    grid-template-columns: minmax(0, 1fr) 64px;
    gap: 9px;
  }

  .requirements-list {
    font-size: 11px;
  }

  .sample-photo-container {
    width: 64px;
  }
}

@media (max-width: 600px) {
  .photo-section {
    grid-template-columns: 1fr;
  }

  .photo-upload-box {
    max-width: 161px;
  }
}
</style>
