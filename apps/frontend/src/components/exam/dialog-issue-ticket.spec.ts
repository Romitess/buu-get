import { describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import DialogIssueTicket from './dialog-issue-ticket.vue';
import type { VoucherData } from 'src/types/voucher';

vi.mock('src/components/exam/app-voucher-preview.vue', () => ({
  default: {
    name: 'AppVoucherPreview',
    props: ['voucherData', 'title', 'useImagePlaceholder'],
    template: '<div data-testid="voucher-preview" />',
  },
}));

vi.mock('src/components/base/app-button.vue', () => ({
  default: {
    name: 'AppButton',
    props: ['label', 'color', 'textColor', 'loading', 'disable', 'class'],
    emits: ['click'],
    template:
      '<button :disabled="disable || loading" :class="{ \'q-btn--loading\': loading }" @click="$emit(\'click\')">{{ label }}</button>',
  },
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      admin: {
        seatCandidates: {
          voucherPreviewTitle: 'ตัวอย่างใบเข้าห้องสอบ',
        },
      },
    },
  },
});

const voucherData: VoucherData = {
  id: 1,
  fullName: 'XX. Test User',
  studentId: 'TT-001',
  examName: 'BUU-GET Exam',
  examDate: '10 ก.ค. 2569',
  examTime: '09:00-12:00',
  examType: 'General',
  location: 'Room A',
  seatNo: 'A1',
  voucherNo: 'VC-001',
  citizenId: 'X-XXXX-XXXXX-XX-X',
  testSession: '1/2569',
  barcodeValue: 'VC-001',
};

const mountDialog = (onConfirm?: () => Promise<void>) =>
  mount(DialogIssueTicket, {
    props: {
      sessionDetails: {
        date: '10 ก.ค. 2569',
        time: '09:00-12:00',
        room: 'Room A',
        studentCount: 2,
      },
      voucherData,
      ...(onConfirm ? { onConfirm } : {}),
    },
    global: {
      plugins: [i18n],
      stubs: {
        QDialog: {
          template: '<div><slot /></div>',
        },
        QCard: { template: '<div><slot /></div>' },
        QCardActions: { template: '<div><slot /></div>' },
        QBtn: {
          props: ['disable', 'loading', 'icon', 'color', 'flat', 'round', 'dense'],
          template:
            '<button :disabled="disable" :class="{ \'q-btn--loading\': loading }" @click="$emit(\'click\')"><slot /></button>',
        },
        QIcon: { template: '<span />' },
      },
    },
  });

describe('DialogIssueTicket', () => {
  it('keeps dialog open and shows loading while onConfirm is pending', async () => {
    let resolveConfirm: (() => void) | undefined;
    const onConfirm = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        }),
    );

    const wrapper = mountDialog(onConfirm);
    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('ยืนยันการออกใบเข้าสอบ'));

    expect(confirmButton).toBeTruthy();
    await confirmButton!.trigger('click');
    await nextTick();

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(confirmButton!.classes()).toContain('q-btn--loading');

    resolveConfirm?.();
    await flushPromises();
    await nextTick();

    expect(confirmButton!.classes()).not.toContain('q-btn--loading');
  });

  it('shows error message when onConfirm rejects', async () => {
    const onConfirm = vi.fn(() => Promise.reject(new Error('failed')));

    const wrapper = mountDialog(onConfirm);
    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('ยืนยันการออกใบเข้าสอบ'));

    await confirmButton!.trigger('click');
    await flushPromises();
    await nextTick();

    expect(wrapper.text()).toContain('เกิดข้อผิดพลาดในการออกบัตรหรือส่งอีเมล');
  });
});
