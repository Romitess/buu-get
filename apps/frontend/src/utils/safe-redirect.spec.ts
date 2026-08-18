import { describe, expect, it } from 'vitest';
import { resolveSafeInAppRedirect } from './safe-redirect';

describe('resolveSafeInAppRedirect', () => {
  it('allows in-app relative paths with known first segments', () => {
    expect(resolveSafeInAppRedirect('/admin/exam-management')).toBe('/admin/exam-management');
    expect(resolveSafeInAppRedirect('/user/exam-schedule')).toBe('/user/exam-schedule');
    expect(resolveSafeInAppRedirect('/login')).toBe('/login');
    expect(resolveSafeInAppRedirect('/register?step=1')).toBe('/register?step=1');
    expect(resolveSafeInAppRedirect('/verify/certificate/abc')).toBe('/verify/certificate/abc');
    expect(resolveSafeInAppRedirect('/')).toBe('/');
  });

  it('rejects open redirects and unknown prefixes', () => {
    expect(resolveSafeInAppRedirect('https://evil.example')).toBeNull();
    expect(resolveSafeInAppRedirect('//evil.example')).toBeNull();
    expect(resolveSafeInAppRedirect('/http://evil.example')).toBeNull();
    expect(resolveSafeInAppRedirect('javascript:alert(1)')).toBeNull();
    expect(resolveSafeInAppRedirect('/exam-schedule')).toBeNull();
    expect(resolveSafeInAppRedirect('admin/exam-management')).toBeNull();
    expect(resolveSafeInAppRedirect(null)).toBeNull();
  });
});
