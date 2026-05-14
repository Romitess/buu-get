<template>
  <q-page class="q-pa-lg" style="background-color: var(--surface-page)">
    <div class="max-width-container">
      <!-- Breadcrumbs -->
      <div class="q-mb-md">
        <q-breadcrumbs class="text-body2" style="color: var(--text-secondary)" active-color="dark">
          <template v-slot:separator>
            <q-icon size="1.2em" name="chevron_right" color="grey-5" />
          </template>
          <q-breadcrumbs-el label="หน้าหลัก" icon="home" />
          <q-breadcrumbs-el label="จัดการรอบสอบ" icon="star" />
          <q-breadcrumbs-el label="จัดการที่นั่งสอบ" icon="star" class="text-weight-bold" />
        </q-breadcrumbs>
      </div>

      <!-- Header -->
      <div class="q-mb-lg">
        <h1 class="text-h4 text-weight-bold q-my-none text-dark">จัดการที่นั่งสอบ</h1>
        <p class="q-mt-sm q-mb-none text-body1" style="color: var(--text-secondary)">
          วางผังและจัดการที่นั่งสอบ เพื่อรองรับผู้เข้าสอบได้อย่างเหมาะสมและสะดวก
        </p>
      </div>

      <!-- Time Tabs -->
      <div class="q-mb-md">
        <q-tabs
          v-model="activeTab"
          dense
          style="color: var(--text-secondary)"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
        >
          <q-tab name="tab1" label="08:00-10:00" class="text-weight-bold" />
          <q-tab name="tab2" label="10:00-12:00" />
          <q-tab name="tab3" label="13:00-15:00" />
          <q-tab name="tab4" label="15:00-17:00" />
        </q-tabs>
        <q-separator />
      </div>

      <!-- Exam Detail Header -->
      <section class="q-mb-lg">
        <AppExamInfoCard
          title="การสอบวัดระดับภาษาอังกฤษ สำหรับบุคคลทั่วไป BUU-GET"
          date="15 พฤษภาคม 2569"
          time="08:00-10:00"
          location="QS1, Burapha University (L402)"
          applicant-count="35"
        />
      </section>

      <!-- Main Layout -->
      <div class="row q-col-gutter-lg items-stretch">
        <!-- Left Panel: Student List -->
        <div class="col-12 col-md-4 flex column">
          <div
            class="bg-white q-pa-lg border-radius-lg full-height"
            style="border: 1px solid var(--border-color)"
          >
            <div class="row items-center justify-between q-mb-md">
              <div class="text-subtitle1 text-weight-bold text-dark">รายชื่อผู้สมัครและที่นั่ง</div>
              <q-badge
                color="primary"
                rounded
                label="35"
                class="q-px-md q-py-xs"
                style="border-radius: 100px; font-size: 14px"
              />
            </div>

            <div class="q-mb-md">
              <SearchBar v-model="searchQuery" full-width @search="handleSearch" />
            </div>

            <!-- Student Cards List -->
            <q-scroll-area style="height: 450px">
              <div class="column q-gutter-y-sm q-pr-md">
                <AppExamSeatCard
                  v-for="student in filteredStudents"
                  :key="student.id"
                  :student-name="student.name"
                  :student-id="student.id"
                  :seat-number="student.seat"
                  :avatar-url="student.avatar"
                />

                <!-- Empty State -->
                <div
                  v-if="filteredStudents.length === 0"
                  class="column items-center q-pa-xl text-grey-6"
                >
                  <q-icon name="person_search" size="48px" />
                  <div class="text-body1 q-mt-sm">ไม่พบรายชื่อผู้เข้าสอบ</div>
                </div>
              </div>
            </q-scroll-area>
          </div>
        </div>

        <!-- Right Panel: Seat Layout -->
        <div class="col-12 col-md-8 flex column">
          <div
            class="bg-white q-pa-lg border-radius-lg full-height flex column"
            style="border: 1px solid var(--border-color)"
          >
            <div class="row items-center justify-between q-mb-lg">
              <div class="text-h6 text-weight-bold text-dark">แผนผังที่นั่งสอบ</div>
              <div class="row items-center q-gutter-x-md">
                <div class="row items-center">
                  <div class="legend-dot available q-mr-sm"></div>
                  <span class="text-body2 text-dark font-weight-medium">ที่ว่าง</span>
                </div>
                <div class="row items-center">
                  <div class="legend-dot assigned q-mr-sm"></div>
                  <span class="text-body2 text-dark font-weight-medium">จัดที่นั่งแล้ว</span>
                </div>
              </div>
            </div>

            <!-- Seat Grid -->
            <div class="seat-grid-container q-mb-auto">
              <div class="seat-grid">
                <AppExamSeatSquare
                  v-for="seat in allSeats"
                  :key="seat.id"
                  :seat-number="seat.id"
                  :status="seat.status"
                  @click="handleSeatClick(seat)"
                />
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="row justify-end q-mt-xl q-gutter-md">
              <AppButton
                label="ยกเลิกการจัด"
                class="text-dark"
                style="
                  background-color: var(--neutral-gray-light);
                  border-radius: 8px;
                  padding: 8px 24px;
                "
                @click="handleCancel"
              />
              <AppButton
                label="ยืนยันการจัดที่นั่ง"
                color="primary"
                style="border-radius: 8px; padding: 8px 24px"
                @click="handleSave"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppButton from 'src/components/base/app-button.vue';
import AppExamSeatCard from 'src/components/exam/app-exam-seat-card.vue';
import AppExamInfoCard from 'src/components/exam/app-exam-info-card.vue';
import SearchBar from 'src/components/shared/SearchBar.vue';
import AppExamSeatSquare from 'src/components/exam/app-exam-seat-square.vue';

const activeTab = ref('tab1');
const searchQuery = ref('');

// Mock Data for Students
const students = ref([
  { id: '66100004', name: 'นางสาว สมอั๋น ใจดี', seat: null, avatar: null },
  { id: '66100001', name: 'นาย สมครีม ใจดี', seat: 'A1', avatar: null },
  { id: '66100002', name: 'นาย สมกบ ใจดี', seat: 'A2', avatar: null },
  { id: '66100003', name: 'นาย สมวิว ใจดี', seat: 'A3', avatar: null },
]);

const filteredStudents = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return students.value;
  return students.value.filter((s) => s.name.toLowerCase().includes(query) || s.id.includes(query));
});

const handleSearch = (val: string | number | null) => {
  searchQuery.value = String(val || '');
};

// Mock Data for Seats (A1-A10, B1-B10, C1-C10, D1-D10)
const allSeats = ref<{ id: string; status: 'available' | 'assigned' }[]>([]);

// Initialize seats matching the image exactly
const initializeSeats = () => {
  const rows = ['A', 'B', 'C', 'D'];
  for (const row of rows) {
    for (let i = 1; i <= 10; i++) {
      const id = `${row}${i}`;
      // In image, D6 to D10 are available, rest are assigned
      const isAvailable = row === 'D' && i >= 6;
      allSeats.value.push({ id, status: isAvailable ? 'available' : 'assigned' });
    }
  }
};
initializeSeats();

const handleSeatClick = (seat: { id: string; status: 'available' | 'assigned' }) => {
  console.log('Clicked seat:', seat.id);
  // Optional toggle logic for demo:
  // seat.status = seat.status === 'assigned' ? 'available' : 'assigned';
};

const handleCancel = () => {
  console.log('Cancel assigning seats...');
};

const handleSave = () => {
  console.log('Saving seat assignments...');
};
</script>

<style scoped lang="scss">
.max-width-container {
  width: 100%;
  margin: 0 auto;
}

h1 {
  font-size: 1.75rem;
  letter-spacing: -0.5px;
}

.border-radius-lg {
  border-radius: 12px !important;
}

.legend-dot {
  width: 18px;
  height: 18px;
  border-radius: 4px; /* Rounded square like Figma */

  &.available {
    background-color: var(--surface-card);
    border: 1.5px solid var(--neutral-400);
  }

  &.assigned {
    background-color: var(--primary-light); // Matches the blue color in image
  }
}

.seat-grid-container {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 24px;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 12px;
}

/* Custom Scrollbar for the container if it overflows */
.seat-grid-container::-webkit-scrollbar {
  height: 6px;
}

.seat-grid-container::-webkit-scrollbar-track {
  background: transparent;
}

.seat-grid-container::-webkit-scrollbar-thumb {
  background: rgba(108, 108, 108, 0.3);
  border-radius: 3px;
}

.font-weight-medium {
  font-weight: 500;
}
</style>
