import { nextTick, type Ref } from 'vue';
import type { QForm } from 'quasar';

interface FocusFirstInvalidFieldOptions {
  invalidFieldSelector?: string;
  scrollBehavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  inline?: ScrollLogicalPosition;
}

interface UseFocusFirstInvalidFieldReturn {
  validateAndFocusFirstInvalid: () => Promise<boolean>;
  focusFirstInvalidField: () => Promise<boolean>;
}

const DEFAULT_INVALID_FIELD_SELECTOR = '.q-field--error';
const FOCUSABLE_SELECTOR = [
  'input:not([type="hidden"]):not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'button:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',');

const isHTMLElement = (value: unknown): value is HTMLElement => value instanceof HTMLElement;

const getFormElement = (form: QForm): HTMLElement | null => {
  const formElement = form.$el as unknown;
  return isHTMLElement(formElement) ? formElement : null;
};

const compareByVisualPosition = (first: HTMLElement, second: HTMLElement): number => {
  const firstRect = first.getBoundingClientRect();
  const secondRect = second.getBoundingClientRect();

  if (firstRect.top !== secondRect.top) {
    return firstRect.top - secondRect.top;
  }

  return firstRect.left - secondRect.left;
};

const findFocusableElement = (fieldElement: HTMLElement): HTMLElement => {
  const candidate = fieldElement.querySelector(FOCUSABLE_SELECTOR);
  return isHTMLElement(candidate) ? candidate : fieldElement;
};

const isScrollableOverflow = (value: string): boolean =>
  value === 'auto' || value === 'scroll' || value === 'overlay';

/**
 * Scroll nested overflow containers manually.
 * Native scrollIntoView can fail when an ancestor uses overflow: hidden
 * (e.g. profile card) while an inner grid uses overflow-y: auto.
 */
const scrollElementIntoNearestContainers = (
  element: HTMLElement,
  behavior: ScrollBehavior,
  block: ScrollLogicalPosition,
): void => {
  let parent: HTMLElement | null = element.parentElement;

  while (parent) {
    const style = window.getComputedStyle(parent);
    const canScrollY =
      isScrollableOverflow(style.overflowY) && parent.scrollHeight > parent.clientHeight + 1;

    if (canScrollY) {
      const parentRect = parent.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const currentOffset = elementRect.top - parentRect.top + parent.scrollTop;
      const alignCenter = block === 'center';
      const targetTop = alignCenter
        ? currentOffset - parent.clientHeight / 2 + elementRect.height / 2
        : currentOffset - 16;
      const maxScrollTop = parent.scrollHeight - parent.clientHeight;

      parent.scrollTo({
        top: Math.max(0, Math.min(targetTop, maxScrollTop)),
        behavior,
      });
    }

    parent = parent.parentElement;
  }

  element.scrollIntoView({
    behavior,
    block,
    inline: 'nearest',
  });
};

export function useFocusFirstInvalidField(
  formRef: Ref<QForm | null>,
  options: FocusFirstInvalidFieldOptions = {},
): UseFocusFirstInvalidFieldReturn {
  const focusFirstInvalidField = async (): Promise<boolean> => {
    await nextTick();
    // Quasar paints error classes after validate; wait one frame so they exist.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const form = formRef.value;
    if (!form) {
      return false;
    }

    const formElement = getFormElement(form);
    if (!formElement) {
      return false;
    }

    const invalidFields = Array.from(
      formElement.querySelectorAll(options.invalidFieldSelector ?? DEFAULT_INVALID_FIELD_SELECTOR),
    ).filter(isHTMLElement);

    const firstInvalidField = invalidFields.sort(compareByVisualPosition)[0];
    if (!firstInvalidField) {
      return false;
    }

    const scrollBehavior = options.scrollBehavior ?? 'smooth';
    const block = options.block ?? 'center';

    scrollElementIntoNearestContainers(firstInvalidField, scrollBehavior, block);

    await nextTick();

    findFocusableElement(firstInvalidField).focus({ preventScroll: true });
    return true;
  };

  const validateAndFocusFirstInvalid = async (): Promise<boolean> => {
    const form = formRef.value;
    if (!form) {
      return false;
    }

    const isValid = await form.validate(false);
    if (isValid) {
      return true;
    }

    await focusFirstInvalidField();
    return false;
  };

  return {
    validateAndFocusFirstInvalid,
    focusFirstInvalidField,
  };
}
