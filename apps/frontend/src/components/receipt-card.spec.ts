import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import ReceiptCard from './receipt-card.vue';
import type { ReceiptData, SignaturePlacement } from 'src/types/receipt';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  missingWarn: false,
  fallbackWarn: false,
  messages: { 'en-US': {} },
});

const receipt: ReceiptData = {
  receiptNo: 'RC-0001',
  transactionDate: '2026-09-28T03:00:00.000Z',
  fullName: 'ทดสอบ ระบบ',
  nationalId: '1234567890123',
  address: '-',
  examName: 'ค่าสมัครทดสอบความรู้ภาษาอังกฤษ (BUU-GET)',
  examDate: '2026-10-10',
  location: '',
  amount: 500,
  paymentMethod: 'QR',
  status: 'SUCCESS',
};

const mountCard = (signaturePlacement?: SignaturePlacement) =>
  mount(ReceiptCard, {
    props: {
      receipt,
      showQr: false,
      signatureImageUrl: 'data:image/png;base64,AAAA',
      collectorName: 'เจ้าหน้าที่การเงิน',
      ...(signaturePlacement ? { signaturePlacement } : {}),
    },
    global: { plugins: [i18n] },
  });

describe('ReceiptCard signature placement', () => {
  it('renders the signature inside the signature box without transform by default', () => {
    const wrapper = mountCard();
    const image = wrapper.find('.signature-box .signature-image');

    expect(image.exists()).toBe(true);
    expect(image.attributes('style')).toBeUndefined();
  });

  it('applies the given offset and scale to the signature image', () => {
    const wrapper = mountCard({ offsetX: -12.5, offsetY: 6, scale: 1.4 });
    const image = wrapper.find('.signature-box .signature-image');

    expect(image.attributes('style')).toContain('translate(-12.5px, 6px)');
    expect(image.attributes('style')).toContain('scale(1.4)');
  });
});
