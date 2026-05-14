<template>
  <q-page class="registrant-detail-page q-px-lg q-px-sm-xl q-py-lg">
    <div class="full-width">
      <AppPageHeader
        :breadcrumbs="breadcrumbs"
        title="ตรวจสอบข้อมูลการสมัครสอบ"
        subtitle="ตรวจสอบข้อมูลผู้สมัครสอบเพื่ออนุมัติหรือแจ้งแก้ไขก่อนพิมพ์บัตรสอบ"
      />

      <div v-if="isLoading" class="flex flex-center q-pa-xl">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <main v-else-if="enrollment">
        <RegistrantPersonalDetail :enrollment="enrollment" />

        <div class="action-container row justify-end q-mt-sm q-gutter-sm q-gutter-md-md">
          <AppButton
            label="ยกเลิก"
            color="grey-3"
            text-color="dark"
            unelevated
            class="action-btn col-12 col-sm-auto"
            @click="goBack"
          />
          <AppButton
            label="แจ้งข้อมูลให้แก้ไข"
            color="negative"
            unelevated
            class="action-btn col-12 col-sm-auto"
            @click="showFixDialog = true"
          />
          <AppButton
            label="ยืนยันการตรวจสอบ"
            color="primary"
            unelevated
            class="action-btn col-12 col-sm-auto"
            @click="handleVerify"
          />
        </div>
      </main>

      <section v-else class="text-center q-pa-xl">
        <q-icon name="error_outline" size="64px" color="negative" />
        <h2 class="text-h6 q-mt-md">ไม่พบข้อมูลการสมัครสอบ</h2>
        <AppButton label="กลับไปหน้าหลัก" color="primary" class="q-mt-lg" @click="goBack" />
      </section>
    </div>

    <RequestFixDialog
      v-model="showFixDialog"
      :full-name="registrantName"
      :reg-id="registrantRegId"
      :exam-date="examDateFormatted"
      @submit="handleFixSubmit"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar, date } from 'quasar';
import AppButton from 'src/components/base/app-button.vue';
import RegistrantPersonalDetail from 'src/components/registrant-personal-detail.vue';
import RequestFixDialog from 'src/components/request-fix-dialog.vue';
import AppPageHeader, { type BreadcrumbItem } from 'src/components/shared/app-page-header.vue';
import { fetchEnrollmentById, updateEnrollmentStatus } from 'src/services/enrollment.service';
import { VerifyStatus } from 'src/types/enrollment.types';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const enrollment = ref<BackendEnrollmentDetail | null>(null);
const isLoading = ref(true);
const showFixDialog = ref(false);

const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: 'หน้าหลัก', icon: 'home', to: { name: 'admin-dashboard' } },
  { label: 'จัดการการสอบ', icon: 'star', to: { name: 'admin-exam-management' } },
  {
    label: 'จัดการรายชื่อผู้เข้าสอบ',
    icon: 'star',
    to: enrollment.value
      ? { name: 'admin-exam-registrants', params: { examId: enrollment.value.SESSION.EXAM_ID } }
      : undefined,
  },
  { label: 'ตรวจสอบข้อมูลการสมัครสอบ', icon: 'star' },
]);

const registrantName = computed(
  () => enrollment.value?.USER?.PROFILE?.userFullnameTh || 'ไม่ทราบชื่อ',
);
const registrantRegId = computed(
  () => `EX-2025-${String(enrollment.value?.ERM_ID || 0).padStart(5, '0')}`,
);
const examDateFormatted = computed(() => {
  const examDate = enrollment.value?.SESSION?.EXAM?.EXAM_DATE;
  return examDate ? date.formatDate(examDate, 'DD MMM YYYY') : 'ไม่ระบุวันสอบ';
});

const loadData = async (): Promise<void> => {
  const ermId = Number(route.params.ermId);
  if (isNaN(ermId)) {
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  try {
    enrollment.value = await fetchEnrollmentById(ermId);
  } catch (error) {
    console.error('Error fetching enrollment:', error);
    $q.notify({
      type: 'negative',
      message: 'ไม่สามารถดึงข้อมูลได้',
    });
  } finally {
    isLoading.value = false;
  }
};

const goBack = (): void => {
  router.back();
};

const handleFixSubmit = async (): Promise<void> => {
  if (!enrollment.value) return;

  try {
    await updateEnrollmentStatus(enrollment.value.ERM_ID, {
      ERM_VERIFY_STATUS: VerifyStatus.WAIT_FIXED,
    });

    $q.notify({
      type: 'positive',
      message: 'ส่งคืนเพื่อแก้ไขเรียบร้อยแล้ว',
    });

    void router.push({
      name: 'admin-exam-registrants',
      params: { examId: enrollment.value.SESSION.EXAM_ID },
    });
  } catch (error) {
    console.error('Error updating status:', error);
    $q.notify({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
    });
  }
};

const handleVerify = async (): Promise<void> => {
  if (!enrollment.value) return;

  try {
    await updateEnrollmentStatus(enrollment.value.ERM_ID, {
      ERM_VERIFY_STATUS: VerifyStatus.PASS,
    });

    $q.notify({
      type: 'positive',
      message: 'ยืนยันการตรวจสอบสำเร็จ',
    });

    void router.push({
      name: 'admin-exam-registrants',
      params: { examId: enrollment.value.SESSION.EXAM_ID },
    });
  } catch (error) {
    console.error('Error updating status:', error);
    $q.notify({
      type: 'negative',
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล',
    });
  }
};

onMounted(() => {
  void loadData();
});
</script>

<style scoped lang="scss">
.action-btn {
  min-width: 150px;
  height: 52px;
  border-radius: 10px;
  font-weight: 700;

  @media (max-width: $breakpoint-xs-max) {
    min-width: 100%;
    order: -1;
  }
}

@media (max-width: $breakpoint-xs-max) {
  .action-container {
    flex-direction: column;

    .action-btn:nth-child(3) {
      order: 1;
    }
    .action-btn:nth-child(2) {
      order: 2;
    }
    .action-btn:nth-child(1) {
      order: 3;
    }
  }
}
</style>
