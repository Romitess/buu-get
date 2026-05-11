import { boot } from 'quasar/wrappers';
import { useUserStore } from 'src/stores/user.store';

/**
 * Boot file สำหรับจัดการเรื่อง Authentication เบื้องต้น
 * ทำหน้าที่โหลดสถานะการ Login จาก LocalStorage เมื่อแอปเริ่มต้น
 */
export default boot(async ({ store }) => {
  const userStore = useUserStore(store);

  // โหลดข้อมูลผู้ใช้เริ่มต้น (เช่น เช็คว่าเคย Login ค้างไว้ไหม)
  // ต้องใส่ await เพราะเราเปลี่ยน initialize เป็น async แล้ว
  await userStore.initialize();

  // หมายเหตุ: ระบบ Route Guard (การดักหน้าประตู)
  // ถูกย้ายไปจัดการที่ src/router/index.ts ทั้งหมดแล้ว เพื่อลดความซ้ำซ้อน
});
