import { describe, expect, it, vi, beforeEach } from 'vitest';
import { defineComponent } from 'vue';
import { mount } from '@vue/test-utils';
import { useExamCertificateDocument } from './use-exam-certificate-document';
import { downloadExamCertificate } from 'src/services/exam-certificate.service';
import type { ExamEnrollment, ExamHistoryItem } from 'src/types/exam';

const notify = vi.fn();

vi.mock('quasar', () => ({
  useQuasar: () => ({ notify }),
}));

vi.mock('src/services/exam-certificate.service', () => ({
  downloadExamCertificate: vi.fn().mockResolvedValue(undefined),
}));

const TestHarness = defineComponent({
  setup() {
    return useExamCertificateDocument();
  },
  template: '<div />',
});

const enrollment = {
  ERM_ID: 42,
  SCORE: {
    CERTIFICATES: [{ CERT_ID: 3, CERT_CODE: 'ABC123' }],
  },
} as unknown as ExamEnrollment;

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
  rawEnrollment: enrollment,
};

describe('useExamCertificateDocument printCertificate', () => {
  const mockedDownload = vi.mocked(downloadExamCertificate);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads the signed certificate file', async () => {
    const wrapper = mount(TestHarness);
    const vm = wrapper.vm as unknown as ReturnType<typeof useExamCertificateDocument>;

    await vm.printCertificate(exam);

    expect(mockedDownload).toHaveBeenCalledWith(3);
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }));
  });

  it('warns when the history item has no certificate', async () => {
    const wrapper = mount(TestHarness);
    const vm = wrapper.vm as unknown as ReturnType<typeof useExamCertificateDocument>;

    await vm.printCertificate({
      ...exam,
      rawEnrollment: { ERM_ID: 42, SCORE: { CERTIFICATES: [] } } as unknown as ExamEnrollment,
    });

    expect(mockedDownload).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));
  });

  it('shows the server message when the signed file is missing', async () => {
    mockedDownload.mockRejectedValueOnce({
      response: { data: { message: 'ใบประกาศนี้ยังไม่มีไฟล์ลงนาม' } },
    });
    const wrapper = mount(TestHarness);
    const vm = wrapper.vm as unknown as ReturnType<typeof useExamCertificateDocument>;

    await vm.printCertificate(exam);

    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'negative',
        message: 'ใบประกาศนี้ยังไม่มีไฟล์ลงนาม',
      }),
    );
  });
});
