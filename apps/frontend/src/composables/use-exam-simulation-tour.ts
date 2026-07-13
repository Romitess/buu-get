import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  EXAM_SIMULATION_TOUR_STEPS,
  EXAM_SIMULATION_TOUR_VERSION,
  VIEW_PRIMARY_STEP,
  getCourseCardStepIndex,
  getRestartStepIndex,
  getStepIndex,
  type DashboardViewType,
  type TourResumeTrigger,
  type TourStep,
} from 'src/composables/exam-simulation-tour-steps';

const STORAGE_KEY = 'exam-simulation-tour';

type TourResumeTriggerType = 'login' | 'dashboard' | 'mount';

interface TourStorageState {
  version: number;
  completed: boolean;
}

interface UseExamSimulationTourOptions {
  isLoggedIn: Ref<boolean>;
  rootSelector?: string;
  dashboardView?: Ref<DashboardViewType | null | undefined>;
  goToDashboardView?: (view: DashboardViewType) => void;
}

const readStorageState = (): TourStorageState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as TourStorageState;
    if (typeof parsed.version !== 'number' || typeof parsed.completed !== 'boolean') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeStorageState = (state: TourStorageState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const isTourCompleted = (): boolean => {
  const state = readStorageState();
  if (!state) {
    return false;
  }
  if (state.version < EXAM_SIMULATION_TOUR_VERSION) {
    return false;
  }
  return state.completed;
};

const markTourCompleted = (): void => {
  writeStorageState({
    version: EXAM_SIMULATION_TOUR_VERSION,
    completed: true,
  });
};

const canShowStep = (step: TourStep, loggedIn: boolean): boolean => {
  if (step.requiresLogin === true) {
    return loggedIn;
  }
  if (step.requiresLogin === false) {
    return !loggedIn;
  }
  return true;
};

const isResumeConditionMet = (
  resumeOn: TourResumeTrigger,
  loggedIn: boolean,
  view: DashboardViewType | null | undefined,
): boolean => {
  if (resumeOn === 'login') {
    return loggedIn;
  }
  return view === resumeOn;
};

const getInitialStepIndex = (loggedIn: boolean): number => {
  if (loggedIn) {
    const courseCardIndex = getCourseCardStepIndex();
    return courseCardIndex >= 0 ? courseCardIndex : 0;
  }
  return 0;
};

export const useExamSimulationTour = (options: UseExamSimulationTourOptions) => {
  const { t } = useI18n();
  const {
    isLoggedIn,
    rootSelector = '.exam-simulation-page',
    dashboardView,
    goToDashboardView,
  } = options;

  const isActive = ref(false);
  const currentStepIndex = ref(0);
  const targetRect = ref<DOMRect | null>(null);
  const awaitingResume = ref(false);
  const pendingResumeOn = ref<TourResumeTrigger | null>(null);
  const hasAutoStartAttempted = ref(false);

  let bindGeneration = 0;
  let resizeObserver: ResizeObserver | null = null;

  const currentStep = computed<TourStep | null>(() => {
    if (!isActive.value) {
      return null;
    }
    return EXAM_SIMULATION_TOUR_STEPS[currentStepIndex.value] ?? null;
  });

  const isLastStep = computed(() => {
    return currentStepIndex.value >= EXAM_SIMULATION_TOUR_STEPS.length - 1;
  });

  const stepNumber = computed(() => currentStepIndex.value + 1);

  const title = computed(() => {
    if (!currentStep.value) {
      return '';
    }
    return t(currentStep.value.titleKey);
  });

  const body = computed(() => {
    if (!currentStep.value) {
      return '';
    }
    return t(currentStep.value.bodyKey);
  });

  const badgeLabel = computed(() => t('examSimulation.tour.stepBadge', { step: stepNumber.value }));

  const nextLabel = computed(() => {
    if (currentStep.value?.showFinishLabel || isLastStep.value) {
      return t('examSimulation.tour.finish');
    }
    return t('examSimulation.tour.next');
  });

  const placement = computed(() => currentStep.value?.placement ?? 'left');

  const findTargetElement = (targetId: string): HTMLElement | null => {
    const root = document.querySelector(rootSelector);
    if (!root) {
      return null;
    }
    return root.querySelector<HTMLElement>(`[data-tour="${targetId}"]`);
  };

  const waitForTargetElement = async (targetId: string): Promise<HTMLElement | null> => {
    const maxAttempts = 60;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const element = findTargetElement(targetId);
      if (element) {
        return element;
      }

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });
    }

    return null;
  };

  const waitForPaint = async (): Promise<void> => {
    await nextTick();
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  };

  const ensureStepDashboardView = async (step: TourStep): Promise<void> => {
    if (!step.dashboardView || !goToDashboardView) {
      return;
    }

    if (dashboardView?.value !== step.dashboardView) {
      goToDashboardView(step.dashboardView);
      await waitForPaint();
    }
  };

  const clearTargetBinding = (): void => {
    targetRect.value = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
  };

  const updateTargetRect = (): void => {
    const step = currentStep.value;
    if (!step) {
      targetRect.value = null;
      return;
    }

    const element = findTargetElement(step.target);
    if (!element) {
      targetRect.value = null;
      return;
    }

    targetRect.value = element.getBoundingClientRect();
  };

  const observeTarget = (element: HTMLElement): void => {
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(() => {
      updateTargetRect();
    });
    resizeObserver.observe(element);
  };

  const alignStepIndexWithView = (view: DashboardViewType): void => {
    const stepId = VIEW_PRIMARY_STEP[view];
    if (!stepId) {
      return;
    }

    const alignedIndex = getStepIndex(stepId);
    if (alignedIndex > currentStepIndex.value) {
      currentStepIndex.value = alignedIndex;
    }
  };

  const renderCurrentStep = async (opts?: { ensureView?: boolean }): Promise<boolean> => {
    const gen = ++bindGeneration;

    if (!isActive.value) {
      clearTargetBinding();
      return false;
    }

    const step = EXAM_SIMULATION_TOUR_STEPS[currentStepIndex.value];
    if (!step) {
      clearTargetBinding();
      return false;
    }

    if (!canShowStep(step, isLoggedIn.value)) {
      clearTargetBinding();
      return false;
    }

    const shouldEnsureView = opts?.ensureView ?? !step.manualNavigation;
    if (shouldEnsureView) {
      await ensureStepDashboardView(step);
      if (gen !== bindGeneration) {
        return false;
      }
    }

    const element = await waitForTargetElement(step.target);
    if (gen !== bindGeneration) {
      return false;
    }

    if (!element) {
      clearTargetBinding();
      return false;
    }

    updateTargetRect();
    observeTarget(element);
    return true;
  };

  const enterAwaitingResume = (resumeOn: TourResumeTrigger): void => {
    awaitingResume.value = true;
    pendingResumeOn.value = resumeOn;
    clearTargetBinding();
  };

  const stopTour = (): void => {
    bindGeneration += 1;
    isActive.value = false;
    currentStepIndex.value = 0;
    awaitingResume.value = false;
    pendingResumeOn.value = null;
    clearTargetBinding();
  };

  const completeTour = (): void => {
    markTourCompleted();
    stopTour();
  };

  const activateTourAt = async (
    stepIndex: number,
    opts?: { resetDashboard?: boolean },
  ): Promise<void> => {
    bindGeneration += 1;
    awaitingResume.value = false;
    pendingResumeOn.value = null;
    currentStepIndex.value = stepIndex;
    isActive.value = true;

    const step = EXAM_SIMULATION_TOUR_STEPS[stepIndex];
    if (opts?.resetDashboard && step?.dashboardView && goToDashboardView) {
      goToDashboardView(step.dashboardView);
      await waitForPaint();
    }

    await renderCurrentStep({ ensureView: !step?.manualNavigation });
  };

  const startTour = async (): Promise<void> => {
    await activateTourAt(getInitialStepIndex(isLoggedIn.value));
  };

  const restartTour = async (): Promise<void> => {
    const view = dashboardView?.value ?? null;
    const stepIndex = getRestartStepIndex(isLoggedIn.value, view);
    const step = EXAM_SIMULATION_TOUR_STEPS[stepIndex];
    const needsViewReset = Boolean(step?.dashboardView) && view !== step?.dashboardView;

    await activateTourAt(stepIndex, { resetDashboard: needsViewReset });
  };

  const goToNextStep = async (): Promise<void> => {
    if (isLastStep.value) {
      completeTour();
      return;
    }

    const finishingStep = currentStep.value;
    const nextIndex = currentStepIndex.value + 1;
    const nextStep = EXAM_SIMULATION_TOUR_STEPS[nextIndex];
    if (!nextStep) {
      completeTour();
      return;
    }

    currentStepIndex.value = nextIndex;

    if (finishingStep?.manualNavigation && finishingStep.resumeOn) {
      enterAwaitingResume(finishingStep.resumeOn);
      void tryResumeTour('dashboard');
      return;
    }

    await renderCurrentStep({ ensureView: true });
  };

  const skipTour = (): void => {
    completeTour();
  };

  const maybeAutoStart = async (): Promise<void> => {
    if (hasAutoStartAttempted.value || isActive.value) {
      return;
    }

    if (isLoggedIn.value || isTourCompleted()) {
      return;
    }

    hasAutoStartAttempted.value = true;
    await waitForPaint();
    await startTour();
  };

  const tryResumeTour = async (
    trigger: TourResumeTriggerType,
    viewOverride?: DashboardViewType | null,
  ): Promise<void> => {
    if (!isActive.value) {
      return;
    }

    const resolvedView = viewOverride ?? dashboardView?.value ?? null;

    if (awaitingResume.value) {
      if (trigger === 'dashboard' && resolvedView) {
        alignStepIndexWithView(resolvedView);
      }

      if (pendingResumeOn.value) {
        const met = isResumeConditionMet(pendingResumeOn.value, isLoggedIn.value, resolvedView);
        if (!met) {
          return;
        }
      }

      await waitForPaint();
      const bound = await renderCurrentStep({ ensureView: false });
      if (bound) {
        awaitingResume.value = false;
        pendingResumeOn.value = null;
      }
      return;
    }

    const step = currentStep.value;
    if (!step || !canShowStep(step, isLoggedIn.value)) {
      return;
    }

    if (trigger === 'login' && step.requiresLogin !== true) {
      return;
    }

    if (step.dashboardView) {
      if (resolvedView !== step.dashboardView) {
        return;
      }
    }

    await waitForPaint();
    await renderCurrentStep({ ensureView: false });
  };

  const handleWindowChange = (): void => {
    if (isActive.value && !awaitingResume.value) {
      updateTargetRect();
    }
  };

  onMounted(() => {
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleWindowChange);
    window.removeEventListener('scroll', handleWindowChange, true);
    clearTargetBinding();
  });

  watch(isLoggedIn, (loggedIn) => {
    if (loggedIn) {
      void tryResumeTour('login');
    }
  });

  watch(
    () => dashboardView?.value,
    () => {
      void tryResumeTour('dashboard');
    },
  );

  return {
    isActive,
    targetRect,
    stepNumber,
    title,
    body,
    badgeLabel,
    nextLabel,
    placement,
    isLastStep,
    startTour,
    restartTour,
    goToNextStep,
    skipTour,
    completeTour,
    maybeAutoStart,
    tryResumeTour,
  };
};
