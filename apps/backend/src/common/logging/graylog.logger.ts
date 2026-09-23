import { ConsoleLogger, Injectable } from '@nestjs/common';
import { GelfLevel, GelfUdpClient } from './gelf-udp.client';

/**
 * Nest LoggerService that always writes to the terminal (ConsoleLogger) and
 * mirrors to Graylog when GRAYLOG_HOST is set. Audit/HTTP ships go through
 * GelfUdpClient directly — not re-logged here.
 *
 * When GRAYLOG_DEBUG=true, prints a [GraylogLogger] breadcrumb after each
 * mirrored app log (via console.warn — never Nest Logger — to avoid recursion).
 */
@Injectable()
export class GraylogLogger extends ConsoleLogger {
  constructor(private readonly gelfClient: GelfUdpClient) {
    super();
  }

  override log(message: unknown, ...optionalParams: unknown[]): void {
    super.log(message, ...optionalParams);
    this.mirror(GelfLevel.INFO, message, optionalParams);
  }

  override error(message: unknown, ...optionalParams: unknown[]): void {
    super.error(message, ...optionalParams);
    const { context, stack } = this.splitErrorParams(optionalParams);
    const text = this.formatLogMessage(message);
    this.gelfClient.sendApp(GelfLevel.ERROR, text, context, stack);
    this.traceShip('app', text, context);
  }

  override warn(message: unknown, ...optionalParams: unknown[]): void {
    super.warn(message, ...optionalParams);
    this.mirror(GelfLevel.WARNING, message, optionalParams);
  }

  override debug(message: unknown, ...optionalParams: unknown[]): void {
    super.debug(message, ...optionalParams);
    this.mirror(GelfLevel.DEBUG, message, optionalParams);
  }

  override verbose(message: unknown, ...optionalParams: unknown[]): void {
    super.verbose(message, ...optionalParams);
    this.mirror(GelfLevel.DEBUG, message, optionalParams);
  }

  override fatal(message: unknown, ...optionalParams: unknown[]): void {
    super.fatal(message, ...optionalParams);
    this.mirror(GelfLevel.ERROR, message, optionalParams);
  }

  private mirror(
    level: (typeof GelfLevel)[keyof typeof GelfLevel],
    message: unknown,
    optionalParams: unknown[],
  ): void {
    const context = this.extractContext(optionalParams);
    const text = this.formatLogMessage(message);
    this.gelfClient.sendApp(level, text, context);
    this.traceShip('app', text, context);
  }

  private traceShip(kind: string, text: string, context?: string): void {
    if (!this.gelfClient.isDebug() || !this.gelfClient.isEnabled()) {
      return;
    }
    const ctx = context ? ` [${context}]` : '';
    // console.warn — not Nest Logger — avoids sendApp recursion.
    console.warn(`[GraylogLogger] GELF ship ${kind}${ctx}: ${text}`);
  }

  private formatLogMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    if (message instanceof Error) {
      return message.message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  private extractContext(optionalParams: unknown[]): string | undefined {
    if (optionalParams.length === 0) {
      return undefined;
    }
    const last = optionalParams[optionalParams.length - 1];
    return typeof last === 'string' ? last : undefined;
  }

  private splitErrorParams(optionalParams: unknown[]): {
    context?: string;
    stack?: string;
  } {
    if (optionalParams.length === 0) {
      return {};
    }
    if (optionalParams.length === 1) {
      const only = optionalParams[0];
      if (typeof only === 'string') {
        return only.includes('\n') ? { stack: only } : { context: only };
      }
      return {};
    }
    const stack =
      typeof optionalParams[0] === 'string' ? optionalParams[0] : undefined;
    const context =
      typeof optionalParams[1] === 'string' ? optionalParams[1] : undefined;
    return { stack, context };
  }
}
