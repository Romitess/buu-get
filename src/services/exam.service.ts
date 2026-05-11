import { api } from 'src/boot/axios';
import type { ExamHistoryItem, DayData, ExamRound, BackendExam } from 'src/types/exam';

export const fetchScheduleData = async (): Promise<Record<string, DayData>> => {
  try {
    const response = await api.get<BackendExam[]>('/exam');
    const exams: BackendExam[] = response.data;
    const schedule: Record<string, DayData> = {};

    exams.forEach((exam: BackendExam) => {
      const date = exam.EXAM_DATE;

      const sortedSessions = [...(exam.SESSIONS || [])].sort((a, b) =>
        (a.SS_START_TIME || '').localeCompare(b.SS_START_TIME || ''),
      );

      if (!schedule[date]) {
        schedule[date] = {
          location: sortedSessions[0]?.LOCATION_NAME || 'TBA',
          fee: `Fee : ${exam.EXAM_FEE} ฿`,
          rounds: [],
        };
      }

      const dayData = schedule[date];
      if (!dayData) return;

      sortedSessions.forEach((session) => {
        const startTime = session.SS_START_TIME ? session.SS_START_TIME.substring(0, 5) : '00:00';
        const endTime = session.SS_END_TIME ? session.SS_END_TIME.substring(0, 5) : '00:00';

        const round: ExamRound = {
          id: session.SS_ID,
          title: exam.EXAM_NAME || 'BUU - GET',
          timeRange: `${startTime} - ${endTime}`,
          roundTypeLabel: exam.EXAM_TYPE || 'รอบทั่วไป',
          availableSeats: (session.SS_CAPACITY || 0) - (session.ENROLLMENTS?.length || 0),
          totalSeats: session.SS_CAPACITY || 0,
        };
        dayData.rounds.push(round);
      });
    });

    Object.values(schedule).forEach((day: DayData) => {
      day.rounds.sort((a, b) => a.timeRange.localeCompare(b.timeRange));
    });

    return schedule;
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    throw error;
  }
};

export const mockScheduleData: Record<string, DayData> = {};

export const mockHistoryRecords: ExamHistoryItem[] = [];
