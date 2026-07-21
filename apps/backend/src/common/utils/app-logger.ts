import { Logger } from '@nestjs/common';

/**
 * Thin wrapper so services can log without scattering console.* in src/.
 */
export class AppLogger extends Logger {
  debugMessage(context: string, message: string): void {
    this.debug(message, context);
  }

  infoMessage(context: string, message: string): void {
    this.log(message, context);
  }

  warnMessage(context: string, message: string): void {
    this.warn(message, context);
  }

  errorMessage(context: string, message: string, trace?: string): void {
    this.error(message, trace, context);
  }
}
