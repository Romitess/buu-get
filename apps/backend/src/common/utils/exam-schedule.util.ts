/** เปรียบเทียบช่วงเวลาแบบ HH:MM / HH:MM:SS — ทับซ้อนเมื่อ startA < endB && endA > startB */
export function doExamTimeRangesOverlap(
  startA: string | null | undefined,
  endA: string | null | undefined,
  startB: string | null | undefined,
  endB: string | null | undefined,
): boolean {
  if (!startA || !endA || !startB || !endB) {
    return false;
  }

  const normalize = (time: string): string => time.trim().substring(0, 8);
  const aStart = normalize(startA);
  const aEnd = normalize(endA);
  const bStart = normalize(startB);
  const bEnd = normalize(endB);

  return aStart < bEnd && aEnd > bStart;
}
