/** คำนำหน้าภาษาไทย (label แสดงผล + value ส่งไป backend) */
export const TITLE_TH_OPTIONS = [
  { label: 'นาย', value: 'นาย', i18nKey: 'mr' },
  { label: 'นาง', value: 'นาง', i18nKey: 'mrs' },
  { label: 'นางสาว', value: 'นางสาว', i18nKey: 'miss' },
  { label: 'ดร.', value: 'ด็อกเตอร์', i18nKey: 'dr' },
  { label: 'ศ.', value: 'ศาสตราจารย์', i18nKey: 'prof' },
  { label: 'รศ.', value: 'รองศาสตราจารย์', i18nKey: 'assocProf' },
  { label: 'ผศ.', value: 'ผู้ช่วยศาสตราจารย์', i18nKey: 'asstProf' },
] as const;

/** ระดับการศึกษา (ภาษาไทย — ค่า value ส่ง backend) */
export const EDUCATION_LEVEL_OPTIONS = [
  'มัธยมศึกษา',
  'ปริญญาตรี',
  'ปริญญาโท',
  'ปริญญาเอก',
] as const;
