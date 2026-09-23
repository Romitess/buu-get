import {
  GELF_MAX_BYTES,
  GelfLevel,
  GelfUdpClient,
  buildGrayLogPayload,
} from './gelf-udp.client';
import { AuditLogStatus } from 'src/modules/audit-logs/entities/audit-log.entity';

jest.mock('dgram', () => ({
  createSocket: jest.fn(),
}));

jest.mock('net', () => ({
  connect: jest.fn(),
}));

import { createSocket } from 'dgram';
import { connect as netConnect } from 'net';

const baseOpts = {
  host: 'graylog.example',
  port: 12201,
  facility: 'buuget',
  protocol: 'udp' as const,
};

describe('buildGrayLogPayload', () => {
  it('maps manual fields and uses full_name as short_message', () => {
    const payload = buildGrayLogPayload(
      {
        event: 'login',
        parameter: 'a@b.com',
        status: true,
        menu: 'auth',
        user_id: '12',
        full_name: 'a@b.com',
      },
      6,
      false,
      'buuget',
    );

    expect(payload.version).toBe('1.1');
    expect(payload.host).toBe('buuget');
    expect(payload.short_message).toBe('ผู้เข้าใช้งาน : a@b.com');
    expect(payload.level).toBe(6);
    expect(payload._event).toBe('login');
    expect(payload._parameter).toBe('a@b.com');
    expect(payload._status).toBe(true);
    expect(payload._menu).toBe('auth');
    expect(payload._user_id).toBe('12');
    expect(payload._full_name).toBe('a@b.com');
    expect(payload).not.toHaveProperty('_event_type');
  });

  it('keeps custom extras only when logCustom=true', () => {
    const withoutCustom = buildGrayLogPayload(
      { event: 'view', full_name: 'x', extra: 'nope' },
      6,
      false,
      'buuget',
    );
    expect(withoutCustom).not.toHaveProperty('_extra');

    const withCustom = buildGrayLogPayload(
      { event: 'view', full_name: 'x', extra: 'yes' },
      6,
      true,
      'buuget',
    );
    expect(withCustom._extra).toBe('yes');
  });

  it('uses source as GELF host when provided', () => {
    const payload = buildGrayLogPayload(
      { source: 'buu-get-custom', event: 'view', full_name: 'n' },
      6,
      false,
      'buuget',
    );
    expect(payload.host).toBe('buu-get-custom');
  });
});

describe('GelfUdpClient', () => {
  let sendMock: jest.Mock;
  let socket: {
    send: jest.Mock;
    unref: jest.Mock;
    on: jest.Mock;
  };

  beforeEach(() => {
    sendMock = jest.fn(
      (
        _msg: string | Buffer,
        _port: number,
        _host: string,
        cb?: (err?: Error | null) => void,
      ) => {
        if (cb) {
          cb(null);
        }
      },
    );
    socket = {
      send: sendMock,
      unref: jest.fn(),
      on: jest.fn(),
    };
    (createSocket as jest.Mock).mockReturnValue(socket);
    (netConnect as jest.Mock).mockReset();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('is a no-op when host is empty', () => {
    const client = new GelfUdpClient({
      host: '',
      port: 12201,
      facility: 'buuget',
      protocol: 'udp',
    });
    expect(client.isEnabled()).toBe(false);
    client.sendAudit({
      action: 'AUTH.LOGIN',
      status: AuditLogStatus.SUCCESS,
      module: 'buu-get',
    });
    client.sendApp(GelfLevel.INFO, 'hello');
    expect(createSocket).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('ships login audit with manual grayLog fields', () => {
    const client = new GelfUdpClient(baseOpts);
    client.sendAudit({
      action: 'AUTH.LOGIN',
      status: AuditLogStatus.FAILURE,
      statusDetail: 'Invalid credentials',
      module: 'buu-get',
      resourceType: 'user',
      resourceId: '12',
      actorUserId: 12,
      actorSnapshot: { userId: 12, email: 'a@b.com' },
      beforeState: { email: 'a@b.com', password: 'secret' },
      correlationId: 'corr-1',
      ipAddress: '::1',
      userAgent:
        'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    });

    expect(createSocket).toHaveBeenCalledWith('udp4');
    expect(sendMock).toHaveBeenCalledTimes(1);
    const body = sendMock.mock.calls[0][0] as Buffer;
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(body[body.length - 1]).toBe(0);
    const parsed = JSON.parse(body.subarray(0, -1).toString('utf8')) as Record<
      string,
      unknown
    >;
    expect(parsed.version).toBe('1.1');
    expect(parsed.host).toBe('buuget');
    expect(parsed.short_message).toBe('ผู้เข้าใช้งาน : a@b.com');
    expect(parsed.level).toBe(GelfLevel.WARNING);
    expect(parsed._event).toBe('login');
    expect(parsed._status).toBe(false);
    expect(parsed._parameter).toBe('a@b.com');
    expect(parsed._menu).toBe('user');
    expect(parsed._remarks).toBe('Invalid credentials');
    expect(parsed._user_id).toBe('12');
    expect(parsed._full_name).toBe('a@b.com');
    expect(parsed._facility).toBe('buuget');
    expect(parsed._ip_address).toBe('127.0.0.1');
    expect(parsed._browser).toBe('Google Chrome');
    expect(parsed._equipment).toBe('Desktop');
    expect(parsed).not.toHaveProperty('_event_type');
    expect(parsed).not.toHaveProperty('_action');
    expect(JSON.stringify(parsed)).not.toContain('secret');
    expect(JSON.stringify(parsed)).not.toContain('password');
  });

  it('ships app logs without inventing an event token', () => {
    const client = new GelfUdpClient(baseOpts);
    client.sendApp(GelfLevel.INFO, 'started', 'Bootstrap');
    const body = sendMock.mock.calls[0][0] as Buffer;
    const parsed = JSON.parse(body.subarray(0, -1).toString('utf8')) as Record<
      string,
      unknown
    >;
    expect(parsed.short_message).toBe('ผู้เข้าใช้งาน : started');
    expect(parsed._remarks).toBe('started');
    expect(parsed._menu).toBe('Bootstrap');
    expect(parsed._sub_menu).toBe('app');
    expect(parsed._facility).toBe('buuget');
    expect(parsed).not.toHaveProperty('_event');
    expect(parsed).not.toHaveProperty('_event_type');
    expect(parsed.level).toBe(GelfLevel.INFO);
  });

  it('ships GELF TCP with null frame delimiter like gelf-pro', async () => {
    const handlers: Record<string, (...args: unknown[]) => void> = {};
    type TcpMock = {
      setTimeout: jest.Mock;
      once: jest.Mock;
      end: jest.Mock;
      destroy: jest.Mock;
      emit: jest.Mock;
    };
    const tcpSocket: TcpMock = {
      setTimeout: jest.fn(),
      once: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
      emit: jest.fn(),
    };
    tcpSocket.once.mockImplementation(
      (event: string, handler: (...args: unknown[]) => void): TcpMock => {
        handlers[event] = handler;
        return tcpSocket;
      },
    );
    tcpSocket.end.mockImplementation(
      (data?: Buffer | string | (() => void), cb?: () => void): TcpMock => {
        if (typeof data === 'function') {
          data();
        } else if (typeof cb === 'function') {
          cb();
        }
        return tcpSocket;
      },
    );
    tcpSocket.emit.mockImplementation(
      (event: string, ...args: unknown[]): boolean => {
        handlers[event]?.(...args);
        return false;
      },
    );
    (netConnect as jest.Mock).mockReturnValue(tcpSocket);

    const client = new GelfUdpClient({
      ...baseOpts,
      protocol: 'tcp',
    });
    client.sendApp(GelfLevel.INFO, 'tcp-ready', 'GraylogLogger');

    expect(createSocket).not.toHaveBeenCalled();
    expect(netConnect).toHaveBeenCalledWith({
      host: 'graylog.example',
      port: 12201,
      family: 4,
    });
    expect(tcpSocket.setTimeout).toHaveBeenCalledWith(
      10000,
      expect.any(Function),
    );
    expect(handlers.connect).toBeDefined();

    handlers.connect();
    await new Promise((resolve) => setImmediate(resolve));

    expect(tcpSocket.end).toHaveBeenCalled();
    const packet = tcpSocket.end.mock.calls[0][0] as Buffer;
    expect(Buffer.isBuffer(packet)).toBe(true);
    expect(packet[packet.length - 1]).toBe(0x00);
    const parsed = JSON.parse(
      packet.subarray(0, -1).toString('utf8'),
    ) as Record<string, unknown>;
    expect(parsed.short_message).toBe('ผู้เข้าใช้งาน : tcp-ready');
    expect(parsed._facility).toBe('buuget');
    expect(parsed.host).toBe('buuget');
  });

  it('warns when GELF TCP connect fails', async () => {
    const handlers: Record<string, (...args: unknown[]) => void> = {};
    type TcpMock = {
      setTimeout: jest.Mock;
      once: jest.Mock;
      end: jest.Mock;
      destroy: jest.Mock;
      emit: jest.Mock;
    };
    const tcpSocket: TcpMock = {
      setTimeout: jest.fn(),
      once: jest.fn(),
      end: jest.fn(),
      destroy: jest.fn(),
      emit: jest.fn(),
    };
    tcpSocket.once.mockImplementation(
      (event: string, handler: (...args: unknown[]) => void): TcpMock => {
        handlers[event] = handler;
        return tcpSocket;
      },
    );
    (netConnect as jest.Mock).mockReturnValue(tcpSocket);

    const client = new GelfUdpClient({
      ...baseOpts,
      protocol: 'tcp',
    });
    expect(() =>
      client.sendApp(GelfLevel.INFO, 'will-fail', 'Ctx'),
    ).not.toThrow();

    handlers.error?.(new Error('ECONNREFUSED'));
    await new Promise((resolve) => setImmediate(resolve));

    expect(tcpSocket.end).toHaveBeenCalled();
    expect(tcpSocket.destroy).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('GELF tcp send failed'),
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('ECONNREFUSED'),
    );
  });

  it('ships http access as view/insert with boolean status', () => {
    const client = new GelfUdpClient(baseOpts);
    client.sendHttpAccess({
      method: 'POST',
      path: '/api/auth/login',
      statusCode: 401,
      durationMs: 12,
      ipAddress: '::ffff:1.2.3.4',
      userId: null,
      fullName: 'a@b.com',
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
    const body = sendMock.mock.calls[0][0] as Buffer;
    const parsed = JSON.parse(body.subarray(0, -1).toString('utf8')) as Record<
      string,
      unknown
    >;
    expect(parsed._event).toBe('insert');
    expect(parsed._parameter).toBe('/api/auth/login');
    expect(parsed._status).toBe(false);
    expect(parsed._menu).toBe('auth');
    expect(parsed._sub_menu).toBe('login');
    expect(parsed.short_message).toBe('ผู้เข้าใช้งาน : a@b.com');
    expect(parsed.level).toBe(GelfLevel.WARNING);
    expect(parsed._ip_address).toBe('1.2.3.4');
    expect(parsed._browser).toBe('Apple Safari');
    expect(parsed._equipment).toBe('Mobile');
    expect(parsed._url).toBe('/api/auth/login');
    expect(parsed).not.toHaveProperty('_event_type');
  });

  it('posts JSON over HTTP without null terminator', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
      statusText: 'Accepted',
    });
    global.fetch = fetchMock;

    const client = new GelfUdpClient({
      ...baseOpts,
      protocol: 'http',
      debug: true,
    });
    client.sendApp(GelfLevel.INFO, 'http-path', 'Ctx');
    await new Promise((resolve) => setImmediate(resolve));

    expect(createSocket).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [
      string,
      { method: string; body: string; signal: AbortSignal },
    ];
    expect(url).toBe('http://graylog.example:12201/gelf');
    expect(init.method).toBe('POST');
    expect(init.signal).toBeDefined();
    expect(init.body.includes('\0')).toBe(false);
    const parsed = JSON.parse(init.body) as Record<string, unknown>;
    expect(parsed.short_message).toBe('ผู้เข้าใช้งาน : http-path');
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[GraylogLogger]'),
    );
  });

  it('warns when HTTP GELF times out', async () => {
    jest.useFakeTimers();
    const fetchMock = jest.fn(
      (_url: string, init?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new GelfUdpClient({
      ...baseOpts,
      protocol: 'http',
    });
    client.sendApp(GelfLevel.INFO, 'will-timeout', 'Ctx');
    await jest.advanceTimersByTimeAsync(3000);
    await Promise.resolve();

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[GraylogLogger]'),
    );
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('timeout after 3000ms'),
    );
    jest.useRealTimers();
  });

  it('swallows send errors and warns', () => {
    sendMock.mockImplementation(
      (
        _msg: string | Buffer,
        _port: number,
        _host: string,
        cb?: (err?: Error | null) => void,
      ) => {
        if (cb) {
          cb(new Error('network down'));
        }
      },
    );
    const client = new GelfUdpClient(baseOpts);
    expect(() => client.sendApp(GelfLevel.ERROR, 'boom', 'Ctx')).not.toThrow();
    expect(console.warn).toHaveBeenCalled();
  });

  it('drops oversized payloads without chunking', () => {
    const client = new GelfUdpClient(baseOpts);
    const hugeStack = 'x'.repeat(GELF_MAX_BYTES + 1000);
    client.sendApp(GelfLevel.ERROR, 'boom', 'Ctx', hugeStack);
    expect(sendMock).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });
});
