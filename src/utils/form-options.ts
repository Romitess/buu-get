/** คำนำหน้าภาษาไทย (label แสดงผล + value ส่งไป backend) */
export const TITLE_TH_OPTIONS = [
  { label: 'นาย', value: 'นาย' },
  { label: 'นาง', value: 'นาง' },
  { label: 'นางสาว', value: 'นางสาว' },
  { label: 'ดร.', value: 'ด็อกเตอร์' },
  { label: 'ศ.', value: 'ศาสตราจารย์' },
  { label: 'รศ.', value: 'รองศาสตราจารย์' },
  { label: 'ผศ.', value: 'ผู้ช่วยศาสตราจารย์' },
] as const;

/** คำนำหน้าภาษาอังกฤษ */
export const TITLE_EN_OPTIONS = [
  'Mr.',
  'Mrs.',
  'Miss',
  'Ms.',
  'Dr.',
  'Prof.',
  'Assoc. Prof.',
  'Asst. Prof.',
] as const;

/** ระดับการศึกษา (ภาษาไทย — ค่า value ส่ง backend) */
export const EDUCATION_LEVEL_OPTIONS = [
  'มัธยมศึกษา',
  'ปริญญาตรี',
  'ปริญญาโท',
  'ปริญญาเอก',
] as const;
