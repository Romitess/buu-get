/**
 * Image Type Definitions
 * ไฟล์นี้กำหนด types และ interfaces สำหรับการจัดการรูปภาพ
 */

import type { ImageCategory } from 'src/constants/api';

export interface ImageUploadResponse {
  /** path ของรูปที่บันทึกไว้ใน platform-gateway */
  path: string;
  /** ชื่อไฟล์รูป */
  filename: string;
  /** ขนาดไฟล์ (bytes) */
  size: number;
  /** MIME type */
  mimeType: string;
  /** path ของไฟล์รูปที่ได้จาก minio */
  result?: string;
}

export interface ImageUploadRequest {
  /** ไฟล์รูปที่ต้อง upload */
  file: File;
  /** ชนิดรูป (category) - backend จะ map เป็น folder ปลายทางเอง */
  category: ImageCategory;
}

export interface ImageAsset {
  /** path ของรูปที่เก็บใน database */
  imagePath: string;
  /** URL ที่ใช้ display รูป */
  displayUrl: string;
  /** alternative text */
  alt?: string;
}
