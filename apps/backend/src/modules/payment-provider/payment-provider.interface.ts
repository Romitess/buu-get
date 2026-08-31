/**
 * Thin payment-provider port for a future live-bank / webhook integration.
 *
 * Production PAID marking remains finance CSV reconcile via
 * `BankReconcilesService.confirmPayment` — this port must not invent a second
 * PAID path until a real provider is wired.
 */

export interface PaymentIntentInput {
  ermId: number;
  pcId: number;
  amount: number;
}

export interface PaymentIntentResult {
  /** External provider reference when live bank is wired; null for CSV/noop. */
  providerRef: string | null;
  expiresAt: Date | null;
  /**
   * Local FIN_T_TRANSACTIONS id when the adapter creates/reuses a pending row.
   * Null for the current CSV seam (create still goes through TransactionsService).
   */
  tranxId: number | null;
}

export interface PaymentWebhookResult {
  /** true when the payload was accepted but intentionally not applied. */
  ignored: boolean;
  reason?: string;
}

/**
 * Port for payment intents / webhooks / expiry.
 * Enrollment status rules stay in TransactionsService + BankReconcilesService.
 */
export interface PaymentProvider {
  createIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  handleWebhook(payload: unknown): Promise<PaymentWebhookResult>;
  expire(tranxId: number): Promise<void>;
}
