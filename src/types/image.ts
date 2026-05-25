/**
 * Image Type Definitions
 * ไฟล์นี้กำหนด types และ interfaces สำหรับการจัดการรูปภาพ
 */

export interface ImageUploadResponse {
  /** path ของรูปที่บันทึกไว้ใน platform-gateway */
  path: string;
  /** ชื่อไฟล์รูป */
  filename: string;
  /** ขนาดไฟล์ (bytes) */
  size: number;
  /** MIME type */
  mimeType: string;
}

export interface ImageUploadRequest {
  /** ไฟล์รูปที่ต้อง upload */
  file: File;
  /** folder destination (optional) - ถ้าไม่ระบุจะใช้ default */
  folder?: string;
}

export interface ImageAsset {
  /** path ของรูปที่เก็บใน database */
  imagePath: string;
  /** URL ที่ใช้ display รูป */
  displayUrl: string;
  /** alternative text */
  alt?: string;
}
