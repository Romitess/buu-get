import { api } from 'src/boot/axios';
import type { ExecutiveTestTakerPage } from 'src/types/executive-test-taker.types';

export interface ExecutiveTestTakerQuery {
  page: number;
  limit: number;
  search?: string;
}

export const fetchExecutiveTestTakers = async (
  query: ExecutiveTestTakerQuery,
): Promise<ExecutiveTestTakerPage> => {
  const response = await api.get<ExecutiveTestTakerPage>(
    '/exam-enrollments/executive/test-takers',
    {
      params: query,
    },
  );
  return response.data;
};
