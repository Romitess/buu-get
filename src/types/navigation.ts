/**
 * Navigation Item — ใช้สำหรับ Sidebar Menu
 * แต่ละ item มี route path, icon, label, และ badge (optional)
 */
export interface NavigationItem {
  /** ชื่อ Route (ต้องตรงกับ name ใน routes.ts) */
  name: string;
  /** ข้อความที่แสดงบน Menu */
  label: string;
  /** Material icon name */
  icon: string;
  /** Route path */
  path: string;
  /** Badge count (optional — เช่น จำนวน notification) */
  badge?: number;
  /** ซ่อน item นี้จาก sidebar */
  hidden?: boolean;
  /** รายการเมนูย่อย (Dropdown) */
  children?: NavigationItem[];
  /** Roles ที่มีสิทธิ์เห็นเมนูนี้ (ถ้าไม่กำหนด = ทุก role เห็น) */
  requiredRoles?: ('admin' | 'staff' | 'user')[];
}

/**
 * Navigation Group — จัดกลุ่ม menu items (optional)
 */
export interface NavigationGroup {
  /** ชื่อกลุ่ม (แสดงเมื่อ sidebar expand) */
  title: string;
  /** รายการ menu items ในกลุ่ม */
  items: NavigationItem[];
}
