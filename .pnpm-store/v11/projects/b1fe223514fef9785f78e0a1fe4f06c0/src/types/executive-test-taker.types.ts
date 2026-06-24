import type { EnrollmentStatus } from 'src/types/enrollment.types';

export interface ExecutiveTestTakerRow {
  enrollmentId: number;
  examId: number;
  testTakerId: string | null;
  title: string | null;
  fullName: string | null;
  examRoundCount: number;
  status: EnrollmentStatus;
}

export interface ExecutiveTestTakerPage {
  data: ExecutiveTestTakerRow[];
  total: number;
}
