import { ConsoleLogger } from '@nestjs/common';
import { GelfLevel, GelfUdpClient } from './gelf-udp.client';
import { GraylogLogger } from './graylog.logger';

describe('GraylogLogger', () => {
  let gelfClient: {
    sendApp: jest.Mock;
    sendAudit: jest.Mock;
    isEnabled: jest.Mock;
    isDebug: jest.Mock;
  };
  let logger: GraylogLogger;
  let printSpy: jest.SpiedFunction<ConsoleLogger['log']>;

  beforeEach(() => {
    gelfClient = {
      sendApp: jest.fn(),
      sendAudit: jest.fn(),
      isEnabled: jest.fn().mockReturnValue(true),
      isDebug: jest.fn().mockReturnValue(false),
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
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
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

  it('prints debug ship breadcrumb when GRAYLOG_DEBUG is on', () => {
    gelfClient.isDebug.mockReturnValue(true);
    logger.log('hello', 'Ctx');
    expect(console.warn).toHaveBeenCalledWith(
      '[GraylogLogger] GELF ship app [Ctx]: hello',
    );
  });

  it('filters out internal Nest bootstrap contexts from shipping to Graylog', () => {
    logger.log(
      'Mapped {/api/notifications, GET} (version: Neutral) route',
      'RouterExplorer',
    );
    expect(printSpy).toHaveBeenCalled();
    expect(gelfClient.sendApp).not.toHaveBeenCalled();

    logger.log('AppModule dependencies initialized', 'InstanceLoader');
    expect(gelfClient.sendApp).not.toHaveBeenCalled();
  });
});
