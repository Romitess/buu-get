export const BankRespCode = {
  SUCCESS: '0',
  INVALID_CREDENTIALS: '101',
  OVER_LIMIT: '103',
  INVALID_REFERENCE: '104',
  INVALID_TRANX: '105',
  DUPLICATE: '106',
  INVALID_AMOUNT: '108',
  EXPIRED: '999',
} as const;

export type BankRespCodeValue =
  (typeof BankRespCode)[keyof typeof BankRespCode];

export const BankRespMsg: Record<BankRespCodeValue, string> = {
  [BankRespCode.SUCCESS]: 'Successful',
  [BankRespCode.INVALID_CREDENTIALS]: 'Invalid username/password',
  [BankRespCode.OVER_LIMIT]:
    'Transaction amount or number of transaction is over limit',
  [BankRespCode.INVALID_REFERENCE]: 'Invalid reference',
  [BankRespCode.INVALID_TRANX]: 'Invalid transaction number',
  [BankRespCode.DUPLICATE]: 'Transaction number duplicate',
  [BankRespCode.INVALID_AMOUNT]: 'Invalid price or amount',
  [BankRespCode.EXPIRED]: 'Bill Payment Expired',
};
