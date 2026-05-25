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
  /** Endpoint สำหรับ upload รูป */
  UPLOAD_IMAGE: '/api/images/upload',
  /** Endpoint สำหรับดาวน์โหลด/display รูป */
  GET_IMAGE: '/api/images',
} as const;

/**
 * Backend API Endpoints (main application API)
 */
export const BACKEND_API = {
  /** Exam endpoints */
  EXAM: '/exam',
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
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  /** Allowed file extensions */
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as const,
} as const;
