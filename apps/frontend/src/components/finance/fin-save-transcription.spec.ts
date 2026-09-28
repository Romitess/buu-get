import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp, nextTick, type App } from 'vue';
import { createI18n } from 'vue-i18n';
import FinSaveTranscription from './fin-save-transcription.vue';

const checkEsignReady = vi.fn();
const confirmPayments = vi.fn();
const uploadSignedReceiptFile = vi.fn();
const notify = vi.fn();
const renderedSignatureStyles: (string | null)[] = [];

vi.mock('src/services/bank-reconcile.service', () => ({
  checkBankReconcileEsignReady: (...args: unknown[]) => checkEsignReady(...args),
  confirmBankReconcilePayments: (...args: unknown[]) => confirmPayments(...args),
}));

vi.mock('src/services/receipt.service', () => ({
  uploadSignedReceiptFile: (...args: unknown[]) => uploadSignedReceiptFile(...args),
}));

vi.mock('src/utils/verify-qr', () => ({
  generateReceiptQrDataUrl: () => Promise.resolve('data:image/png;base64,QR'),
}));

vi.mock('src/composables/use-payment-import', () => ({
  clearPaymentImportLocalData: vi.fn(),
}));

vi.mock('quasar', () => ({
  useQuasar: () => ({ notify }),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('html2canvas', () => ({
  default: (element: HTMLElement) => {
    const image = element.querySelector('.signature-image');
    renderedSignatureStyles.push(image?.getAttribute('style') ?? null);
    return Promise.resolve({ toDataURL: () => 'data:image/jpeg;base64,PAGE' });
  },
}));

vi.mock('jspdf', () => ({
  jsPDF: class {
    addImage() {}
    output() {
      return new Blob(['pdf'], { type: 'application/pdf' });
    }
  },
}));

vi.mock('src/components/receipt-card.vue', () => ({
  default: {
    name: 'ReceiptCard',
    props: [
      'receipt',
      'showQr',
      'isCopy',
      'signatureImageUrl',
      'collectorName',
      'signaturePlacement',
    ],
    computed: {
      signatureStyle(this: {
        signaturePlacement?: { offsetX: number; offsetY: number; scale: number };
      }) {
        const placement = this.signaturePlacement;
        if (!placement) return undefined;
        return {
          transform: `translate(${placement.offsetX}px, ${placement.offsetY}px) scale(${placement.scale})`,
        };
      },
    },
    template:
      '<div class="receipt-container"><div class="signature-box"><img class="signature-image" :src="signatureImageUrl" :style="signatureStyle" /></div></div>',
  },
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    'en-US': {
      profile: { cancel: 'Cancel' },
      admin: {
        finSaveTranscription: {
          btnLabel: 'Save',
          confirmTitle: 'Confirm Save',
          confirmMessage: 'Save all data?',
          confirmBtn: 'Confirm',
          successTitle: 'Success',
          successMessage: 'Saved',
          saveError: 'Save error',
          signatureRequiredError: 'Signature not ready',
          noMatchedRowsError: 'No matched rows',
          okBtn: 'OK',
          signaturePreviewTitle: 'Adjust Signature',
          signaturePreviewHint: 'Drag to move',
          signatureScaleLabel: 'Signature size',
          signatureResetBtn: 'Reset',
          signatureZoomFit: 'Fit to screen',
          signatureConfirmBtn: 'Sign and Save',
        },
      },
    },
  },
});

const rows = [
  {
    id: 1,
    file_payment_date: '2026-09-28',
    file_payment_time: '10:00',
    file_ref: 'REF1',
    file_ref2: 'REF2',
    file_payer: 'ผู้จ่ายเงิน หนึ่ง',
    file_amount: '500.00',
    db_ref: 'REF1',
    db_ref2: 'REF2',
    db_applicant_name: 'ผู้สมัคร หนึ่ง',
    db_amount: '500.00',
    tranxId: 11,
  },
  {
    id: 2,
    file_payment_date: '2026-09-28',
    file_payment_time: '10:05',
    file_ref: 'REF3',
    file_ref2: 'REF4',
    file_payer: 'ผู้จ่ายเงิน สอง',
    file_amount: '500.00',
    db_ref: 'REF3',
    db_ref2: 'REF4',
    db_applicant_name: 'ผู้สมัคร สอง',
    db_amount: '500.00',
    tranxId: 12,
  },
];

const draft = (rcId: number, tranxId: number) => ({
  rcId,
  tranxId,
  receiptNo: `RC-${rcId}`,
  issuedAt: '2026-09-28T03:00:00.000Z',
  payerName: `ผู้สมัคร ${rcId}`,
  taxId: '1234567890123',
  address: '-',
  amount: 500,
  description: 'ค่าสมัครสอบ',
  examDate: '2026-10-10',
  verifyCode: `VC-${rcId}`,
  paymentChannel: 3,
});

/** Quasar components ไม่ได้ลงทะเบียนในเทสต์ จึงใส่ตัวแทนที่พฤติกรรมเหมือนของจริงเท่าที่ใช้ */
const registerStubs = (app: App): void => {
  app.component('q-dialog', {
    props: ['modelValue'],
    template: '<div v-if="modelValue" class="stub-dialog"><slot /></div>',
  });
  app.component('q-card', { template: '<div><slot /></div>' });
  app.component('q-btn', {
    props: ['label', 'disable', 'loading', 'icon'],
    emits: ['click'],
    template: '<button :disabled="disable" @click="$emit(\'click\')">{{ label }}<slot /></button>',
  });
  app.component('q-slider', {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input class="scale-slider" type="range" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
  });
  app.directive('close-popup', {});
};

let app: App | null = null;
let host: HTMLElement;

const flush = async (): Promise<void> => {
  await nextTick();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  await nextTick();
};

const mountComponent = (): HTMLElement => {
  host = document.createElement('div');
  document.body.appendChild(host);
  app = createApp(FinSaveTranscription, { rows });
  app.use(i18n);
  registerStubs(app);
  app.mount(host);
  return host;
};

const unmountComponent = (): void => {
  app?.unmount();
  app = null;
  host.remove();
};

const clickButton = async (label: string): Promise<void> => {
  const button = Array.from(host.querySelectorAll('button')).find((candidate) =>
    candidate.textContent?.includes(label),
  );
  if (!button) throw new Error(`button "${label}" not found`);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await flush();
};

const pointer = (type: string, clientX: number, clientY: number): MouseEvent => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  return event;
};

const dragSignature = async (deltaX: number, deltaY: number): Promise<void> => {
  const box = host.querySelector('.preview-viewport .signature-box');
  if (!box) throw new Error('signature box not found');
  box.dispatchEvent(pointer('pointerdown', 0, 0));
  box.dispatchEvent(pointer('pointermove', deltaX, deltaY));
  box.dispatchEvent(pointer('pointerup', deltaX, deltaY));
  await flush();
};

const previewSignatureStyle = (): string | null =>
  host.querySelector('.preview-viewport .signature-image')?.getAttribute('style') ?? null;

const previewWidth = (): number => {
  const style = host.querySelector('.preview-viewport')?.getAttribute('style') ?? '';
  const matched = /width:\s*(\d+)px/.exec(style);
  return Number(matched?.[1] ?? 0);
};

const previewOffsetX = (): number => {
  const matched = /translate\((-?[\d.]+)px/.exec(previewSignatureStyle() ?? '');
  if (!matched) throw new Error(`no translate in style: ${previewSignatureStyle()}`);
  return Number(matched[1]);
};

const setSignatureScale = async (scale: number): Promise<void> => {
  const slider = host.querySelector('.scale-slider') as HTMLInputElement;
  slider.value = String(scale);
  slider.dispatchEvent(new Event('input', { bubbles: true }));
  await flush();
};

/** jsdom ไม่มีขนาด element และ pointer capture จึงต้องจำลองให้ตรรกะหนีบตำแหน่งทำงานได้ */
const sizeFor = (element: HTMLElement, axis: 'width' | 'height'): number => {
  if (element.classList.contains('signature-box')) return axis === 'width' ? 150 : 54;
  if (element.classList.contains('signature-image')) return axis === 'width' ? 140 : 40;
  return 0;
};

beforeAll(() => {
  for (const property of ['clientWidth', 'offsetWidth'] as const) {
    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      get(this: HTMLElement) {
        return sizeFor(this, 'width');
      },
    });
  }
  for (const property of ['clientHeight', 'offsetHeight'] as const) {
    Object.defineProperty(HTMLElement.prototype, property, {
      configurable: true,
      get(this: HTMLElement) {
        return sizeFor(this, 'height');
      },
    });
  }
  HTMLElement.prototype.setPointerCapture = function setPointerCapture() {};
  HTMLElement.prototype.releasePointerCapture = function releasePointerCapture() {};
});

beforeEach(() => {
  checkEsignReady.mockResolvedValue({
    ready: true,
    fullName: 'เจ้าหน้าที่การเงิน',
    psnId: 'PSN-1',
    signatureBase64: 'AAAA',
  });
  confirmPayments.mockResolvedValue({
    success: true,
    updated: 2,
    receipts: [draft(101, 11), draft(102, 12)],
  });
  uploadSignedReceiptFile.mockResolvedValue(undefined);
  renderedSignatureStyles.length = 0;
});

afterEach(() => {
  unmountComponent();
  vi.clearAllMocks();
});

const openPreview = async (): Promise<void> => {
  mountComponent();
  await clickButton('Save');
  await clickButton('Confirm');
};

describe('FinSaveTranscription signature preview', () => {
  it('opens the preview after fetching the signature without confirming payments yet', async () => {
    await openPreview();

    expect(checkEsignReady).toHaveBeenCalledTimes(1);
    expect(confirmPayments).not.toHaveBeenCalled();
    expect(host.textContent).toContain('Adjust Signature');
    expect(host.querySelector('.preview-viewport .signature-image')).not.toBeNull();
  });

  it('cancels without calling any write API', async () => {
    await openPreview();
    await clickButton('Cancel');

    expect(confirmPayments).not.toHaveBeenCalled();
    expect(uploadSignedReceiptFile).not.toHaveBeenCalled();
    expect(host.textContent).not.toContain('Adjust Signature');
  });

  it('keeps the dragged signature inside the signature box', async () => {
    await openPreview();
    // ขอบเขตของช่อง 150x54 กับลายเซ็น 140x40 คือ ±5px และ ±7px
    await dragSignature(400, 300);
    expect(previewSignatureStyle()).toContain('translate(5px, 7px)');

    await dragSignature(-400, -300);
    expect(previewSignatureStyle()).toContain('translate(-5px, -7px)');
  });

  it('moves the signature proportionally to the pointer distance', async () => {
    await openPreview();
    // ขยายลายเซ็นให้ขอบเขตกว้างพอ จะได้เห็นการเลื่อนที่ยังไม่ถูกหนีบ
    await setSignatureScale(3);

    await dragSignature(20, 0);
    const shortDrag = previewOffsetX();

    await clickButton('Reset');
    await setSignatureScale(3);
    await dragSignature(40, 0);

    expect(previewOffsetX()).toBeCloseTo(shortDrag * 2, 3);
    // พรีวิวย่อใบเสร็จลง ระยะบนใบเสร็จจึงมากกว่าระยะที่เมาส์เลื่อน
    expect(shortDrag).toBeGreaterThan(20);
  });

  it('zooms toward the pointed spot without changing how far the signature moves on the receipt', async () => {
    await openPreview();
    const fittedWidth = previewWidth();
    await setSignatureScale(3);
    await dragSignature(20, 0);
    const fittedDrag = previewOffsetX();

    await clickButton('Reset');
    const stage = host.querySelector('.preview-stage');
    if (!stage) throw new Error('preview stage not found');
    stage.dispatchEvent(
      new WheelEvent('wheel', {
        deltaY: -120,
        clientX: 40,
        clientY: 80,
        bubbles: true,
        cancelable: true,
      }),
    );
    await flush();

    expect(host.textContent).toContain('125%');
    expect(previewWidth()).toBeGreaterThan(fittedWidth);

    await setSignatureScale(3);
    await dragSignature(20, 0);
    expect(previewOffsetX()).toBeCloseTo(fittedDrag / 1.25, 2);

    await clickButton('Fit to screen');
    expect(host.textContent).toContain('100%');
    expect(previewWidth()).toBe(fittedWidth);
  });

  it('resets the placement back to the centered default', async () => {
    await openPreview();
    await dragSignature(-50, -50);
    expect(previewSignatureStyle()).not.toContain('translate(0px, 0px)');

    await clickButton('Reset');
    expect(previewSignatureStyle()).toContain('translate(0px, 0px) scale(1)');
  });

  it('renders every receipt with the placement chosen in the preview', async () => {
    await openPreview();
    await dragSignature(6, 0);

    await setSignatureScale(1.5);
    const chosenStyle = previewSignatureStyle();
    expect(chosenStyle).toContain('scale(1.5)');

    await clickButton('Sign and Save');
    await vi.waitFor(() => expect(uploadSignedReceiptFile).toHaveBeenCalledTimes(2), {
      timeout: 15000,
    });
    await flush();

    expect(confirmPayments).toHaveBeenCalledWith([11, 12]);
    expect(uploadSignedReceiptFile.mock.calls.map((call) => call[0])).toEqual([101, 102]);
    expect(renderedSignatureStyles).toEqual([chosenStyle, chosenStyle]);
    expect(host.textContent).toContain('Saved');
  }, 30000);
});
