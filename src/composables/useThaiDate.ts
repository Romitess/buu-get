import { BUDDHIST_YEAR_OFFSET } from 'src/constants/exam';

export function useThaiDate() {
  const formatThaiDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear() + BUDDHIST_YEAR_OFFSET;
    return `${day}/${month}/${year}`;
  };
  return { formatThaiDate };
}
