import { BankCallbackRequestDto } from '../dto/bank-callback-request.dto';
import { BankCallbackResponseDto } from '../dto/bank-callback-response.dto';
import {
  BankRespCode,
  BankRespCodeValue,
  BankRespMsg,
} from '../constants/bank-resp-codes';

export function maskBankRequestData(body: BankCallbackRequestDto): string {
  const masked: Record<string, unknown> = { ...body };
  if ('user' in masked) {
    masked.user = '12345678';
  }
  if ('password' in masked) {
    masked.password = '12345678';
  }
  return JSON.stringify(masked);
}

export function clipToLength(
  value: string | null | undefined,
  max: number,
): string | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return value.length > max ? value.slice(0, max) : value;
}

export function toOptionalInt(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toOptionalDecimal(
  value: string | number | null | undefined,
): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : null;
}

export function toOptionalTranxId(
  value: string | number | null | undefined,
): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value);
}

export function mapBankCallbackRequestToLog(body: BankCallbackRequestDto): {
  USER: string | null;
  PASSWORD: string | null;
  COMCODE: string | null;
  PRODCODE: string | null;
  COMMAND: string | null;
  BANKCODE: number | null;
  BANKREF: string | null;
  DATETIME: string | null;
  EFFDATE: string | null;
  AMOUNT: string | null;
  CHANNEL: string | null;
  CUSNAME: string | null;
  REF1: string | null;
  REF2: string | null;
  REF3: string | null;
  REF4: string | null;
  TRANXID: string | null;
} {
  return {
    USER: clipToLength(body.user, 20),
    PASSWORD: clipToLength(body.password, 20),
    COMCODE: clipToLength(body.comCode, 10),
    PRODCODE: clipToLength(body.prodCode, 10),
    COMMAND: clipToLength(body.command, 20),
    BANKCODE: toOptionalInt(body.bankCode),
    BANKREF: clipToLength(body.bankRef, 20),
    DATETIME: clipToLength(body.dateTime, 14),
    EFFDATE: clipToLength(body.effDate, 8),
    AMOUNT: toOptionalDecimal(body.amount),
    CHANNEL: clipToLength(body.channel, 20),
    CUSNAME: clipToLength(body.cusName, 60),
    REF1: clipToLength(body.ref1, 20),
    REF2: clipToLength(body.ref2, 20),
    REF3: clipToLength(body.ref3, 20),
    REF4: clipToLength(body.ref4, 20),
    TRANXID: toOptionalTranxId(body.tranxId),
  };
}

export function mapBankCallbackResponseToLog(
  response: BankCallbackResponseDto,
): {
  TRANXID: string | null;
  BANKREF: string | null;
  RESPCODE: number | null;
  RESPMSG: string | null;
  BALANCE: string | null;
  CUSNAME: string | null;
  INFO: string | null;
  PRINT1: string | null;
  PRINT2: string | null;
  PRINT3: string | null;
  PRINT4: string | null;
  PRINT5: string | null;
  PRINT6: string | null;
  PRINT7: string | null;
} {
  return {
    TRANXID: toOptionalTranxId(response.tranxId),
    BANKREF: clipToLength(response.bankRef, 20),
    RESPCODE: toOptionalInt(response.respCode),
    RESPMSG: clipToLength(response.respMsg, 100),
    BALANCE: toOptionalDecimal(response.balance),
    CUSNAME: clipToLength(response.cusName, 60),
    INFO: clipToLength(response.info, 255),
    PRINT1: clipToLength(response.print1, 40),
    PRINT2: clipToLength(response.print2, 40),
    PRINT3: clipToLength(response.print3, 40),
    PRINT4: clipToLength(response.print4, 40),
    PRINT5: clipToLength(response.print5, 40),
    PRINT6: clipToLength(response.print6, 40),
    PRINT7: clipToLength(response.print7, 40),
  };
}

export function buildBankResponse(params: {
  respCode: BankRespCodeValue;
  bankRef?: string;
  amount?: string;
  cusName?: string;
  tranxId?: number | string | null;
  respMsg?: string;
  info?: string;
  print1?: string;
  print2?: string;
  print3?: string;
  print4?: string;
  print5?: string;
  print6?: string;
  print7?: string;
}): BankCallbackResponseDto {
  return {
    tranxId: params.tranxId ?? null,
    bankRef: params.bankRef ?? '',
    respCode: params.respCode,
    respMsg: params.respMsg ?? BankRespMsg[params.respCode],
    balance: params.amount ?? '',
    cusName: params.cusName ?? '',
    info: params.info ?? '',
    print1: params.print1 ?? '',
    print2: params.print2 ?? '',
    print3: params.print3 ?? '',
    print4: params.print4 ?? '',
    print5: params.print5 ?? '',
    print6: params.print6 ?? '',
    print7: params.print7 ?? '',
  };
}

/**
 * Parse bank dateTime as YYYYMMDDhhmmss (14 digits).
 * Returns null when format is invalid.
 */
export function parseBankDateTime(dateTime: string | undefined): {
  payDate: string;
  payTime: string;
  asDate: Date;
} | null {
  if (!dateTime || !/^\d{14}$/.test(dateTime)) {
    return null;
  }

  const year = Number(dateTime.slice(0, 4));
  const month = Number(dateTime.slice(4, 6));
  const day = Number(dateTime.slice(6, 8));
  const hour = Number(dateTime.slice(8, 10));
  const minute = Number(dateTime.slice(10, 12));
  const second = Number(dateTime.slice(12, 14));

  const asDate = new Date(year, month - 1, day, hour, minute, second);
  if (
    asDate.getFullYear() !== year ||
    asDate.getMonth() !== month - 1 ||
    asDate.getDate() !== day
  ) {
    return null;
  }

  return {
    payDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    payTime: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`,
    asDate,
  };
}

export function amountsEqual(
  left: string | number | undefined,
  right: string | number | undefined,
): boolean {
  const a = Number(left);
  const b = Number(right);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    return false;
  }
  return Math.abs(a - b) < 0.001;
}

export function formatBankDateTime(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${y}${m}${d}${hh}${mm}${ss}`;
}

export function buildBillPaymentQrPayload(params: {
  taxId: string;
  suffix: string;
  ref1: string;
  ref2: string;
  amount: number;
}): string {
  const amountSatang = `${Math.round(Number(params.amount) * 100)}`;
  return `|${params.taxId}${params.suffix}\r${params.ref1}\r${params.ref2}\r${amountSatang}`;
}

export { BankRespCode };
