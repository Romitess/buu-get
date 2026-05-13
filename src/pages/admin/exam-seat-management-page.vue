<template>
  <q-page class="q-pa-lg bg-grey-2">
    <div class="max-width-container">
      <!-- Header / Navigation -->
      <div class="row items-center q-mb-lg">
        <AppButton
          icon="arrow_back"
          flat
          round
          color="buu-gray-dark"
          @click="$router.back()"
          class="q-mr-sm"
        />
        <h1 class="text-h4 text-weight-bold q-my-none text-primary">จัดการที่นั่งสอบ</h1>
        <q-space />
        <div class="row q-gutter-sm">
          <AppButton
            label="จัดที่นั่งอัตโนมัติ"
            icon="auto_fix_high"
            outline
            pill
            @click="handleAutoAssign"
          />
          <AppButton label="บันทึกข้อมูล" icon="save" pill @click="handleSave" />
        </div>
      </div>

      <!-- Exam Detail Header -->
      <section class="q-mb-xl">
        <ExamDetailComponent
          badge-text="รอบสอบปัจจุบัน"
          title="BUU-GET รอบเดือนพฤษภาคม 2569"
          subtitle="การทดสอบความรู้ภาษาอังกฤษมาตรฐาน มหาวิทยาลัยบูรพา"
          location-text="ห้องปฏิบัติการคอมพิวเตอร์ 101 อาคารศูนย์คอมพิวเตอร์"
          fee-text="ค่าธรรมเนียม: 500 บาท"
        />
      </section>

      <!-- Student List Section -->
      <section>
        <div class="row items-center q-mb-md">
          <h2 class="text-h5 text-weight-bold q-my-none text-dark">
            รายชื่อผู้เข้าสอบ ({{ students.length }} คน)
          </h2>
          <q-space />
          <q-input
            v-model="searchQuery"
            placeholder="ค้นหาชื่อ หรือ รหัสประจำตัว..."
            outlined
            dense
            bg-color="white"
            class="search-input"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Student Cards Grid -->
        <div class="row q-col-gutter-md">
          <div
            v-for="student in filteredStudents"
            :key="student.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <AppExamSeatCard
              :student-name="student.name"
              :student-id="student.id"
              :seat-number="student.seat"
              :avatar-url="student.avatar"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredStudents.length === 0" class="column items-center q-pa-xl text-grey-6">
          <q-icon name="person_search" size="64px" />
          <div class="text-h6 q-mt-md">ไม่พบรายชื่อผู้เข้าสอบ</div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import AppButton from 'src/components/base/app-button.vue';
import AppExamSeatCard from 'src/components/exam/app-exam-seat-card.vue';
import ExamDetailComponent from 'src/components/exam-detail-component.vue';

// Mock Data
const searchQuery = ref('');
const students = ref([
  { id: '66100003', name: 'นาย สมวิว ใจดี', seat: 'A3', avatar: null },
  { id: '66100004', name: 'นางสาว สมอั๋น ใจดี', seat: null, avatar: null },
  { id: '66100005', name: 'นางสาว สมหยก ใจดี', seat: 'A5', avatar: null },
  { id: '66100006', name: 'นางสาว สมฟ้า ใจดี', seat: 'A6', avatar: null },
  { id: '66100007', name: 'นางสาว สมบุ๊ค ใจดี', seat: 'A7', avatar: null },
  { id: '66100008', name: 'นาย สมชาย รักเรียน', seat: null, avatar: null },
]);

const filteredStudents = computed(() => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return students.value;
  return students.value.filter((s) => s.name.toLowerCase().includes(query) || s.id.includes(query));
});

const handleAutoAssign = () => {
  console.log('Auto assigning seats...');
  // Logic for auto assignment would go here
};

const handleSave = () => {
  console.log('Saving seat assignments...');
  // Logic for saving would go here
};
</script>

<style scoped lang="scss">
.max-width-container {
  max-width: 1200px;
  margin: 0 auto;
}

.search-input {
  width: 300px;
}

h1 {
  font-size: 1.75rem;
}

h2 {
  font-size: 1.25rem;
}

@media (max-width: 600px) {
  .search-input {
    width: 100%;
    margin-top: 1rem;
  }

  .row.items-center.q-mb-md {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
