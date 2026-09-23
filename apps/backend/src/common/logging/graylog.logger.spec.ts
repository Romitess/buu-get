import { ConsoleLogger } from '@nestjs/common';
import { GelfLevel, GelfUdpClient } from './gelf-udp.client';
import { GraylogLogger } from './graylog.logger';

describe('GraylogLogger', () => {
  let gelfClient: {
    sendApp: jest.Mock;
    sendAudit: jest.Mock;
    isEnabled: jest.Mock;
  };
  let logger: GraylogLogger;
  let printSpy: jest.SpiedFunction<ConsoleLogger['log']>;

  beforeEach(() => {
    gelfClient = {
      sendApp: jest.fn(),
      sendAudit: jest.fn(),
      isEnabled: jest.fn().mockReturnValue(true),
    };
    logger = new GraylogLogger(gelfClient as unknown as GelfUdpClient);
    printSpy = jest
      .spyOn(ConsoleLogger.prototype, 'log')
      .mockImplementation(() => undefined);
    jest
      .spyOn(ConsoleLogger.prototype, 'error')
      .mockImplementation(() => undefined);
    jest
      .spyOn(ConsoleLogger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('mirrors log() to Graylog as app event and still writes console', () => {
    logger.log('hello', 'Ctx');
    expect(printSpy).toHaveBeenCalled();
    expect(gelfClient.sendApp).toHaveBeenCalledWith(
      GelfLevel.INFO,
      'hello',
      'Ctx',
    );
    expect(gelfClient.sendAudit).not.toHaveBeenCalled();
  });

  it('mirrors error() with stack without throwing', () => {
    expect(() =>
      logger.error('fail', 'stack-trace-here\nline2', 'AuditLogsService'),
    ).not.toThrow();
    expect(gelfClient.sendApp).toHaveBeenCalledWith(
      GelfLevel.ERROR,
      'fail',
      'AuditLogsService',
      'stack-trace-here\nline2',
    );
  });

  it('mirrors warn() as WARNING level', () => {
    logger.warn('careful', 'Ctx');
    expect(gelfClient.sendApp).toHaveBeenCalledWith(
      GelfLevel.WARNING,
      'careful',
      'Ctx',
    );
  });
});
