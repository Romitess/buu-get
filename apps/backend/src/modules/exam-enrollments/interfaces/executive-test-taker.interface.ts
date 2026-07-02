import { ExamEnrollmentStatus } from '../entities/exam-enrollment.entity';

export interface ExecutiveTestTakerRow {
  enrollmentId: number;
  examId: number;
  testTakerId: string | null;
  title: string | null;
  fullName: string | null;
  examRoundCount: number;
  status: ExamEnrollmentStatus;
}

export interface ExecutiveTestTakerPage {
  data: ExecutiveTestTakerRow[];
  total: number;
}
