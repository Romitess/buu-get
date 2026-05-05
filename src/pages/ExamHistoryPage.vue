<template>
  <q-page class="exam-history-page q-pa-lg">
    <!-- Page Header -->
    <div class="page-header q-mb-xl">
      <h1 class="text-h5 text-weight-bold q-mb-xs">ประวัติการสอบและการลงทะเบียน</h1>
      <p class="text-body2 text-grey-8">
        จัดการเป้าหมายทางการศึกษาของคุณ
        โปรดชำระเงินที่ค้างอยู่ให้เสร็จสิ้นเพื่อยืนยันที่นั่งสำหรับการสอบในรอบถัดไป
      </p>
    </div>

    <!-- History Section -->
    <div class="history-section">
      <div class="section-title row items-center q-mb-md">
        <q-icon name="schedule" size="24px" color="negative" class="q-mr-sm" />
        <span class="text-weight-bold text-subtitle1">ประวัติการลงทะเบียนหรือการสอบ</span>
      </div>

      <div class="q-gutter-y-md">
        <!-- Card 1: รอการชำระเงิน -->
        <AppExamHistoryCard
          status-label="รอการชำระเงิน"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
          :fee="500"
        >
          <template #actions>
            <AppButton outline color="grey-8" label="ยกเลิกการสมัคร" class="action-btn" />
            <AppButton icon="payments" label="ชำระเงิน" color="primary" class="action-btn" />
          </template>
        </AppExamHistoryCard>

        <!-- Card 2: รอการชำระเงิน (มีเวลานับถอยหลัง) -->
        <AppExamHistoryCard
          status-label="รอการชำระเงิน"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
          :fee="500"
          deadline="29:30"
        >
          <template #actions>
            <AppButton outline color="grey-8" label="ยกเลิกการสมัคร" class="action-btn" />
            <AppButton icon="payments" label="ชำระเงิน" color="primary" class="action-btn" />
          </template>
        </AppExamHistoryCard>

        <!-- Card 3: กำลังตรวจสอบ -->
        <AppExamHistoryCard
          status-label="กำลังตรวจสอบ"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
        </AppExamHistoryCard>

        <!-- Card 4: ตรวจสอบเสร็จสิ้น (แค่ใบเสร็จ) -->
        <AppExamHistoryCard
          status-label="ตรวจสอบเสร็จสิ้น"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
          <template #actions>
            <AppButton
              icon="receipt_long"
              label="ดาวน์โหลดใบเสร็จ"
              color="primary"
              class="action-btn"
            />
          </template>
        </AppExamHistoryCard>

        <!-- Card 5: ตรวจสอบเสร็จสิ้น (มีบัตรสอบ) -->
        <AppExamHistoryCard
          status-label="ตรวจสอบเสร็จสิ้น"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
          <template #actions>
            <AppButton
              icon="file_download"
              label="บัตรประจำตัวผู้สอบ"
              color="primary"
              class="action-btn"
            />
            <AppButton
              icon="receipt_long"
              label="ดาวน์โหลดใบเสร็จ"
              color="primary"
              class="action-btn"
            />
          </template>
        </AppExamHistoryCard>

        <!-- Card 6: รอการประเมินผล -->
        <AppExamHistoryCard
          status-label="รอการประเมินผล"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
        </AppExamHistoryCard>

        <!-- Card 7: เสร็จสิ้นการสอบ (ผ่าน) -->
        <AppExamHistoryCard
          status-label="เสร็จสิ้นการสอบ"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
          <template #status-append>
            <div class="custom-status success-status row items-center q-ml-sm">
              <q-icon name="check" size="16px" class="q-mr-xs" />
              <span>สถานะ : ผ่าน</span>
            </div>
          </template>
          <template #actions>
            <AppButton outline color="grey-8" label="รายละเอียดคะแนน" class="action-btn" />
            <AppButton
              icon="file_download"
              label="ใบประกาศนียบัตร"
              color="primary"
              class="action-btn"
            />
          </template>
        </AppExamHistoryCard>

        <!-- Card 8: เสร็จสิ้นการสอบ (ไม่ผ่าน) -->
        <AppExamHistoryCard
          status-label="เสร็จสิ้นการสอบ"
          status-type="primary"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
          <template #status-append>
            <div class="custom-status warning-status row items-center q-ml-sm">
              <q-icon name="warning_amber" size="18px" class="q-mr-xs" />
              <span class="text-weight-bold">สถานะ : ไม่ผ่าน</span>
            </div>
          </template>
          <template #actions>
            <AppButton outline color="grey-8" label="รายละเอียดคะแนน" class="action-btn" />
          </template>
        </AppExamHistoryCard>

        <!-- Card 9: ถูกยกเลิก -->
        <AppExamHistoryCard
          status-label="ถูกยกเลิก"
          status-type="info"
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 เมษายน 2569"
          time="08:00-10:00"
          location="Computer Center, BUU (L201)"
        >
          <template #status-append>
            <div class="custom-status warning-status row items-center q-ml-sm">
              <q-icon name="warning_amber" size="18px" class="q-mr-xs" />
              <span class="text-weight-bold">หมดเวลาการชำระเงิน</span>
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
  h1 {
    font-size: 24px;
    line-height: 1.2;
    color: var(--text-primary, #1d1d1f);
  }
}

.section-title {
  color: var(--text-primary, #1d1d1f);
}

.action-btn {
  min-width: 140px;
  height: 44px;
  border-radius: var(--radius-sm, 8px);
  font-weight: 700;
}

.custom-status {
  font-size: 13px;
  font-weight: 600;

  &.success-status {
    color: var(--badge-success-dot, #4caf50);
  }

  &.warning-status {
    color: var(--badge-error-dot, #f44336);
  }
}
</style>
