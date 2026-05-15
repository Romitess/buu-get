import { ref, watch, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

/**
 * useCountdown
 * Composable สำหรับจัดการ Countdown Timer
 * รองรับทั้งแบบ Mock (MM:SS) และแบบ Backend (ISO Date String)
 *
 * @param deadline - Ref ของ deadline string (MM:SS หรือ ISO Date)
 * @param onTimeout - Callback เมื่อหมดเวลา
 * @returns displayDeadline - ข้อความแสดงเวลาที่เหลือ (MM:SS)
 */
export function useCountdown(
  deadline: Ref<string | Date | undefined>,
  onTimeout?: () => void,
): { displayDeadline: Ref<string | undefined> } {
  const displayDeadline = ref<string | undefined>(undefined);
  let timerInterval: ReturnType<typeof setInterval> | null = null;

  const clearTimer = (): void => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const startTimer = (): void => {
    const deadlineStr = deadline.value;
    if (!deadlineStr) return;

    const parsedDate = new Date(deadlineStr);
    if (isNaN(parsedDate.getTime())) {
      displayDeadline.value = '00:00';
      return;
    }
    const targetTime = parsedDate.getTime();

    const updateDisplay = (): void => {
      const now = Date.now();
      const diff = targetTime - now;

      if (diff <= 0) {
        clearTimer();
        displayDeadline.value = '00:00';
        onTimeout?.();
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;

      displayDeadline.value = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    updateDisplay(); // อัปเดตทันทีที่เริ่ม
    timerInterval = setInterval(updateDisplay, 1000);
  };

  onMounted(() => {
    startTimer();
  });

  onUnmounted(() => {
    clearTimer();
  });

  // Restart timer if deadline changes externally
  watch(deadline, () => {
    clearTimer();
    startTimer();
  });

  return { displayDeadline };
}
