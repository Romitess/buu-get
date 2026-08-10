import { ref, onBeforeUnmount } from 'vue';
import {
  buildAssistJoinUrl,
  closeAssistSession,
  createAssistSession,
  listAssistEvents,
} from 'src/services/check-in-assist.service';
import { generateQrDataUrl } from 'src/utils/verify-qr';
import type { AssistEvent } from 'src/types/check-in-assist.types';

const POLL_INTERVAL_MS = 1000;

export function useCheckInAssistHost() {
  const casId = ref<number | null>(null);
  const joinToken = ref<string | null>(null);
  const joinUrl = ref('');
  const qrDataUrl = ref('');
  const isAssistActive = ref(false);
  const isStarting = ref(false);
  const afterSeq = ref(0);

  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let onEventHandler: ((event: AssistEvent) => void) | null = null;

  const stopPolling = (): void => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };

  const pollOnce = async (): Promise<void> => {
    if (!casId.value) return;
    try {
      const response = await listAssistEvents(casId.value, afterSeq.value);
      for (const event of response.events) {
        onEventHandler?.(event);
      }
      afterSeq.value = response.latestSeq;
    } catch (error) {
      console.error('Assist poll failed:', error);
    }
  };

  const startPolling = (): void => {
    stopPolling();
    pollTimer = setInterval(() => {
      void pollOnce();
    }, POLL_INTERVAL_MS);
  };

  const startAssist = async (
    examId: number,
    sessionIds: number[],
    onEvent: (event: AssistEvent) => void,
  ): Promise<void> => {
    if (isStarting.value || isAssistActive.value) return;
    isStarting.value = true;
    onEventHandler = onEvent;

    try {
      const session = await createAssistSession({ examId, sessionIds });
      casId.value = session.casId;
      joinToken.value = session.joinToken;
      joinUrl.value = buildAssistJoinUrl(session.joinToken);
      qrDataUrl.value = await generateQrDataUrl(joinUrl.value);
      afterSeq.value = 0;
      isAssistActive.value = true;
      startPolling();
      await pollOnce();
    } finally {
      isStarting.value = false;
    }
  };

  const stopAssist = async (): Promise<void> => {
    stopPolling();
    onEventHandler = null;

    const activeCasId = casId.value;
    casId.value = null;
    joinToken.value = null;
    joinUrl.value = '';
    qrDataUrl.value = '';
    afterSeq.value = 0;
    isAssistActive.value = false;

    if (activeCasId) {
      try {
        await closeAssistSession(activeCasId);
      } catch (error) {
        console.error('Failed to close assist session:', error);
      }
    }
  };

  onBeforeUnmount(() => {
    void stopAssist();
  });

  return {
    casId,
    joinToken,
    joinUrl,
    qrDataUrl,
    isAssistActive,
    isStarting,
    startAssist,
    stopAssist,
  };
}
