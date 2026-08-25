import { Injectable, NotImplementedException } from '@nestjs/common';
import type {
  PaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
  PaymentWebhookResult,
} from './payment-provider.interface';

/**
 * CSV / finance-reconcile backed stub.
 *
 * Intent creation and expiry still run through `TransactionsService`
 * (`createTransactionForFlow` / `expireTransaction`). Marking PAID remains
 * `BankReconcilesService.confirmPayment` after CSV match — do not mark PAID here.
 */
@Injectable()
export class CsvFinancePaymentAdapter implements PaymentProvider {
  async createIntent(
    _input: PaymentIntentInput,
  ): Promise<PaymentIntentResult> {
    // Noop: enrollment UI continues to call TransactionsService.createTransactionForFlow.
    return {
      providerRef: null,
      expiresAt: null,
      tranxId: null,
    };
  }

  async handleWebhook(_payload: unknown): Promise<PaymentWebhookResult> {
    // Not wired to HTTP. Live bank webhooks would land here later.
    return {
      ignored: true,
      reason:
        'CSV finance path: PAID is set only via BankReconcilesService.confirmPayment',
    };
  }

  async expire(_tranxId: number): Promise<void> {
    throw new NotImplementedException(
      'Expire via TransactionsService.expireTransaction until a live provider is configured',
    );
  }
}
