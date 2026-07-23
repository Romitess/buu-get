export const EXAM_SIMULATION_TOUR_VERSION = 15;

export type TourPlacement = 'left' | 'right' | 'top' | 'bottom';

export type DashboardViewType = 'overview' | 'course' | 'quiz' | 'attempt';

export type TourResumeTrigger =
  | 'login'
  | 'previous-page'
  | 'finish-attempt'
  | 'return-to-attempt'
  | DashboardViewType;

export interface TourStep {
  id: string;
  target: string;
  placement: TourPlacement;
  titleKey: string;
  bodyKey: string;
  requiresLogin?: boolean;
  dashboardView?: DashboardViewType;
  showFinishLabel?: boolean;
  manualNavigation?: boolean;
  resumeOn?: TourResumeTrigger;
  /** Override badge number (e.g. Step 10 Next / Previous variants both show 10) */
  badgeStepNumber?: number;
}

export const EXAM_SIMULATION_TOUR_STEPS: TourStep[] = [
  {
    id: 'login-inputs',
    target: 'login-inputs',
    placement: 'left',
    titleKey: 'examSimulation.tour.step1Title',
    bodyKey: 'examSimulation.tour.step1Body',
    requiresLogin: false,
  },
  {
    id: 'login-button',
    target: 'login-button',
    placement: 'left',
    titleKey: 'examSimulation.tour.step2Title',
    bodyKey: 'examSimulation.tour.step2Body',
    requiresLogin: false,
    showFinishLabel: true,
    manualNavigation: true,
    resumeOn: 'login',
  },
  {
    id: 'course-card',
    target: 'course-card',
    placement: 'right',
    titleKey: 'examSimulation.tour.step3Title',
    bodyKey: 'examSimulation.tour.step3Body',
    requiresLogin: true,
    dashboardView: 'overview',
    showFinishLabel: true,
    manualNavigation: true,
    resumeOn: 'course',
  },
  {
    id: 'quiz-section',
    target: 'quiz-section',
    placement: 'top',
    titleKey: 'examSimulation.tour.step4Title',
    bodyKey: 'examSimulation.tour.step4Body',
    requiresLogin: true,
    dashboardView: 'course',
    showFinishLabel: true,
    manualNavigation: true,
    resumeOn: 'quiz',
  },
  {
    id: 'attempt-quiz',
    target: 'attempt-quiz',
    placement: 'right',
    titleKey: 'examSimulation.tour.step5Title',
    bodyKey: 'examSimulation.tour.step5Body',
    requiresLogin: true,
    dashboardView: 'quiz',
    showFinishLabel: true,
    manualNavigation: true,
    resumeOn: 'attempt',
  },
  {
    id: 'attempt-back',
    target: 'attempt-back',
    placement: 'right',
    titleKey: 'examSimulation.tour.step6Title',
    bodyKey: 'examSimulation.tour.step6Body',
    requiresLogin: true,
    dashboardView: 'attempt',
  },
  {
    id: 'question-answer',
    target: 'question-answer',
    placement: 'top',
    titleKey: 'examSimulation.tour.step7Title',
    bodyKey: 'examSimulation.tour.step7Body',
    requiresLogin: true,
    dashboardView: 'attempt',
  },
  {
    id: 'flag-question',
    target: 'flag-question',
    placement: 'right',
    titleKey: 'examSimulation.tour.step8Title',
    bodyKey: 'examSimulation.tour.step8Body',
    requiresLogin: true,
    dashboardView: 'attempt',
  },
  {
    id: 'quiz-navigation',
    target: 'quiz-navigation',
    placement: 'left',
    titleKey: 'examSimulation.tour.step9Title',
    bodyKey: 'examSimulation.tour.step9Body',
    requiresLogin: true,
    dashboardView: 'attempt',
  },
  {
    id: 'next-page',
    target: 'next-page',
    placement: 'top',
    titleKey: 'examSimulation.tour.step10Title',
    bodyKey: 'examSimulation.tour.step10Body',
    requiresLogin: true,
    dashboardView: 'attempt',
    showFinishLabel: true,
    manualNavigation: true,
    resumeOn: 'previous-page',
    badgeStepNumber: 10,
  },
  {
    id: 'previous-page',
    target: 'previous-page',
    placement: 'top',
    titleKey: 'examSimulation.tour.step10PreviousTitle',
    bodyKey: 'examSimulation.tour.step10PreviousBody',
    requiresLogin: true,
    dashboardView: 'attempt',
    showFinishLabel: true,
    manualNavigation: true,
    resumeOn: 'finish-attempt',
    badgeStepNumber: 10,
  },
  {
    id: 'finish-attempt',
    target: 'finish-attempt',
    placement: 'top',
    titleKey: 'examSimulation.tour.step11Title',
    bodyKey: 'examSimulation.tour.step11Body',
    requiresLogin: true,
    dashboardView: 'attempt',
    showFinishLabel: true,
    manualNavigation: true,
    resumeOn: 'return-to-attempt',
    badgeStepNumber: 11,
  },
  {
    id: 'return-to-attempt',
    target: 'return-to-attempt',
    placement: 'top',
    titleKey: 'examSimulation.tour.step12Title',
    bodyKey: 'examSimulation.tour.step12Body',
    requiresLogin: true,
    dashboardView: 'attempt',
    badgeStepNumber: 12,
  },
  {
    id: 'submit-all-finish',
    target: 'submit-all-finish',
    placement: 'top',
    titleKey: 'examSimulation.tour.step13Title',
    bodyKey: 'examSimulation.tour.step13Body',
    requiresLogin: true,
    dashboardView: 'attempt',
    badgeStepNumber: 13,
  },
];

export const getStepIndex = (stepId: string): number => {
  return EXAM_SIMULATION_TOUR_STEPS.findIndex((step) => step.id === stepId);
};

export const getCourseCardStepIndex = (): number => getStepIndex('course-card');

export const getQuizSectionStepIndex = (): number => getStepIndex('quiz-section');

/** Step id ที่ควรแสดงเมื่อ user อยู่บน view นั้น (ใช้ตอน awaiting resume และ navigate ข้ามหน้า) */
export const VIEW_PRIMARY_STEP: Partial<Record<DashboardViewType, string>> = {
  overview: 'course-card',
  course: 'quiz-section',
  quiz: 'attempt-quiz',
  attempt: 'attempt-back',
};

export const getRestartStepIndex = (
  loggedIn: boolean,
  view: DashboardViewType | null | undefined,
  options?: { isSummary?: boolean },
): number => {
  if (!loggedIn) {
    return 0;
  }

  if (view === 'attempt' && options?.isSummary === true) {
    const summaryStepIndex = getStepIndex('return-to-attempt');
    if (summaryStepIndex >= 0) {
      return summaryStepIndex;
    }
  }

  if (view) {
    const stepId = VIEW_PRIMARY_STEP[view];
    if (stepId) {
      const index = getStepIndex(stepId);
      if (index >= 0) {
        return index;
      }
    }
  }

  const courseCardIndex = getCourseCardStepIndex();
  return courseCardIndex >= 0 ? courseCardIndex : 0;
};
