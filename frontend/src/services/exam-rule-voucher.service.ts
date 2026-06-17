import { api } from 'src/boot/axios';

export interface RegulationsData {
  regulationsEn: string;
  regulationsTh: string;
}

/**
 * ดึงข้อมูล Test Regulations (EN & TH) จาก API
 */
export const getRegulations = async (): Promise<RegulationsData> => {
  const response = await api.get<RegulationsData>('/exam-rule-vouchers/regulations');
  return response.data;
};

/**
 * บันทึกข้อมูล Test Regulations (EN & TH) ผ่าน API
 */
export const saveRegulations = async (data: RegulationsData): Promise<RegulationsData> => {
  const response = await api.put<RegulationsData>('/exam-rule-vouchers/regulations', data);
  return response.data;
};
