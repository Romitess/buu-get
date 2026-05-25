/**
 * Composable: Image Upload
 * ไฟล์นี้จัดการ logic ของการ upload รูป รวมถึง loading state และ error handling
 */

import { ref } from 'vue';
import { uploadImage } from 'src/services/image.service';
import type { ImageUploadRequest } from 'src/types/image';

export interface UseImageUploadOptions {
  /** callback เมื่อ upload เสร็จ - return imagePath */
  onSuccess?: (imagePath: string) => void;
  /** callback เมื่อ upload ล้มเหลว */
  onError?: (error: Error) => void;
}

export function useImageUpload(options?: UseImageUploadOptions) {
  const isUploading = ref(false);
  const uploadError = ref<string | null>(null);
  const uploadedPath = ref<string | null>(null);

  /**
   * ทำการ upload รูป
   * @param file - ไฟล์รูปที่ต้อง upload
   * @param folder - (optional) folder destination
   * @returns imagePath ที่บันทึกไว้
   */
  const handleImageUpload = async (file: File, folder?: string): Promise<string | null> => {
    isUploading.value = true;
    uploadError.value = null;
    uploadedPath.value = null;

    try {
      const request: ImageUploadRequest = folder ? { file, folder } : { file };
      const imagePath = await uploadImage(request);

      uploadedPath.value = imagePath;
      options?.onSuccess?.(imagePath);

      return imagePath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      uploadError.value = errorMessage;
      options?.onError?.(error instanceof Error ? error : new Error(errorMessage));

      return null;
    } finally {
      isUploading.value = false;
    }
  };

  /**
   * รีเซ็ต state กลับมาเบื้องต้น
   */
  const resetUploadState = (): void => {
    isUploading.value = false;
    uploadError.value = null;
    uploadedPath.value = null;
  };

  return {
    isUploading,
    uploadError,
    uploadedPath,
    handleImageUpload,
    resetUploadState,
  };
}
