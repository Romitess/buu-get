/**
 * Image Service
 * ไฟล์นี้จัดการการ upload/download รูปภาพจาก platform-gateway
 */

import { api } from 'src/boot/axios';
import type { ImageUploadResponse, ImageUploadRequest } from 'src/types/image';
import { PLATFORM_GATEWAY, IMAGE_CONFIG } from 'src/constants/api';

/**
 * อัพโหลดรูปไปยัง platform-gateway
 * @param request - ข้อมูล upload (file, folder)
 * @returns path ของรูปที่บันทึกไว้
 * @throws Error ถ้า upload ไม่สำเร็จ
 */
export const uploadImage = async (request: ImageUploadRequest): Promise<string> => {
  validateImageFile(request.file);

  const formData = new FormData();
  formData.append('file', request.file);

  if (request.folder) {
    formData.append('folder', request.folder);
  }

  try {
    const response = await api.post<ImageUploadResponse>(PLATFORM_GATEWAY.UPLOAD_IMAGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data.path) {
      throw new Error('No path returned from upload response');
    }

    return response.data.path;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error('Failed to upload image. Please try again.');
  }
};

/**
 * สร้าง URL สำหรับแสดงรูปจาก platform-gateway
 * @param imagePath - path ของรูป (ที่ได้จากการ upload)
 * @returns URL ที่ใช้ display รูป
 */
export const getImageUrl = (imagePath: string | null | undefined): string => {
  if (!imagePath) {
    return '';
  }

  // ถ้า path เป็น full URL แล้ว ให้ return ตรงๆ
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // สร้าง URL โดยใช้ platform-gateway + path
  return `${PLATFORM_GATEWAY.BASE_PATH}${imagePath}`;
};

/**
 * ตรวจสอบความถูกต้องของไฟล์รูป
 * @param file - ไฟล์ที่ต้อง validate
 * @throws Error ถ้าไฟล์ไม่ถูกต้อง
 */
const validateImageFile = (file: File): void => {
  // ตรวจสอบขนาดไฟล์
  if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
    const maxSizeMB = IMAGE_CONFIG.MAX_FILE_SIZE / (1024 * 1024);
    throw new Error(`File size must not exceed ${maxSizeMB}MB`);
  }

  // ตรวจสอบ MIME type
  if (!(IMAGE_CONFIG.ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    const allowedTypesStr = IMAGE_CONFIG.ALLOWED_TYPES.join(', ');
    throw new Error(`Only these file types are allowed: ${allowedTypesStr}`);
  }

  // ตรวจสอบ file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!(IMAGE_CONFIG.ALLOWED_EXTENSIONS as readonly string[]).includes(fileExtension)) {
    const allowedExtsStr = IMAGE_CONFIG.ALLOWED_EXTENSIONS.join(', ');
    throw new Error(`Only these file extensions are allowed: ${allowedExtsStr}`);
  }
};
