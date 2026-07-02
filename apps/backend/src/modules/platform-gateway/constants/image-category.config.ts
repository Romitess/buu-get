/**
 * ทะเบียนชนิดรูปภาพ (Image Category Registry)
 *
 * เป็น single source of truth ของ "ชนิดรูป → folder ปลายทาง + กติกา"
 * การเพิ่มชนิดรูปใหม่ในอนาคต = เพิ่ม 1 entry ในนี้เท่านั้น
 * ไม่ต้องแก้ controller/service/endpoint หรือ hardcode path ที่ frontend
 */
export interface ImageCategoryConfig {
  /** prefix ฐานใน storage เช่น '/user_images' */
  baseFolder: string;
  /**
   * per-user = ต่อท้ายด้วย /{userId} เพื่อแยกโฟลเดอร์ตามผู้ใช้
   * shared   = ใช้ baseFolder ตรง ๆ (ไม่ผูกกับผู้ใช้)
   */
  scope: 'per-user' | 'shared';
  /** true = ต้องมี JWT (per-user จำเป็นต้องมีเพื่อรู้ userId) */
  requireAuth: boolean;
}

export const IMAGE_CATEGORIES = {
  'user-image': {
    baseFolder: '/user_images',
    scope: 'per-user',
    requireAuth: true,
  },
  'page-builder': {
    baseFolder: '/page_builder',
    scope: 'shared',
    requireAuth: false,
  },
  // 🔮 อนาคต เพิ่มได้ที่นี่ เช่น:
  // 'exam-doc': { baseFolder: '/exam_docs', scope: 'per-user', requireAuth: true },
} as const satisfies Record<string, ImageCategoryConfig>;

export type ImageCategory = keyof typeof IMAGE_CATEGORIES;

export const isImageCategory = (value: unknown): value is ImageCategory =>
  typeof value === 'string' &&
  Object.prototype.hasOwnProperty.call(IMAGE_CATEGORIES, value);

/**
 * คำนวณ folder ปลายทางจากชนิดรูป
 * @throws Error ถ้า per-user แต่ไม่มี userId
 */
export const resolveImageFolder = (
  category: ImageCategory,
  userId?: number,
): string => {
  const cfg = IMAGE_CATEGORIES[category];
  if (cfg.scope === 'per-user') {
    if (userId === undefined || userId === null) {
      throw new Error(
        `Image category "${category}" is per-user but no userId was provided`,
      );
    }
    return `${cfg.baseFolder}/${userId}`;
  }
  return cfg.baseFolder;
};
