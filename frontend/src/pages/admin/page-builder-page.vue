<template>
  <q-page class="page-container page-builder-page">
    <!-- Breadcrumbs -->
    <AppBreadcrumbs />

    <!-- Page Header -->
    <AppPageHeader
      :title="t('navigation.manageHomeContent')"
      subtitle="ระบบจัดการและแก้ไขข้อมูลเนื้อหาที่จะแสดงในหน้าหลักสำหรับผู้เข้าสอบ"
    />

    <!-- Mock Content Area -->
    <q-card flat bordered class="q-mt-lg page-builder-card">
      <q-card-section class="text-center q-pa-xl text-container">
        <q-icon name="edit_note" size="84px" color="primary" class="q-mb-md animate-bounce" />
        <div class="text-h5 text-weight-bold text-dark text-title">
          {{ t('navigation.manageHomeContent') }}
        </div>
        <p class="text-subtitle1 text-grey-7 q-mt-md text-desc">
          ส่วนปรับแต่งข้อมูลแบนเนอร์, ปฏิทินรอบสอบ, ข้อมูลการสอบ และระเบียบการในหน้าเว็บแรก (Home Page Editor)
        </p>
        <q-badge color="accent" text-color="white" label="Feature Under Development" class="q-px-md q-py-sm q-mt-lg text-badge" />
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-lg">
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="inner-feature-card">
              <q-card-section class="row items-center no-wrap">
                <q-icon name="view_carousel" size="32px" color="primary" class="q-mr-md" />
                <div>
                  <div class="text-weight-bold">จัดการ Carousel Banner</div>
                  <div class="text-caption text-grey-6">แก้ไขรูปภาพ สไลด์ และข้อมูลภาพรวม BUU-GET</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="inner-feature-card">
              <q-card-section class="row items-center no-wrap">
                <q-icon name="menu_book" size="32px" color="primary" class="q-mr-md" />
                <div>
                  <div class="text-weight-bold">จัดการระเบียบและข้อปฏิบัติ</div>
                  <div class="text-caption text-grey-6">แก้ไขกฎระเบียบวันสอบ Paper-based และ Computer-based</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-md-4">
            <q-card flat bordered class="inner-feature-card">
              <q-card-section class="row items-center no-wrap">
                <q-icon name="contact_support" size="32px" color="primary" class="q-mr-md" />
                <div>
                  <div class="text-weight-bold">จัดการคำถามที่พบบ่อย (FAQ)</div>
                  <div class="text-caption text-grey-6">แก้ไขข้อมูลการติดต่อและคำแนะนำผู้สอบ</div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';

const { t } = useI18n();
</script>

<style scoped lang="scss">
.page-builder-card {
  border-radius: var(--radius-lg) !important;
  box-shadow: var(--shadow-card) !important;
  background: var(--surface-card);
}

.text-title {
  color: var(--text-primary);
}

.text-desc {
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.text-badge {
  font-size: 13px;
  font-weight: 600;
  border-radius: 20px;
}

.inner-feature-card {
  border-radius: var(--radius-md) !important;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    border-color: var(--primary) !important;
    box-shadow: 0 4px 12px rgba(13, 71, 161, 0.08) !important;
    transform: translateY(-2px);
  }
}
</style>
