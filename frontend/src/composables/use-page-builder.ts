/**
 * Composable: Page Builder
 * จัดการ state + การแก้ไขเนื้อหาหน้าแรก (banner / card / exam_rule)
 */

import { ref } from 'vue';
import { getHomepage, updatePageContent } from 'src/services/page-builder.service';
import {
  PageSectionType,
  type BannerBoxContent,
  type CardBoxContent,
  type ExamRuleBoxContent,
  type PageContent,
  type PageSectionContent,
} from 'src/types/page-builder.types';

/** สร้าง section เปล่าตามชนิดที่ระบุ */
const createEmptySection = (
  type: PageSectionType,
  sortOrder: number,
): PageSectionContent => ({
  type,
  sortOrder,
  title: { th: '', en: '' },
  icon: null,
  active: true,
  boxes: [],
});

export function usePageBuilder() {
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  // section หลักของหน้า (ลำดับตาม Figma: banner → card → exam_rule)
  const bannerSection = ref<PageSectionContent>(
    createEmptySection(PageSectionType.BANNER, 1),
  );
  const cardSection = ref<PageSectionContent>(
    createEmptySection(PageSectionType.CARD, 2),
  );
  const examRuleSection = ref<PageSectionContent>(
    createEmptySection(PageSectionType.EXAM_RULE, 3),
  );

  /** ดึง section ตามชนิดจาก content (ถ้าไม่มีให้ใช้ค่าเริ่มต้น) */
  const pickSection = (
    sections: PageSectionContent[],
    type: PageSectionType,
    fallbackOrder: number,
  ): PageSectionContent => {
    const found = sections.find((s) => s.type === type);
    return found ?? createEmptySection(type, fallbackOrder);
  };

  const fetchPage = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await getHomepage();
      const sections = data.PCF_CONTENT?.sections ?? [];
      bannerSection.value = pickSection(sections, PageSectionType.BANNER, 1);
      cardSection.value = pickSection(sections, PageSectionType.CARD, 2);
      examRuleSection.value = pickSection(sections, PageSectionType.EXAM_RULE, 3);
    } catch {
      error.value = 'ไม่สามารถโหลดข้อมูลหน้าแรกได้';
    } finally {
      isLoading.value = false;
    }
  };

  /** ประกอบ sections ทั้งหมด + จัด sortOrder ใหม่ตามตำแหน่งปัจจุบัน */
  const buildContent = (): PageContent => {
    const normalize = (section: PageSectionContent, order: number): PageSectionContent => ({
      ...section,
      sortOrder: order,
      boxes: section.boxes.map((box, index) => ({ ...box, sortOrder: index + 1 })),
    });

    return {
      sections: [
        normalize(bannerSection.value, 1),
        normalize(cardSection.value, 2),
        normalize(examRuleSection.value, 3),
      ],
    };
  };

  const save = async (): Promise<boolean> => {
    isSaving.value = true;
    error.value = null;
    try {
      await updatePageContent(buildContent());
      return true;
    } catch {
      error.value = 'บันทึกข้อมูลไม่สำเร็จ';
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  // ---------- helper: จัดการ box ในแต่ละ section ----------

  const addBanner = (): void => {
    const box: BannerBoxContent = {
      sortOrder: bannerSection.value.boxes.length + 1,
      imagePath: '',
      active: true,
    };
    bannerSection.value.boxes.push(box);
  };

  const addCard = (): void => {
    const box: CardBoxContent = {
      sortOrder: cardSection.value.boxes.length + 1,
      title: { th: '', en: '' },
      subtitle: { th: '', en: '' },
      icon: null,
      active: true,
    };
    cardSection.value.boxes.push(box);
  };

  const addExamRule = (): void => {
    const box: ExamRuleBoxContent = {
      sortOrder: examRuleSection.value.boxes.length + 1,
      icon: null,
      text: { th: '', en: '' },
      active: true,
    };
    examRuleSection.value.boxes.push(box);
  };

  const removeBox = (section: PageSectionContent, index: number): void => {
    section.boxes.splice(index, 1);
  };

  const moveBox = (section: PageSectionContent, from: number, to: number): void => {
    if (to < 0 || to >= section.boxes.length) return;
    const [moved] = section.boxes.splice(from, 1);
    if (moved) section.boxes.splice(to, 0, moved);
  };

  return {
    isLoading,
    isSaving,
    error,
    bannerSection,
    cardSection,
    examRuleSection,
    fetchPage,
    save,
    addBanner,
    addCard,
    addExamRule,
    removeBox,
    moveBox,
  };
}
