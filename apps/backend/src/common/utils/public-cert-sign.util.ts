/** เกณฑ์ผ่านของ public certificate ตามสัญญา e-sign: status === success */
export function isPublicCertSignSuccess(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    (body as { status?: unknown }).status === 'success'
  );
}
