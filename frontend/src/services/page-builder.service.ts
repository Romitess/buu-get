/**
 * Page Builder Service
 * เรียก API ของ module page-builder (หน้าแรกของระบบ)
 */

import { api } from 'src/boot/axios';
import type { PageConfigResponse, PageContent } from 'src/types/page-builder.types';

/**
 * ดึงเนื้อหาหน้าแรก (sections + boxes) ที่ใช้งานอยู่
 */
export const getHomepage = async (): Promise<PageConfigResponse> => {
  const response = await api.get<PageConfigResponse>('/page-builder/homepage');
  return response.data;
};

/**
 * อัปเดตเนื้อหาหน้าแรกทั้งก้อน
 */
export const updatePageContent = async (
  content: PageContent,
): Promise<PageConfigResponse> => {
  const response = await api.patch<PageConfigResponse>('/page-builder/content', {
    PCF_CONTENT: content,
  });
  return response.data;
};
