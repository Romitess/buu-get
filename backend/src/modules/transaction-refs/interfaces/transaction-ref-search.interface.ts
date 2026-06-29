import { TransactionRef } from '../entities/transaction-ref.entity';

export interface TransactionRefSearchPage {
  data: TransactionRef[];
  total: number;
}
