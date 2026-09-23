import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { GelfProtocol, GelfUdpClient } from './gelf-udp.client';
import { GraylogLogger } from './graylog.logger';
import { HttpAccessInterceptor } from './http-access.interceptor';

@Global()
@Module({
  providers: [
    {
      provide: GelfUdpClient,
      inject: [ConfigService],
      useFactory: (config: ConfigService): GelfUdpClient => {
        const host = config.get<string>('GRAYLOG_HOST') ?? '';
        const port = config.get<number>('GRAYLOG_PORT') ?? 12201;
        const facility = config.get<string>('GRAYLOG_FACILITY') ?? 'buu-get';
        const rawProtocol = (
          config.get<string>('GRAYLOG_PROTOCOL') ?? 'udp'
        ).toLowerCase();
        const protocol: GelfProtocol = rawProtocol === 'http' ? 'http' : 'udp';
        const debugRaw = (
          config.get<string>('GRAYLOG_DEBUG') ?? ''
        ).toLowerCase();
        const debug = debugRaw === 'true' || debugRaw === '1';
        return new GelfUdpClient({ host, port, facility, protocol, debug });
      },
    },
    GraylogLogger,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpAccessInterceptor,
    },
  ],
  exports: [GelfUdpClient, GraylogLogger],
})
export class GraylogModule {}
