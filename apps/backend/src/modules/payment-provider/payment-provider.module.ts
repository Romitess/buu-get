import { Module } from '@nestjs/common';
import { CsvFinancePaymentAdapter } from './csv-finance-payment.adapter';
import { PAYMENT_PROVIDER } from './payment-provider.tokens';

@Module({
  providers: [
    CsvFinancePaymentAdapter,
    {
      provide: PAYMENT_PROVIDER,
      useExisting: CsvFinancePaymentAdapter,
    },
  ],
  exports: [PAYMENT_PROVIDER, CsvFinancePaymentAdapter],
})
export class PaymentProviderModule {}
