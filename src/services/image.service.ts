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

  // Backend UploadFileDto ใช้ field 'path' สำหรับกำหนด folder ปลายทาง
  // ถ้าไม่ระบุ Backend จะ default เป็น '/uploaded_files'
  if (request.folder) {
    formData.append('path', request.folder);
  }

  try {
    const response = await api.post<ImageUploadResponse>(PLATFORM_GATEWAY.UPLOAD_IMAGE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('Upload response data:', response.data);

    // Backend/University API ส่ง fileName หรือ path กลับมาใน result, filename หรือ path
    const fileName = response.data.result || response.data.filename || response.data.path;
    if (!fileName) {
      throw new Error('No file path returned from upload response');
    }

    return fileName;
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

  // ใช้ API_BASE_URL จาก environment แทนการ hardcode '/api' เพื่อให้ดึงรูปข้ามเครื่องได้ถูกต้องในระหว่างพัฒนา
  const baseUrl = process.env.API_BASE_URL || PLATFORM_GATEWAY.BASE_PATH;
  const sanitizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  const cleanBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;

  // เนื่องจาก PlatformGatewayController ใช้ @Controller('api') ร่วมกับ Global Prefix 'api'
  // พาร์ทที่เข้าถึงจึงต้องเป็น /api/api/... เสมอ
  if (baseUrl.includes('http://') || baseUrl.includes('https://')) {
    return `${cleanBaseUrl}/api${sanitizedPath}`;
  } else {
    return `/api/api${sanitizedPath}`;
  }
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
