import { describe, expect, it } from 'vitest';
import { resolveApiHostname, shouldMockThaidHost } from 'src/utils/thaid-mock-host';

describe('shouldMockThaidHost', () => {
  it('mocks local and private hosts', () => {
    expect(shouldMockThaidHost('localhost')).toBe(true);
    expect(shouldMockThaidHost('127.0.0.1')).toBe(true);
    expect(shouldMockThaidHost('10.129.3.245')).toBe(true);
    expect(shouldMockThaidHost('192.168.1.20')).toBe(true);
  });

  it('keeps the live ThaiD hosts', () => {
    expect(shouldMockThaidHost('buu-get-test.buu.ac.th')).toBe(false);
    expect(shouldMockThaidHost('buu-get.buu.ac.th')).toBe(false);
  });

  it('reads the host from a relative API base', () => {
    expect(resolveApiHostname('/api', 'http://localhost:9000/')).toBe('localhost');
    expect(resolveApiHostname('https://buu-get-test.buu.ac.th/api', 'http://localhost:9000/')).toBe(
      'buu-get-test.buu.ac.th',
    );
  });
});
