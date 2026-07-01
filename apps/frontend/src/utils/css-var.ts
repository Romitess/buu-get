/**
 * อ่านค่า CSS custom property (design token) จาก :root ขณะ runtime
 * ใช้กับไลบรารีที่ต้องการสีเป็น string (เช่น ApexCharts) เพื่อเลี่ยงการ hard code สี
 *
 * @param name ชื่อตัวแปร เช่น '--exam-report-chart-attend'
 * @param fallback ค่าที่ใช้เมื่ออ่านไม่ได้ (เช่นบน SSR)
 */
export const getCssVar = (name: string, fallback = '#000000'): string => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return value.trim() || fallback;
};

/** อ่านหลายตัวแปรพร้อมกัน คืนเป็น array ของสี (ตามลำดับที่ส่งเข้า) */
export const getCssVars = (names: string[], fallback = '#000000'): string[] =>
  names.map((name) => getCssVar(name, fallback));
