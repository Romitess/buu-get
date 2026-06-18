import { api } from 'src/boot/axios';

export interface BandRuleData {
  id: string;
  band: string;
  minScore: number;
  maxScore: number;
  cefr: string;
  descriptor: string;
}

export interface BandRulesResponse {
  bandRules: BandRuleData[];
}

/**
 * ดึงข้อมูล Band Rules จาก API
 */
export const getBandRules = async (): Promise<BandRulesResponse> => {
  const response = await api.get<BandRulesResponse>('/score-criteria/band-rules');
  return response.data;
};

/**
 * บันทึก Band Rules ผ่าน API
 */
export const saveBandRules = async (bandRules: BandRuleData[]): Promise<BandRulesResponse> => {
  const response = await api.put<BandRulesResponse>('/score-criteria/band-rules', {
    bandRules,
  });
  return response.data;
};
