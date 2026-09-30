import {
  Controller,
  Get,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from 'src/decorators/public.decorator';
import { GelfUdpClient } from 'src/common/logging/gelf-udp.client';

export type HealthOkResponse = { status: 'ok'; version: string };

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    @Optional() private readonly gelfClient?: GelfUdpClient,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Liveness / readiness probe',
    description:
      'Public endpoint for k8s/load balancers. Pings the database with SELECT 1.',
  })
  async check(): Promise<HealthOkResponse> {
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ok',
        version: process.env.APP_VERSION || 'unknown',
      };
    } catch {
      throw new ServiceUnavailableException({ status: 'error' });
    }
  }

  @Public()
  @Get('graylog')
  @ApiOperation({
    summary: 'Graylog connection and diagnostic probe',
    description:
      'Public diagnostic endpoint to verify Graylog configuration and probe network socket connectivity.',
  })
  async checkGraylog(): Promise<Record<string, unknown>> {
    if (!this.gelfClient) {
      return {
        enabled: false,
        error: 'GelfUdpClient is not registered in the application context',
      };
    }
    return this.gelfClient.getDiagnosticsWithTest();
  }
}
