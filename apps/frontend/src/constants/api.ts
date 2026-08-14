/**
 * API Configuration & Endpoints
 * ไฟล์นี้เก็บ constants ทั้งหมดที่เกี่ยวกับ API endpoints
 * ห้าม hardcode paths - ใช้ constants จากไฟล์นี้เท่านั้น
 */

/**
 * Platform Gateway Configuration
 * ใช้สำหรับ upload/download รูปภาพ
 */
export const PLATFORM_GATEWAY = {
  /** Base path สำหรับ platform gateway */
  BASE_PATH: '/api',
  /**
   * Endpoint สำหรับ upload รูปตามชนิด (ตรงกับ Backend POST /api/images/upload)
   * client ส่งแค่ field `category` — backend เป็นผู้กำหนด folder ปลายทาง
   */
  UPLOAD_IMAGE: '/api/images/upload',
  /** Endpoint สำหรับดึง public file URL */
  GET_PUBLIC_FILE: '/api/uploadFile',
} as const;

/**
 * ชนิดรูปภาพ (category) — ต้อง sync กับ registry ฝั่ง backend
 * (backend/src/modules/platform-gateway/constants/image-category.config.ts)
 * เพิ่มชนิดใหม่ = เพิ่ม key ที่นี่ + เพิ่ม entry ฝั่ง backend
 */
export type ImageCategory = 'user-image' | 'page-builder';

/**
 * Backend API Endpoints (main application API)
 */
export const BACKEND_API = {
  /** Exam endpoints */
  EXAM: '/exam',
  /** Public published exam schedule */
  EXAM_SCHEDULE: '/exam/schedule',
  /** User endpoints */
  USER: '/user',
  /** Enrollment endpoints */
  ENROLLMENT: '/enrollment',
} as const;

/**
 * Image Upload Configuration
 */
export const IMAGE_CONFIG = {
  /** Maximum file size (bytes) - 5MB */
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  /** Allowed MIME types */
  ALLOWED_TYPES: ['image/jpeg', 'image/png'] as const,
  /** Allowed file extensions */
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png'] as const,
} as const;
