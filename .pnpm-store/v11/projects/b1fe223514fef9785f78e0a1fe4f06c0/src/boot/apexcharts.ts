import { boot } from 'quasar/wrappers';
import VueApexCharts from 'vue3-apexcharts';

// ลงทะเบียน component <apexchart> ให้ใช้ได้ทั่วทั้งแอป
export default boot(({ app }) => {
  app.use(VueApexCharts);
});
