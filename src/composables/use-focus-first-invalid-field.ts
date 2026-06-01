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

export function useFocusFirstInvalidField(
  formRef: Ref<QForm | null>,
  options: FocusFirstInvalidFieldOptions = {},
): UseFocusFirstInvalidFieldReturn {
  const focusFirstInvalidField = async (): Promise<boolean> => {
    await nextTick();

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

    firstInvalidField.scrollIntoView({
      behavior: options.scrollBehavior ?? 'smooth',
      block: options.block ?? 'center',
      inline: options.inline ?? 'nearest',
    });

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
