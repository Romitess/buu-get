import { describe, expect, it, vi, beforeEach } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useExamSeatCandidates } from './use-exam-seat-candidates';
import { fetchExamById } from 'src/services/exam.service';
import { fetchRawEnrollmentsByExamId } from 'src/services/enrollment.service';
import { EnrollmentStatus } from 'src/types/enrollment.types';
import type { BackendExam } from 'src/types/exam';
import type { BackendEnrollmentDetail } from 'src/types/enrollment.types';

vi.mock('src/services/exam.service', () => ({
  fetchExamById: vi.fn(),
}));

vi.mock('src/services/enrollment.service', () => ({
  fetchRawEnrollmentsByExamId: vi.fn(),
}));

const TestHarness = defineComponent({
  setup() {
    return useExamSeatCandidates();
  },
  template: '<div />',
});

describe('useExamSeatCandidates applyVoucherIssuedState', () => {
  const mockedFetchExam = vi.mocked(fetchExamById);
  const mockedFetchEnrollments = vi.mocked(fetchRawEnrollmentsByExamId);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates session and enrollment status without refetching', async () => {
    const exam: BackendExam = {
      EXAM_ID: 1,
      EXAM_NAME: 'BUU-GET',
      EXAM_DATE: '2026-07-10',
      SESSIONS: [
        {
          SS_ID: 5,
          EXAM_ID: 1,
          SS_START_TIME: '09:00:00',
          SS_END_TIME: '12:00:00',
          SS_CAPACITY: 100,
          SS_SESSION_STATUS: 2,
        },
      ],
    } as BackendExam;

    const enrollments: BackendEnrollmentDetail[] = [
      {
        ERM_ID: 10,
        SESSION_ID: 5,
        ERM_STATUS: EnrollmentStatus.SEAT_ASSIGNED,
        ERM_SEAT_LABEL: 'A1',
        ERM_TEST_TAKER: 'TT-001',
      } as BackendEnrollmentDetail,
    ];

    mockedFetchExam.mockResolvedValue(exam);
    mockedFetchEnrollments.mockResolvedValue(enrollments);

    const wrapper = mount(TestHarness);
    const vm = wrapper.vm as unknown as ReturnType<typeof useExamSeatCandidates>;

    await vm.fetchData(1);
    await nextTick();

    expect(vm.isVoucherSent).toBe(false);

    vm.applyVoucherIssuedState([5], [10]);
    await nextTick();

    const examState = vm.exam as unknown as BackendExam | null;

    expect(examState?.SESSIONS?.[0]?.SS_SESSION_STATUS).toBe(3);
    expect(vm.isVoucherSent).toBe(true);
    expect(mockedFetchExam).toHaveBeenCalledTimes(1);
    expect(mockedFetchEnrollments).toHaveBeenCalledTimes(1);
  });
});
