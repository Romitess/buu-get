import { ref, watch, onMounted, onUnmounted } from 'vue';
import type { Ref } from 'vue';

/**
 * คำนวณข้อความเวลานับถอยหลัง (MM:SS) จาก deadline กับเวลาปัจจุบัน
 * แยกเป็น pure function เพื่อให้ card/dialog ที่ใช้ deadline เดียวกันได้ค่าตรงกัน
 */
export function formatCountdownRemaining(
  deadline: string | Date | undefined,
  nowMs: number = Date.now(),
): string | undefined {
  if (deadline === undefined || deadline === '') return undefined;

  const parsedDate = new Date(deadline);
  if (isNaN(parsedDate.getTime())) {
    return '00:00';
  }

  const diff = parsedDate.getTime() - nowMs;
  if (diff <= 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(diff / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;

  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function isValidDeadline(deadline: string | Date | undefined): boolean {
  if (deadline === undefined || deadline === '') return false;
  return !isNaN(new Date(deadline).getTime());
}

/**
 * useCountdown
 * Composable สำหรับจัดการ Countdown Timer จาก deadline (ISO Date / Date)
 *
 * Tick จัดให้ตรง wall-clock second boundary เพื่อให้หลาย instance
 * (เช่น card กับ dialog) อัปเดตค่า MM:SS พร้อมกัน
 *
 * @param deadline - Ref ของ deadline string (ISO Date) หรือ Date
 * @param onTimeout - Callback เมื่อหมดเวลา
 * @returns displayDeadline - ข้อความแสดงเวลาที่เหลือ (MM:SS)
 */
export function useCountdown(
  deadline: Ref<string | Date | undefined>,
  onTimeout?: () => void,
): { displayDeadline: Ref<string | undefined> } {
  const displayDeadline = ref<string | undefined>(undefined);
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let hasTimedOut = false;

  const clearTimer = (): void => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const updateDisplay = (): void => {
    const next = formatCountdownRemaining(deadline.value);
    displayDeadline.value = next;

    if (next === '00:00' && isValidDeadline(deadline.value)) {
      clearTimer();
      if (!hasTimedOut) {
        hasTimedOut = true;
        onTimeout?.();
      }
    }
  };

  /** จัดตาราง tick ให้ตรงขอบวินาทีของนาฬิกาจริง (ลดการคลาดเคลื่อนระหว่าง instance) */
  const scheduleTick = (): void => {
    clearTimer();
    const msToNextSecond = 1000 - (Date.now() % 1000);
    timerId = setTimeout(() => {
      updateDisplay();
      if (displayDeadline.value !== '00:00' && displayDeadline.value !== undefined) {
        scheduleTick();
      }
    }, msToNextSecond);
  };

  const startTimer = (): void => {
    clearTimer();
    hasTimedOut = false;

    if (!deadline.value) {
      displayDeadline.value = undefined;
      return;
    }

    updateDisplay();
    if (displayDeadline.value !== '00:00' && displayDeadline.value !== undefined) {
      scheduleTick();
    }
  };

  onMounted(() => {
    startTimer();
  });

  onUnmounted(() => {
    clearTimer();
  });

  watch(deadline, () => {
    startTimer();
  });

  return { displayDeadline };
}
