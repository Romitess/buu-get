/**
 * คำนวณค่าสูงสุดแกน Y แบบ "สวย" จากข้อมูลจริง
 * — ปัดขึ้นตาม tick step และเผื่อพื้นที่เล็กน้อยให้ dataLabels
 */
export function getNiceYAxisMax(values: number[], tickAmount = 5): number {
  const safeTickAmount = Math.max(1, Math.floor(tickAmount));
  const numericValues = values.filter((value) => Number.isFinite(value));
  const dataMax = numericValues.length > 0 ? Math.max(0, ...numericValues) : 0;

  if (dataMax <= 0) {
    return safeTickAmount;
  }

  // เผื่อ ~10% ให้ dataLabels ด้านบนไม่ชนขอบ
  const target = dataMax * 1.1;
  const roughStep = target / safeTickAmount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const residual = roughStep / magnitude;

  let niceResidual: number;
  if (residual <= 1) niceResidual = 1;
  else if (residual <= 2) niceResidual = 2;
  else if (residual <= 5) niceResidual = 5;
  else niceResidual = 10;

  const step = niceResidual * magnitude;
  // ให้ max หารด้วย step ลงตัว และยังสูงกว่า target
  return Math.ceil(target / step) * step;
}
