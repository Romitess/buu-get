import QRCode from 'qrcode';
import {
  buildCertificateVerifyUrl,
  buildReceiptVerifyUrl,
  buildVerifyLandingUrl,
  getPublicAppUrl,
} from '../../config/resolve-app-public-url';

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 180,
  });
}

export async function generateCertificateQrDataUrl(code: string): Promise<string> {
  const url = buildCertificateVerifyUrl(getPublicAppUrl(), code);
  return generateQrDataUrl(url);
}

export async function generateReceiptQrDataUrl(code: string): Promise<string> {
  const url = buildReceiptVerifyUrl(getPublicAppUrl(), code);
  return generateQrDataUrl(url);
}

export function getVerifyLandingUrl(): string {
  return buildVerifyLandingUrl(getPublicAppUrl());
}
