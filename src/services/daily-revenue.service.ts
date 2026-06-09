import type {
  DailyRevenueFilter,
  DailyRevenueSummary,
  DepartmentOption,
} from 'src/types/daily-revenue.types';

// ── Mock Data ─────────────────────────────────────────────
const MOCK_ROWS = [
  { index: 1, department: 'สถาบันภาษา', examName: 'BUU-GET 1/2026', amount: 115000.0 },
  { index: 2, department: 'สถาบันภาษา', examName: 'BUU-GET 2/2026', amount: 13000.0 },
  { index: 3, department: 'สถาบันภาษา', examName: 'BUU-GET 3/2026', amount: 8000.0 },
  { index: 4, department: 'สถาบันภาษา', examName: 'BUU-GET 4/2026', amount: 6500.0 },
  {
    index: 5,
    department: 'สำนักคอมพิวเตอร์',
    examName: 'การสอบรับพนักงานสำนักคอมพิวเตอร์',
    amount: 3000.0,
  },
];

const MOCK_DEPARTMENTS: DepartmentOption[] = [
  { label: 'สถาบันภาษา', value: 'สถาบันภาษา' },
  { label: 'สำนักคอมพิวเตอร์', value: 'สำนักคอมพิวเตอร์' },
];

// ── Service Functions ─────────────────────────────────────
/**
 * Fetch daily revenue summary report.
 * Currently uses mock data; will be replaced with API call later.
 */
export const fetchDailyRevenueSummary = async (
  filter: DailyRevenueFilter,
): Promise<DailyRevenueSummary> => {
  // TODO: Replace with actual API call — e.g. api.get('/reports/daily-revenue', { params: filter })
  await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

  let filtered = [...MOCK_ROWS];

  if (filter.department) {
    filtered = filtered.filter((row) => row.department === filter.department);
  }

  if (filter.examName) {
    const query = filter.examName.toLowerCase();
    filtered = filtered.filter((row) => row.examName.toLowerCase().includes(query));
  }

  // Re-index after filtering
  filtered = filtered.map((row, idx) => ({ ...row, index: idx + 1 }));

  const totalAmount = filtered.reduce((sum, row) => sum + row.amount, 0);

  return {
    rows: filtered,
    totalAmount,
  };
};

/**
 * Fetch department options for the filter dropdown.
 * Currently uses mock data; will be replaced with API call later.
 */
export const fetchDepartmentOptions = async (): Promise<DepartmentOption[]> => {
  // TODO: Replace with actual API call
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_DEPARTMENTS;
};
