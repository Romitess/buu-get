/**
 * Composable: Page Builder
 * จัดการ state + การโหลด/บันทึกเนื้อหาหน้าหลัก ตาม Figma
 * แบ่งเป็น: แบรนเนอร์ / รูปแบบการทดสอบ / ขั้นตอนการสมัครสอบ / ข้อปฏิบัติ (กระดาษ + คอมพิวเตอร์)
 */

import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getHomepage, updatePageContent } from 'src/services/page-builder.service';
import {
  PageSectionType,
  type BannerBoxContent,
  type CardBoxContent,
  type ContentBoxContent,
  type EditorSection,
  type ExamRuleBoxContent,
  type LocalizedText,
  type PageContent,
  type PageSectionContent,
  type StepBoxContent,
} from 'src/types/page-builder.types';

const emptyText = (): LocalizedText => ({ th: '', en: '' });

const SECTION_TITLE = {
  banner: { th: 'ข้อมูลแบรนเนอร์', en: 'Banner' },
  format: { th: 'รูปแบบการทดสอบ', en: 'Test format' },
  step: { th: 'ขั้นตอนการสมัครสอบ', en: 'Registration steps' },
  rulePaper: { th: 'รูปแบบกระดาษ', en: 'Paper-based' },
  ruleComputer: { th: 'รูปแบบคอมพิวเตอร์', en: 'Computer-based' },
} as const;

const createBannerSection = (): EditorSection<BannerBoxContent> => ({
  type: PageSectionType.BANNER,
  title: { ...SECTION_TITLE.banner },
  active: true,
  boxes: [],
});

const createContentSection = (
  type: PageSectionType,
  title: LocalizedText,
): EditorSection<ContentBoxContent> => ({
  type,
  title: { ...title },
  active: true,
  boxes: [],
});

const createRuleSection = (title: LocalizedText): EditorSection<ExamRuleBoxContent> => ({
  type: PageSectionType.EXAM_RULE,
  title: { ...title },
  active: true,
  boxes: [],
});

export function usePageBuilder() {
  const { t } = useI18n();
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  const bannerSection = ref<EditorSection<BannerBoxContent>>(createBannerSection());
  const formatSection = ref<EditorSection<ContentBoxContent>>(
    createContentSection(PageSectionType.CARD, SECTION_TITLE.format),
  );
  const stepSection = ref<EditorSection<ContentBoxContent>>(
    createContentSection(PageSectionType.STEP, SECTION_TITLE.step),
  );
  const rulePaperSection = ref<EditorSection<ExamRuleBoxContent>>(
    createRuleSection(SECTION_TITLE.rulePaper),
  );
  const ruleComputerSection = ref<EditorSection<ExamRuleBoxContent>>(
    createRuleSection(SECTION_TITLE.ruleComputer),
  );

  const findSection = (
    sections: PageSectionContent[],
    type: PageSectionType,
  ): PageSectionContent | undefined => sections.find((section) => section.type === type);

  const readBanner = (sections: PageSectionContent[]): EditorSection<BannerBoxContent> => {
    const source = findSection(sections, PageSectionType.BANNER);
    const base = createBannerSection();
    if (!source) return base;
    return {
      ...base,
      title: source.title ?? base.title,
      active: source.active ?? true,
      boxes: (source.boxes as BannerBoxContent[]).map((box) => ({
        sortOrder: box.sortOrder,
        imagePath: box.imagePath,
        active: box.active ?? true,
      })),
    };
  };

  const readContent = (
    sections: PageSectionContent[],
    type: PageSectionType,
    contentFrom: (box: CardBoxContent | StepBoxContent) => LocalizedText | undefined,
    fallbackTitle: LocalizedText,
  ): EditorSection<ContentBoxContent> => {
    const source = findSection(sections, type);
    const base = createContentSection(type, fallbackTitle);
    if (!source) return base;
    return {
      ...base,
      title: source.title ?? base.title,
      active: source.active ?? true,
      boxes: (source.boxes as Array<CardBoxContent | StepBoxContent>).map((box) => ({
        sortOrder: box.sortOrder,
        title: box.title ?? emptyText(),
        content: contentFrom(box) ?? emptyText(),
        active: box.active ?? true,
      })),
    };
  };

  const mapRuleSection = (
    source: PageSectionContent,
    fallbackTitle: LocalizedText,
  ): EditorSection<ExamRuleBoxContent> => ({
    type: PageSectionType.EXAM_RULE,
    title: source.title ?? { ...fallbackTitle },
    active: source.active ?? true,
    boxes: (source.boxes as ExamRuleBoxContent[]).map((box) => ({
      sortOrder: box.sortOrder,
      icon: box.icon ?? null,
      text: box.text ?? emptyText(),
      active: box.active ?? true,
    })),
  });

  const fetchPage = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await getHomepage();
      const sections = data.PCF_CONTENT?.sections ?? [];
      bannerSection.value = readBanner(sections);
      formatSection.value = readContent(
        sections,
        PageSectionType.CARD,
        (box) => (box as CardBoxContent).subtitle,
        SECTION_TITLE.format,
      );
      stepSection.value = readContent(
        sections,
        PageSectionType.STEP,
        (box) => (box as StepBoxContent).description,
        SECTION_TITLE.step,
      );

      // ข้อปฏิบัติ: เก็บเป็น exam_rule 2 ชุด (กระดาษ, คอมพิวเตอร์) เรียงตามลำดับ
      const ruleSections = sections.filter(
        (section) => section.type === PageSectionType.EXAM_RULE,
      );
      rulePaperSection.value = ruleSections[0]
        ? mapRuleSection(ruleSections[0], SECTION_TITLE.rulePaper)
        : createRuleSection(SECTION_TITLE.rulePaper);
      ruleComputerSection.value = ruleSections[1]
        ? mapRuleSection(ruleSections[1], SECTION_TITLE.ruleComputer)
        : createRuleSection(SECTION_TITLE.ruleComputer);
    } catch {
      error.value = t('admin.pageBuilder.messages.loadFailed');
    } finally {
      isLoading.value = false;
    }
  };

  /** ประกอบ payload ให้ตรงกับ DTO ของ backend + จัดลำดับใหม่ตามตำแหน่งปัจจุบัน */
  const buildContent = (): PageContent => {
    const bannerBoxes: BannerBoxContent[] = bannerSection.value.boxes
      .filter((box) => box.imagePath)
      .map((box, index) => ({
        sortOrder: index + 1,
        imagePath: box.imagePath,
        active: box.active,
      }));

    const cardBoxes: CardBoxContent[] = formatSection.value.boxes.map((box, index) => ({
      sortOrder: index + 1,
      title: box.title,
      subtitle: box.content,
      active: box.active,
    }));

    const stepBoxes: StepBoxContent[] = stepSection.value.boxes.map((box, index) => ({
      sortOrder: index + 1,
      title: box.title,
      description: box.content,
      active: box.active,
    }));

    const ruleBoxes = (
      section: EditorSection<ExamRuleBoxContent>,
    ): ExamRuleBoxContent[] =>
      section.boxes.map((box, index) => ({
        sortOrder: index + 1,
        icon: box.icon ?? null,
        text: box.text ?? emptyText(),
        active: box.active,
      }));

    return {
      sections: [
        {
          type: PageSectionType.BANNER,
          sortOrder: 1,
          title: bannerSection.value.title,
          active: bannerSection.value.active,
          boxes: bannerBoxes,
        },
        {
          type: PageSectionType.CARD,
          sortOrder: 2,
          title: formatSection.value.title,
          active: formatSection.value.active,
          boxes: cardBoxes,
        },
        {
          type: PageSectionType.STEP,
          sortOrder: 3,
          title: stepSection.value.title,
          active: stepSection.value.active,
          boxes: stepBoxes,
        },
        {
          type: PageSectionType.EXAM_RULE,
          sortOrder: 4,
          title: rulePaperSection.value.title,
          active: rulePaperSection.value.active,
          boxes: ruleBoxes(rulePaperSection.value),
        },
        {
          type: PageSectionType.EXAM_RULE,
          sortOrder: 5,
          title: ruleComputerSection.value.title,
          active: ruleComputerSection.value.active,
          boxes: ruleBoxes(ruleComputerSection.value),
        },
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
      error.value = t('admin.pageBuilder.messages.saveFailed');
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  return {
    isLoading,
    isSaving,
    error,
    bannerSection,
    formatSection,
    stepSection,
    rulePaperSection,
    ruleComputerSection,
    fetchPage,
    save,
  };
}
