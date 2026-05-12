import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useExamStore } from 'src/stores/exam.store';
import {
  BUDDHIST_YEAR_OFFSET,
  EXAM_TYPE_GENERAL,
  EXAM_TYPE_SPECIAL,
  EXAM_FORMAT_COMPUTER,
} from 'src/constants/exam';
import type { CreateExamPayload, ExamLocationOption, FundSource } from 'src/services/exam.service';
import { fetchExamLocations, fetchFundSources } from 'src/services/exam.service';

export interface TimeSlot {
  startTime: string;
  endTime: string;
}

export interface CreateExamForm {
  examName: string;
  locationId: number | null;
  examType: string;
  fundSourceId: number | null;
  fee: string | number;
  seats: number;
  isPublished: boolean;
  examDate: string;
  timeSlots: TimeSlot[];
  regStartDate: string;
  regEndDate: string;
  payStartDate: string;
  payEndDate: string;
}

export function useCreateExam() {
  const router = useRouter();
  const $q = useQuasar();
  const examStore = useExamStore();

  const today = (() => {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear() + BUDDHIST_YEAR_OFFSET;
    return `${d}/${m}/${y}`;
  })();

  const examTypeOptions: string[] = [EXAM_TYPE_GENERAL, EXAM_TYPE_SPECIAL];
  const locationOptions = ref<ExamLocationOption[]>([]);
  const fundSourceOptions = ref<{ label: string; value: number }[]>([]);
  const isLoadingData = ref(false);

  const form = ref<CreateExamForm>({
    examName: '',
    locationId: null,
    examType: EXAM_TYPE_GENERAL,
    fundSourceId: null,
    fee: '0.00',
    seats: 1,
    isPublished: true,
    examDate: today,
    timeSlots: [
      { startTime: '08 : 00', endTime: '10 : 00' },
      { startTime: '10 : 00', endTime: '12 : 00' },
    ],
    regStartDate: today,
    regEndDate: today,
    payStartDate: today,
    payEndDate: today,
  });

  const loadInitialData = async () => {
    isLoadingData.value = true;
    try {
      const [locations, fundSources] = await Promise.all([
        fetchExamLocations(),
        fetchFundSources(),
      ]);
      locationOptions.value = locations;
      fundSourceOptions.value = fundSources.map((fs: FundSource) => ({
        label: `${fs.FS_NAME} (${fs.FS_ACCOUNT_CODE})`,
        value: fs.FS_ID,
      }));
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      isLoadingData.value = false;
    }
  };

  const addTimeSlot = () => {
    if (form.value.timeSlots.length < 4) {
      form.value.timeSlots.push({
        startTime: '',
        endTime: '',
      });
    } else {
      $q.notify({
        type: 'warning',
        message: 'สามารถเพิ่มรอบเวลาสอบได้สูงสุด 4 รอบ',
        position: 'top',
      });
    }
  };

  const removeTimeSlot = (index: number) => {
    if (form.value.timeSlots.length > 1) {
      form.value.timeSlots.splice(index, 1);
    } else {
      $q.notify({
        type: 'warning',
        message: 'ต้องมีช่วงเวลาสอบอย่างน้อย 1 ช่วงเวลา',
        position: 'top',
      });
    }
  };

  const handleCancel = () => {
    void router.push('/user/exam-schedule');
  };

  const handleSave = async () => {
    const timeRanges = form.value.timeSlots
      .filter((slot) => slot.startTime && slot.endTime)
      .map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
      }));

    if (timeRanges.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'กรุณาระบุเวลาสอบอย่างน้อย 1 ช่วงเวลา',
        position: 'top',
      });
      return;
    }

    if (!form.value.locationId) {
      $q.notify({
        type: 'warning',
        message: 'กรุณาเลือกสถานที่สอบ',
        position: 'top',
      });
      return;
    }

    if (!form.value.fundSourceId) {
      $q.notify({
        type: 'warning',
        message: 'กรุณาเลือกแหล่งเงิน',
        position: 'top',
      });
      return;
    }

    try {
      const payload: CreateExamPayload = {
        examName: form.value.examName,
        locationId: form.value.locationId,
        examType: form.value.examType,
        examFormat: EXAM_FORMAT_COMPUTER,
        fee: form.value.fee,
        seats: form.value.seats,
        isPublished: form.value.isPublished,
        examDate: form.value.examDate,
        regStartDate: form.value.regStartDate,
        regEndDate: form.value.regEndDate,
        payStartDate: form.value.payStartDate,
        payEndDate: form.value.payEndDate,
        timeRanges,
        fundSourceId: form.value.fundSourceId,
      };

      await examStore.addExamRound(payload);

      $q.notify({
        type: 'positive',
        message: 'สร้างรอบสอบสำเร็จ',
        position: 'top',
        timeout: 2000,
      });

      void router.push('/user/exam-schedule');
    } catch (error) {
      console.error('Save error:', error);
      $q.notify({
        type: 'negative',
        message: 'เกิดข้อผิดพลาดในการสร้างรอบสอบ',
        position: 'top',
      });
    }
  };

  return {
    form,
    examTypeOptions,
    locationOptions,
    fundSourceOptions,
    isLoadingData,
    loadInitialData,
    addTimeSlot,
    removeTimeSlot,
    handleCancel,
    handleSave,
  };
}
