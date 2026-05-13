<template>
  <q-page class="q-px-xl q-pt-xl q-pb-xl flex column items-center">
    <div class="full-width" style="max-width: 1200px">
      <div class="q-mb-xl">
        <div class="text-h5 text-weight-bold" style="color: #212121">ตรวจสอบข้อมูลการสมัครสอบ</div>
        <div class="text-subtitle2 text-grey-7 q-mt-xs">
          ตรวจสอบข้อมูลผู้สมัครสอบเพื่ออนุมัติหรือแจ้งแก้ไขก่อนพิมพ์บัตรสอบ
        </div>
      </div>

      <div v-if="isLoading" class="flex flex-center q-pa-xl">
        <q-spinner-dots color="primary" size="40px" />
      </div>

      <div v-else-if="enrollment">
        <RegistrantPersonalDetail :enrollment="enrollment" />

        <div class="row justify-end q-mt-xl q-gutter-md">
          <AppButton
            label="ยกเลิก"
            color="grey-3"
            text-color="dark"
            unelevated
            style="min-width: 150px; height: 52px; border-radius: 10px; font-weight: 700"
            @click="goBack"
          />
          <AppButton
            label="แจ้งข้อมูลให้แก้ไข"
            color="negative"
            unelevated
            style="min-width: 150px; height: 52px; border-radius: 10px; font-weight: 700"
            @click="showFixDialog = true"
          />
          <AppButton
            label="ยืนยันการตรวจสอบ"
            color="primary"
            unelevated
            style="min-width: 150px; height: 52px; border-radius: 10px; font-weight: 700"
            @click="handleVerify"
          />
        </div>
      </div>

      <div v-else class="text-center q-pa-xl">
        <q-icon name="error_outline" size="64px" color="negative" />
        <div class="text-h6 q-mt-md">ไม่พบข้อมูลการสมัครสอบ</div>
        <AppButton label="กลับไปหน้าหลัก" color="primary" class="q-mt-lg" @click="goBack" />
      </div>
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
import { fetchEnrollmentById, updateEnrollmentStatus } from 'src/services/enrollment.service';
import { VerifyStatus } from 'src/types/enrollment.types';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const enrollment = ref<BackendEnrollmentDetail | null>(null);
const isLoading = ref(true);
const showFixDialog = ref(false);

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

interface RequestFixFormData {
  fixDeadline: string;
  reasons: string[];
  notes: string;
}

const handleFixSubmit = async (_formData: RequestFixFormData): Promise<void> => {
  if (!enrollment.value) return;
  console.log('[Fix Request Data]', _formData);

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

<style scoped lang="scss"></style>
