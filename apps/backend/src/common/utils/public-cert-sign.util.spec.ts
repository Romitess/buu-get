import { isPublicCertSignSuccess } from './public-cert-sign.util';

describe('isPublicCertSignSuccess', () => {
  it('accepts status success only', () => {
    expect(isPublicCertSignSuccess({ status: 'success' })).toBe(true);
  });

  it('rejects other bodies', () => {
    expect(isPublicCertSignSuccess({ status: 'fail' })).toBe(false);
    expect(isPublicCertSignSuccess({})).toBe(false);
    expect(isPublicCertSignSuccess(null)).toBe(false);
    expect(isPublicCertSignSuccess('success')).toBe(false);
  });
});
