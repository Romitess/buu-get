/**
 * สไตล์ scrollbar ของ q-scroll-area ในหน้า Page Builder ให้ตรงกับ Figma
 * (track สีเทาอ่อน + thumb สีเทาเข้มแบบบาง) ใช้ design token จาก css/app.scss
 * รวมไว้ที่เดียวเพื่อไม่ให้ค่าซ้ำในหลาย component
 */
interface ScrollbarStyles {
  thumbStyle: Record<string, string>;
  barStyle: Record<string, string>;
}

export function usePageBuilderScrollbar(): ScrollbarStyles {
  const thumbStyle: Record<string, string> = {
    width: '5px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--pb-scrollbar-thumb)',
    opacity: '1',
  };

  const barStyle: Record<string, string> = {
    width: '7px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--pb-scrollbar-track)',
    opacity: '1',
  };

  return { thumbStyle, barStyle };
}
