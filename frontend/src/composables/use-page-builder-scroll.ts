import { nextTick, type Ref } from 'vue';

/**
 * Smoothly scrolls the most recently added box into view inside its scroll
 * container and briefly highlights it, so the user immediately sees the block
 * they just added. New boxes are always appended, so the target is always the
 * container's last element child.
 */
const FLASH_CLASS = 'pb-flash';
const FLASH_DURATION_MS = 1200;

export const scrollNewBoxIntoView = async (listRef: Ref<HTMLElement | null>): Promise<void> => {
  await nextTick();

  const list = listRef.value;
  const newBox = list?.lastElementChild as HTMLElement | null;
  if (!newBox) return;

  newBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  newBox.classList.add(FLASH_CLASS);
  window.setTimeout(() => newBox.classList.remove(FLASH_CLASS), FLASH_DURATION_MS);
};
