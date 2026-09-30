import {
  extractAccessData,
  extractFullRequestUrl,
  extractRequestParameter,
  menuFromApiPath,
  menuContextFromHeaders,
  normalizeClientIp,
  parseClientBrowser,
  parseClientEquipment,
  resolveClientIp,
  resolvePageUrl,
  sanitizeAccessData,
} from './graylog-client.util';

describe('graylog-client.util', () => {
  describe('parseClientBrowser', () => {
    it('returns Other when UA missing', () => {
      expect(parseClientBrowser(null)).toBe('Other');
      expect(parseClientBrowser('')).toBe('Other');
    });

    it('detects Chrome / Firefox / Safari', () => {
      expect(
        parseClientBrowser(
          'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        ),
      ).toBe('Google Chrome');
      expect(
        parseClientBrowser(
          'Mozilla/5.0 (Windows NT 10.0; rv:121.0) Gecko/20100101 Firefox/121.0',
        ),
      ).toBe('Mozilla Firefox');
      expect(
        parseClientBrowser(
          'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15',
        ),
      ).toBe('Apple Safari');
    });
  });

  describe('parseClientEquipment', () => {
    it('defaults to Desktop', () => {
      expect(parseClientEquipment(null)).toBe('Desktop');
      expect(parseClientEquipment('Mozilla/5.0 Macintosh')).toBe('Desktop');
    });

    it('detects Mobile and Tablet', () => {
      expect(
        parseClientEquipment(
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605.1.15 Mobile/15E148',
        ),
      ).toBe('Mobile');
      expect(
        parseClientEquipment(
          'Mozilla/5.0 (iPad; CPU OS 17_0) AppleWebKit/605.1.15',
        ),
      ).toBe('Tablet');
    });
  });

  describe('normalizeClientIp / resolveClientIp', () => {
    it('maps ::1 and strips ::ffff:', () => {
      expect(normalizeClientIp('::1')).toBe('127.0.0.1');
      expect(normalizeClientIp('::ffff:192.0.2.10')).toBe('192.0.2.10');
    });

    it('prefers x-forwarded-for then x-real-ip', () => {
      expect(
        resolveClientIp({
          headers: {
            'x-forwarded-for': '203.0.113.9, 10.0.0.1',
            'x-real-ip': '198.51.100.1',
          },
          requestIp: '::1',
        }),
      ).toBe('203.0.113.9');
      expect(
        resolveClientIp({
          headers: { 'x-real-ip': '198.51.100.2' },
          requestIp: '::1',
        }),
      ).toBe('198.51.100.2');
      expect(resolveClientIp({ requestIp: '::1' })).toBe('127.0.0.1');
    });
  });

  describe('menuFromApiPath / menuContextFromHeaders', () => {
    it('splits /api/{menu}/{sub}', () => {
      expect(menuFromApiPath('/api/exam/schedules')).toEqual({
        menu: 'exam',
        subMenu: 'schedules',
      });
      expect(menuFromApiPath('/api/auth/login')).toEqual({
        menu: 'auth',
        subMenu: 'login',
      });
    });

    it('reads SPA menu headers when present', () => {
      expect(
        menuContextFromHeaders({
          'x-current-menu-path': '/exams',
          'x-current-menu-label': 'สอบ',
          'x-current-submenu-label': 'ตาราง',
        }),
      ).toEqual({
        menuPath: '/exams',
        menu: 'สอบ',
        subMenu: 'ตาราง',
      });
    });
  });

  describe('resolvePageUrl and extractFullRequestUrl', () => {
    it('uses referer when it is a full page URL', () => {
      expect(
        resolvePageUrl({
          headers: { referer: 'http://localhost:9000/exams/list' },
          apiUrl: '/api/exam',
        }),
      ).toBe('http://localhost:9000/exams/list');
    });

    it('falls back to protocol+host+apiUrl', () => {
      expect(
        resolvePageUrl({
          protocol: 'http',
          host: 'localhost:3000',
          apiUrl: '/api/auth/login',
        }),
      ).toBe('http://localhost:3000/api/auth/login');
    });

    it('extracts full request URL honoring forwarded headers', () => {
      expect(
        extractFullRequestUrl({
          headers: {
            'x-forwarded-proto': 'https',
            'x-forwarded-host': 'localhost.buu.ac.th:8099',
          },
          originalUrl: '/approval-settings/config-type/c5q3p254a254',
        }),
      ).toBe(
        'https://localhost.buu.ac.th:8099/approval-settings/config-type/c5q3p254a254',
      );
    });
  });

  describe('extractRequestParameter', () => {
    it('extracts route parameters as JSON array string', () => {
      expect(
        extractRequestParameter({
          params: { id: '12' },
        }),
      ).toBe('["12"]');
    });

    it('falls back to non-sensitive query parameters if params empty', () => {
      expect(
        extractRequestParameter({
          params: {},
          query: { facdepId: '12', password: 'secret' },
        }),
      ).toBe('["12"]');
    });

    it('returns empty array string when both empty', () => {
      expect(
        extractRequestParameter({
          params: {},
          query: {},
        }),
      ).toBe('[]');
    });
  });

  describe('sanitizeAccessData and extractAccessData', () => {
    it('masks denylisted fields and preserves valid request payload', () => {
      const input = {
        draw: '1',
        FACDEP_ID: '12',
        password: 'my-secret-password',
        token: 'jwt.token.here',
        user: {
          nationalId: '1234567890123',
          name: 'Somchai',
        },
      };
      const sanitized = sanitizeAccessData(input) as Record<string, unknown>;
      expect(sanitized.draw).toBe('1');
      expect(sanitized.FACDEP_ID).toBe('12');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect((sanitized.user as Record<string, unknown>).nationalId).toBe(
        '[REDACTED]',
      );
      expect((sanitized.user as Record<string, unknown>).name).toBe('Somchai');
    });

    it('serializes request body to JSON string', () => {
      const body = { draw: '1', FACDEP_ID: '12' };
      const res = extractAccessData(body);
      expect(res).toBe('{"draw":"1","FACDEP_ID":"12"}');
    });

    it('returns undefined for empty/null body', () => {
      expect(extractAccessData(null)).toBeUndefined();
      expect(extractAccessData({})).toBeUndefined();
    });
  });
});
