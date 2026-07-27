import { api } from 'src/boot/axios';
import type {
  VerifyCertificateResponse,
  VerifyDocumentType,
  VerifyReceiptResponse,
} from 'src/types/verify';

export async function verifyCertificate(
  code: string,
): Promise<VerifyCertificateResponse> {
  const response = await api.get<VerifyCertificateResponse>(
    `/verify/certificate/${encodeURIComponent(code)}`,
  );
  return response.data;
}

export async function verifyReceipt(code: string): Promise<VerifyReceiptResponse> {
  const response = await api.get<VerifyReceiptResponse>(
    `/verify/receipt/${encodeURIComponent(code)}`,
  );
  return response.data;
}

export async function verifyDocument(
  type: VerifyDocumentType,
  code: string,
): Promise<VerifyCertificateResponse | VerifyReceiptResponse> {
  return type === 'certificate'
    ? verifyCertificate(code)
    : verifyReceipt(code);
}
