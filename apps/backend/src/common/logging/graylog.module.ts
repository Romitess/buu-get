import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GelfUdpClient } from './gelf-udp.client';
import { GraylogLogger } from './graylog.logger';

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
        return new GelfUdpClient({ host, port, facility });
      },
    },
    GraylogLogger,
  ],
  exports: [GelfUdpClient, GraylogLogger],
})
export class GraylogModule {}
