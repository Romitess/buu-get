<template>
  <q-page class="page-container surface-page-bg">
    <!-- Header -->
    <AppBreadcrumbs />
    <AppPageHeader
      title="สร้างห้องสอบ"
      subtitle="จัดการข้อมูลห้องสอบ เพื่อรองรับการจัดสอบได้อย่างเป็นระบบและมีประสิทธิภาพ"
    />

    <div class="row q-col-gutter-md" style="margin-top: -12px">
      <!-- Left Panel: Form Settings -->
      <div class="col-12 col-md-4">
        <div class="form-card">
          <div class="form-section">
            <div class="row items-center q-mb-sm">
              <q-icon name="info_outline" color="primary" size="sm" class="q-mr-sm" />
              <div class="text-h6 text-weight-bold text-black">ข้อมูลห้องสอบ</div>
            </div>
            <q-separator class="q-mb-md" color="grey-4" />

            <div class="q-gutter-y-md q-mb-md q-pt-sm">
              <div>
                <div class="buu-label-muted q-mb-xs">ชื่อห้องสอบ</div>
                <q-input
                  v-model="roomName"
                  outlined
                  dense
                  placeholder="QS1-1001"
                  class="buu-input-muted"
                  hide-bottom-space
                />
              </div>

              <div>
                <div class="buu-label-muted q-mb-xs">ชั้นที่สอบ</div>
                <q-input
                  v-model="floor"
                  type="number"
                  outlined
                  dense
                  placeholder="1"
                  class="buu-input-muted"
                  hide-bottom-space
                />
              </div>

              <div>
                <div class="buu-label-muted q-mb-xs">สถานที่/อาคาร</div>
                <q-input
                  v-model="building"
                  outlined
                  dense
                  placeholder="อาคาร 60 พรรษา"
                  class="buu-input-muted"
                  hide-bottom-space
                />
              </div>
            </div>
          </div>

          <div class="form-section">
            <div class="row items-center q-mb-xs">
              <q-icon name="grid_view" color="primary" size="sm" class="q-mr-sm" />
              <div class="text-h6 text-weight-bold text-black">ตั้งค่าผังที่นั่ง</div>
            </div>
            <q-separator class="q-mb-md" color="grey-4" />

            <div class="row q-col-gutter-sm q-mb-md">
              <div class="col-6">
                <div class="buu-label-muted q-mb-xs">แถว (Rows)</div>
                <q-input
                  v-model.number="rows"
                  type="number"
                  outlined
                  dense
                  placeholder="1"
                  class="buu-input-muted"
                  hide-bottom-space
                  min="1"
                />
              </div>
              <div class="col-6">
                <div class="buu-label-muted q-mb-xs">คอลัมน์ (Cols)</div>
                <q-input
                  v-model.number="cols"
                  type="number"
                  outlined
                  dense
                  placeholder="1"
                  class="buu-input-muted"
                  hide-bottom-space
                  min="1"
                />
              </div>
            </div>

            <!-- Split Toggle -->
            <div
              class="bg-grey-2 rounded-borders q-mb-md row items-center justify-between"
              style="padding: 12px 16px"
            >
              <span class="text-body2 text-dark font-weight-medium">แบ่งซ้าย-ขวา</span>
              <q-toggle v-model="splitLeftRight" class="buu-toggle-muted" color="primary" />
            </div>

            <!-- Total Seats Box -->
            <div class="total-seats-box column flex-center rounded-borders" style="padding: 16px">
              <div class="text-primary text-h4 text-weight-bold">{{ totalSeats }}</div>
              <div class="text-caption text-grey-8">จำนวนที่นั่งทั้งหมด</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Preview & Save -->
      <div class="col-12 col-md-8">
        <div class="buu-premium-card q-pa-md full-height column">
          <!-- Seat Preview Component -->
          <AppExamSeatPreview :rows="rows" :cols="cols" :split-left-right="splitLeftRight" />
        </div>

        <!-- Save Button -->
        <div class="row justify-end q-mt-md">
          <AppButton
            label="บันทึก"
            color="primary"
            class="text-weight-bold q-px-xl"
            style="border-radius: 8px; min-width: 140px"
            @click="handleSave"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import AppPageHeader from 'src/components/shared/app-page-header.vue';
import AppBreadcrumbs from 'src/components/shared/app-breadcrumbs.vue';
import AppButton from 'src/components/base/app-button.vue';
import AppExamSeatPreview from 'src/components/exam/app-exam-seat-preview.vue';

const router = useRouter();
const $q = useQuasar();

const roomName = ref('');
const floor = ref<number | null>(null);
const building = ref('');
const rows = ref<number | null>(null);
const cols = ref<number | null>(null);
const splitLeftRight = ref(false);

const totalSeats = computed(() => {
  return (rows.value || 0) * (cols.value || 0);
});

const handleSave = () => {
  $q.notify({
    type: 'positive',
    message: 'บันทึกข้อมูลห้องสอบเรียบร้อยแล้ว',
    position: 'top',
  });
  void router.push({ name: 'admin-location-management' });
};
</script>

<style scoped lang="scss">
.surface-page-bg {
  background-color: var(--surface-page);
}
.total-seats-box {
  background-color: var(--location-total-seats-bg);
}
.form-card {
  width: 100%;
  max-width: 400px;
  height: 669px;
  border-radius: 8px;
  padding: 24px;
  background: var(--surface-card);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 24px;
  justify-content: flex-start;
}
</style>
