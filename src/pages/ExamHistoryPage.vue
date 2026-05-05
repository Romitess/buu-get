<template>
  <q-page class="exam-history-page q-pa-lg">
    <!-- Page Header -->
    <div class="page-header q-mb-xl">
      <h1 class="page-title">{{ $t('exam.history.pageTitle') }}</h1>
      <p class="page-subtitle">
        {{ $t('exam.history.pageDescription') }}
      </p>
    </div>

    <!-- History Section -->
    <div class="history-section">
      <div class="section-title row items-center q-mb-md">
        <q-icon name="schedule" size="24px" style="color: var(--badge-error-dot)" class="q-mr-sm" />
        <span class="text-weight-bold text-subtitle1">{{ $t('exam.history.sectionTitle') }}</span>
      </div>

      <div class="q-gutter-y-md">
        <!-- Card 1: รอการชำระเงิน -->
        <AppExamHistoryCard
          :status-label="$t('exam.status.pending')"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
          :fee="500"
        >
          <template #actions>
            <AppButton outline :label="$t('exam.history.cancel')" class="action-btn btn-cancel" />
            <AppButton icon="payments" :label="$t('exam.history.pay')" class="action-btn pay-btn" />
          </template>
        </AppExamHistoryCard>

        <!-- Card 2: รอการชำระเงิน (มีเวลานับถอยหลัง) -->
        <AppExamHistoryCard
          :status-label="$t('exam.status.pending')"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
          :fee="500"
          deadline="29:30"
        >
          <template #actions>
            <AppButton outline :label="$t('exam.history.cancel')" class="action-btn btn-cancel" />
            <AppButton icon="payments" :label="$t('exam.history.pay')" class="action-btn pay-btn" />
          </template>
        </AppExamHistoryCard>

        <!-- Card 3: กำลังตรวจสอบ -->
        <AppExamHistoryCard
          :status-label="$t('exam.status.verifying')"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
        </AppExamHistoryCard>

        <!-- Card 4: ตรวจสอบเสร็จสิ้น (แค่ใบเสร็จ) -->
        <AppExamHistoryCard
          :status-label="$t('exam.status.verified')"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
          <template #actions>
            <AppButton
              icon="receipt_long"
              :label="$t('exam.history.downloadReceipt')"
              class="action-btn pay-btn"
            />
          </template>
        </AppExamHistoryCard>

        <!-- Card 5: ตรวจสอบเสร็จสิ้น (มีบัตรสอบ) -->
        <AppExamHistoryCard
          :status-label="$t('exam.status.verified')"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
          <template #actions>
            <AppButton
              icon="file_download"
              :label="$t('exam.history.candidateCard')"
              class="action-btn pay-btn"
            />
            <AppButton
              icon="receipt_long"
              :label="$t('exam.history.downloadReceipt')"
              class="action-btn pay-btn"
            />
          </template>
        </AppExamHistoryCard>

        <!-- Card 6: รอการประเมินผล -->
        <AppExamHistoryCard
          :status-label="$t('exam.status.evaluating')"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
        </AppExamHistoryCard>

        <!-- Card 7: เสร็จสิ้นการสอบ (ผ่าน) -->
        <AppExamHistoryCard
          :status-label="$t('exam.status.completed')"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
          <template #status-append>
            <div class="custom-status success-status row items-center q-ml-md">
              <q-icon
                name="check"
                size="24px"
                style="color: var(--badge-success-dot)"
                class="q-mr-xs"
              />
              <span>สถานะ : {{ $t('exam.status.passed') }}</span>
            </div>
          </template>
          <template #actions>
            <AppButton
              outline
              :label="$t('exam.history.scoreDetails')"
              class="action-btn btn-cancel"
            />
            <AppButton
              icon="file_download"
              :label="$t('exam.history.certificate')"
              class="action-btn pay-btn"
            />
          </template>
        </AppExamHistoryCard>

        <!-- Card 8: เสร็จสิ้นการสอบ (ไม่ผ่าน) -->
        <AppExamHistoryCard
          :status-label="$t('exam.status.completed')"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
          <template #status-append>
            <div class="custom-status error-status row items-center q-ml-md">
              <q-icon
                name="warning_amber"
                size="24px"
                style="color: var(--badge-error-dot)"
                class="q-mr-xs"
              />
              <span>สถานะ : {{ $t('exam.status.failed') }}</span>
            </div>
          </template>
          <template #actions>
            <AppButton
              outline
              :label="$t('exam.history.scoreDetails')"
              class="action-btn btn-cancel"
            />
          </template>
        </AppExamHistoryCard>

        <!-- Card 9: ถูกยกเลิก -->
        <AppExamHistoryCard
          :status-label="$t('exam.status.cancelled')"
          status-type="info"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 เมษายน 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
          <template #status-append>
            <div class="custom-status error-status row items-center q-ml-md">
              <q-icon
                name="warning_amber"
                size="24px"
                style="color: var(--badge-error-dot)"
                class="q-mr-xs"
              />
              <span class="text-weight-bold">{{ $t('exam.status.paymentTimeout') }}</span>
            </div>
          </template>
        </AppExamHistoryCard>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import AppExamHistoryCard from 'src/components/exam/AppExamHistoryCard.vue';
import AppButton from 'src/components/base/AppButton.vue';
</script>

<style scoped lang="scss">
.exam-history-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-top: 20px;
  .page-title {
    font-size: 28px;
    font-weight: 800;
    line-height: 1.4;
    color: var(--text-primary);
    margin: 0 0 8px 0;
  }
  .page-subtitle {
    font-family: 'Sarabun', sans-serif;
    font-size: 15px;
    color: var(--text-primary); // Changed to primary (black) for more intensity
    font-weight: 800;
    max-width: 900px;
    line-height: 24px;
    margin: 0;
    letter-spacing: 0px;
  }
}

.section-title {
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
}

.action-btn {
  min-width: 140px;
  height: 44px;
  border-radius: var(--radius-sm);
  font-weight: 700;

  &.btn-cancel {
    color: var(--text-primary) !important;
    border-color: var(--border-color) !important;
    &:hover {
      background: rgba(0, 0, 0, 0.02) !important;
    }
  }

  &.pay-btn {
    background-color: var(--primary) !important;
    color: var(--text-on-primary) !important;
    :deep(.q-icon) {
      color: var(--text-on-primary) !important;
    }
  }
}

.custom-status {
  font-size: 14px;
  font-weight: 700;

  &.success-status {
    color: var(--badge-success-dot);
  }

  &.error-status {
    color: var(--badge-error-dot);
  }

  &.warning-status {
    color: var(--badge-warning-dot);
  }
}
</style>
