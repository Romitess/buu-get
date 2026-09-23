import { Logger } from '@nestjs/common';
import { GELF_MAX_BYTES, GelfLevel, GelfUdpClient } from './gelf-udp.client';
import { AuditLogStatus } from 'src/modules/audit-logs/entities/audit-log.entity';

jest.mock('dgram', () => ({
  createSocket: jest.fn(),
}));

import { createSocket } from 'dgram';

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('is a no-op when host is empty', () => {
    const client = new GelfUdpClient({
      host: '',
      port: 12201,
      facility: 'buu-get',
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

  it('sends a GELF audit datagram without secrets or state blobs', () => {
    const client = new GelfUdpClient({
      host: 'graylog.example',
      port: 12201,
      facility: 'buu-get',
    });
    client.sendAudit({
      action: 'AUTH.LOGIN',
      status: AuditLogStatus.FAILURE,
      statusDetail: 'Invalid credentials',
      module: 'buu-get',
      resourceType: 'user',
      resourceId: '12',
      actorUserId: 12,
      actorSnapshot: { userId: 12, email: 'a@b.com' },
      correlationId: 'corr-1',
      ipAddress: '127.0.0.1',
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
    expect(parsed.short_message).toBe('AUTH.LOGIN FAILURE');
    expect(parsed.level).toBe(GelfLevel.ERROR);
    expect(parsed.facility).toBe('buu-get');
    expect(parsed._facility).toBe('buu-get');
    expect(parsed._event_type).toBe('audit');
    expect(parsed._action).toBe('AUTH.LOGIN');
    expect(parsed._status).toBe('FAILURE');
    expect(parsed._actor_email).toBe('a@b.com');
    expect(parsed).not.toHaveProperty('_before_state');
    expect(parsed).not.toHaveProperty('_after_state');
    expect(JSON.stringify(parsed)).not.toContain('password');
    expect(sendMock.mock.calls[0][1]).toBe(12201);
    expect(sendMock.mock.calls[0][2]).toBe('graylog.example');
  });

  it('sends app log lines with _event_type app', () => {
    const client = new GelfUdpClient({
      host: 'graylog.example',
      port: 12201,
      facility: 'buu-get',
    });
    client.sendApp(GelfLevel.INFO, 'started', 'Bootstrap');
    const body = sendMock.mock.calls[0][0] as Buffer;
    const parsed = JSON.parse(body.subarray(0, -1).toString('utf8')) as Record<
      string,
      unknown
    >;
    expect(parsed._event_type).toBe('app');
    expect(parsed._context).toBe('Bootstrap');
    expect(parsed.short_message).toBe('started');
    expect(parsed.level).toBe(GelfLevel.INFO);
  });

  it('swallows send errors and warns once', () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
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
    const client = new GelfUdpClient({
      host: 'graylog.example',
      port: 12201,
      facility: 'buu-get',
    });
    expect(() => client.sendApp(GelfLevel.ERROR, 'boom', 'Ctx')).not.toThrow();
    expect(() => client.sendApp(GelfLevel.ERROR, 'boom2', 'Ctx')).not.toThrow();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('drops oversized payloads without chunking', () => {
    const warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const client = new GelfUdpClient({
      host: 'graylog.example',
      port: 12201,
      facility: 'buu-get',
    });
    // short_message is capped; full_message (stack) can still blow the datagram limit
    const hugeStack = 'x'.repeat(GELF_MAX_BYTES + 1000);
    client.sendApp(GelfLevel.ERROR, 'boom', 'Ctx', hugeStack);
    expect(sendMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
