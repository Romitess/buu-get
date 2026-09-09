import { AuditSerializer } from './audit.serializer';
import { AUDIT_STATE_MAX_BYTES } from './constants/audit.constants';

describe('AuditSerializer', () => {
  const serializer = new AuditSerializer();

  it('returns null when no allowlist paths are given', () => {
    expect(
      serializer.pick({ email: 'a@b.com', password: 'secret' }, undefined),
    ).toBeNull();
    expect(serializer.pick({ email: 'a@b.com' }, [])).toBeNull();
  });

  it('copies only allowlisted paths', () => {
    expect(
      serializer.pick({ email: 'a@b.com', password: 'secret', extra: 'nope' }, [
        'email',
      ]),
    ).toEqual({ email: 'a@b.com' });
  });

  it('strips denylisted keys even when they are allowlisted', () => {
    expect(
      serializer.pick({ email: 'a@b.com', password: 'secret' }, [
        'email',
        'password',
      ]),
    ).toEqual({ email: 'a@b.com' });
  });

  it('strips nested denylisted keys such as accessToken', () => {
    expect(
      serializer.pick(
        {
          user: { id: 9, email: 'a@b.com', roles: ['candidate'] },
          accessToken: 'jwt-should-never-log',
        },
        ['user.id', 'user.email', 'user.roles', 'accessToken'],
      ),
    ).toEqual({
      user: { id: 9, email: 'a@b.com', roles: ['candidate'] },
    });
  });

  it('caps oversized payloads', () => {
    const bulky: Record<string, string> = {};
    bulky.note = 'x'.repeat(AUDIT_STATE_MAX_BYTES + 10);
    expect(serializer.pick(bulky, ['note'])).toEqual({ _truncated: true });
  });

  it('strips national id and passport aliases', () => {
    const stripped = serializer.stripDenied({
      USER_NATIONAL_ID: '1234567890123',
      USER_PASSPORT_NO: 'AB123',
      email: 'safe@example.com',
    });
    expect(stripped).toEqual({ email: 'safe@example.com' });
  });
});
