import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useExamReport } from './use-exam-report';
import { fetchExamReportSummary, fetchExamReportOptions } from 'src/services/exam-report.service';
import type { ExamReportSummary } from 'src/types/exam-report.types';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('src/services/exam-report.service', () => ({
  fetchExamReportSummary: vi.fn(),
  fetchExamReportOptions: vi.fn(),
}));

const TestHarness = defineComponent({
  setup() {
    return useExamReport();
  },
  template: '<div />',
});

function createSummary(): ExamReportSummary {
  return {
    statCards: [],
    attendanceChart: { categories: [], attended: [], absent: [] },
    trendChart: { categories: [], registered: [] },
    rounds: [],
    scoreSummaryChart: { years: [], series: [] },
    attemptProportion: { firstTime: 0, repeat: 0 },
    yearTable: [],
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useExamReport loading states', () => {
  const mockedFetchSummary = vi.mocked(fetchExamReportSummary);
  const mockedFetchOptions = vi.mocked(fetchExamReportOptions);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchOptions.mockResolvedValue({ years: [], months: [], rounds: [] });
  });

  it('starts with first-load skeleton state', () => {
    const wrapper = mount(TestHarness);
    const vm = wrapper.vm as unknown as ReturnType<typeof useExamReport>;

    expect(vm.isLoading).toBe(true);
    expect(vm.isRefreshing).toBe(false);
  });

  it('does not switch to refreshing during first fetch', async () => {
    const deferred = createDeferred<ExamReportSummary>();
    mockedFetchSummary.mockReturnValueOnce(deferred.promise);

    const wrapper = mount(TestHarness);
    const vm = wrapper.vm as unknown as ReturnType<typeof useExamReport>;

    const pending = vm.fetchData();
    await nextTick();

    expect(vm.isLoading).toBe(true);
    expect(vm.isRefreshing).toBe(false);

    deferred.resolve(createSummary());
    await pending;

    expect(vm.isLoading).toBe(false);
    expect(vm.isRefreshing).toBe(false);
  });

  it('uses refreshing state on subsequent fetches without toggling isLoading', async () => {
    mockedFetchSummary.mockResolvedValueOnce(createSummary());

    const wrapper = mount(TestHarness);
    const vm = wrapper.vm as unknown as ReturnType<typeof useExamReport>;

    await vm.fetchData();
    expect(vm.isLoading).toBe(false);
    expect(vm.isRefreshing).toBe(false);

    const deferred = createDeferred<ExamReportSummary>();
    mockedFetchSummary.mockReturnValueOnce(deferred.promise);

    const pending = vm.fetchData();
    await nextTick();

    expect(vm.isLoading).toBe(false);
    expect(vm.isRefreshing).toBe(true);

    deferred.resolve(createSummary());
    await pending;

    expect(vm.isLoading).toBe(false);
    expect(vm.isRefreshing).toBe(false);
  });
});
