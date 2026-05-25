/**
 * Composable: Image URL
 * ไฟล์นี้จัดการการสร้าง URL สำหรับแสดงรูปภาพ
 */

import { computed, type ComputedRef } from 'vue';
import { getImageUrl } from 'src/services/image.service';

/**
 * ใช้สำหรับสร้าง URL ของรูปสำหรับการแสดง
 * @param imagePath - path ของรูป (เก็บไว้ใน database)
 * @returns computed property ที่มี URL ของรูป
 *
 * @example
 * const { displayUrl, isImageAvailable } = useImageUrl(userProfilePath);
 * // displayUrl.value = '/api/uploads/profile/user-123.jpg'
 * // isImageAvailable.value = true
 */
export function useImageUrl(imagePath: string | null | undefined): {
  displayUrl: ComputedRef<string>;
  isImageAvailable: ComputedRef<boolean>;
} {
  const displayUrl = computed(() => getImageUrl(imagePath));

  const isImageAvailable = computed(() => {
    return displayUrl.value.length > 0;
  });

  return {
    displayUrl,
    isImageAvailable,
  };
}
