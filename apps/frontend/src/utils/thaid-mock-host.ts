/** โฮสต์ที่ไม่ได้ลงทะเบียนกับ ThaiD ให้ใช้หน้าจำลองแทน */
export function shouldMockThaidHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    return true;
  }
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)) {
    return true;
  }
  return /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host);
}

export function resolveApiHostname(baseURL: string, pageURL: string): string {
  return new URL(baseURL || pageURL, pageURL).hostname;
}
