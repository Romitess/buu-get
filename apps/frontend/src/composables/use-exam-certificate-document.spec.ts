import { describe, expect, it, vi, beforeEach } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useExamCertificateDocument } from './use-exam-certificate-document';
import { fetchEnrollmentById } from 'src/services/exam.service';
import type { ExamEnrollment, ExamHistoryItem } from 'src/types/exam';

const notify = vi.fn();

vi.mock('quasar', () => ({
  useQuasar: () => ({ notify }),
}));

vi.mock('src/stores/user.store', () => ({
  useUserStore: () => ({
    currentUser: {
      nationalId: '1234567890123',
      userImagePath: null,
    },
  }),
}));

vi.mock('src/services/image.service', () => ({
  getImageUrl: (path: string) => `https://img.test/${path}`,
}));

vi.mock('src/services/score-criteria.service', () => ({
  getBandRules: vi.fn().mockResolvedValue({ bandRules: [] }),
}));

vi.mock('src/services/exam.service', () => ({
  fetchEnrollmentById: vi.fn(),
}));

vi.mock('src/utils/verify-qr', () => ({
  generateCertificateQrDataUrl: vi.fn().mockResolvedValue('data:image/png;base64,qr'),
}));

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toDataURL: () => 'data:image/png;base64,card',
    width: 100,
    height: 50,
  }),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));

const TestHarness = defineComponent({
  setup() {
    return useExamCertificateDocument();
  },
  template: '<div />',
});

const slimEnrollment = {
  ERM_ID: 42,
  USER_ID: 7,
  SESSION_ID: 1,
  LS_ID: null,
  ERM_STATUS: 4,
  ERM_VERIFY_STATUS: 1,
  CREATED_AT: '2026-08-07',
  USER: {
    USER_ID: 7,
    USER_NATIONAL_ID: '1234567890123',
    USER_PASSPORT_NO: null,
    USER_EMAIL: 'user@buu.ac.th',
    PROFILE: {
      userProfileId: 1,
      userId: 7,
      userTitleTh: 'นางสาว',
      userFullnameTh: 'ทดสอบ',
      userTitleEn: 'Miss',
      userFullnameEn: 'Test User',
      userDateOfBirth: null,
      userPhone: null,
      userEducation: null,
      userFaculty: null,
      userInstitution: null,
      userAddress: null,
      userRemark: null,
    },
  },
  SESSION: {
    SS_ID: 1,
    EXAM_ID: 1,
    SS_START_TIME: '09:00:00',
    SS_END_TIME: '12:00:00',
    SS_CAPACITY: 50,
    EXAM: {
      EXAM_ID: 1,
      EXAM_NAME: 'BUU-GET',
      EXAM_DATE: '2026-08-07',
      EXAM_ROUND: '1',
    },
  },
  SCORE: {
    SCORES_ID: 9,
    ERM_ID: 42,
    CERTIFICATES: [
      {
        CERT_ID: 3,
        SCORES_ID: 9,
        CERT_CODE: 'ABC123',
        CERT_ISSUED_AT: '2026-08-07',
        CERT_EXPIRES_AT: '2028-08-07',
      },
    ],
  },
} as unknown as ExamEnrollment;

const fullEnrollment = {
  ...slimEnrollment,
  ERM_TEST_TAKER: 'TT-42',
  USER: {
    ...slimEnrollment.USER!,
    USER_CODE: 'U007',
    IMAGE: { USER_IMAGE_URL: 'photos/u7.jpg' },
  },
  SESSION: {
    ...slimEnrollment.SESSION!,
    EXAM: {
      ...slimEnrollment.SESSION!.EXAM!,
      EXAM_FISCAL_YEAR: '2569',
    },
  },
  SCORE: {
    ...slimEnrollment.SCORE!,
    SC_LANG_USE_SCORE: 35,
    SC_READING_SCORE: 40,
    SC_TOTAL_SCORE: 75,
    SC_BAND_LEVEL: 'B1',
  },
} as ExamEnrollment;

describe('useExamCertificateDocument printCertificate', () => {
  const mockedFetchEnrollment = vi.mocked(fetchEnrollmentById);

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML =
      '<div id="certificate-render-container"><div class="certificate-card-preview"></div></div>';
    mockedFetchEnrollment.mockResolvedValue(fullEnrollment);
  });

  it('refreshes enrollment when history list omits score fields', async () => {
    const wrapper = mount(TestHarness);
    const vm = wrapper.vm as unknown as ReturnType<typeof useExamCertificateDocument>;

    const exam: ExamHistoryItem = {
      id: 42,
      title: 'BUU-GET',
      status: 'completed',
      statusType: 'success',
      category: 'completed',
      registrationStatus: { label: 'ok', type: 'success' },
      date: '2026-08-07',
      time: '09:00',
      location: 'Room A',
      rawEnrollment: slimEnrollment,
    };

    await vm.printCertificate(exam);
    await nextTick();

    expect(mockedFetchEnrollment).toHaveBeenCalledWith(42);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }));
  });

  it('does not refresh when score and test-taker fields are present', async () => {
    const wrapper = mount(TestHarness);
    const vm = wrapper.vm as unknown as ReturnType<typeof useExamCertificateDocument>;

    const exam: ExamHistoryItem = {
      id: 42,
      title: 'BUU-GET',
      status: 'completed',
      statusType: 'success',
      category: 'completed',
      registrationStatus: { label: 'ok', type: 'success' },
      date: '2026-08-07',
      time: '09:00',
      location: 'Room A',
      rawEnrollment: fullEnrollment,
    };

    await vm.printCertificate(exam);
    await nextTick();

    expect(mockedFetchEnrollment).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }));
  });
});
