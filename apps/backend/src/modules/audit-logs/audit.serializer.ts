import { Injectable } from '@nestjs/common';
import {
  AUDIT_DENYLIST_NORMALIZED,
  AUDIT_STATE_MAX_BYTES,
  normalizeAuditKey,
} from './constants/audit.constants';

export type JsonObject = Record<string, unknown>;

@Injectable()
export class AuditSerializer {
  /**
   * Allowlist-by-default: only listed paths are copied, then denylist is applied,
   * then the payload is size-capped.
   */
  pick(source: unknown, paths: string[] | undefined): JsonObject | null {
    if (
      !paths ||
      paths.length === 0 ||
      source === null ||
      source === undefined
    ) {
      return null;
    }
    if (typeof source !== 'object') {
      return null;
    }

    const picked: JsonObject = {};
    for (const path of paths) {
      const value = this.getPath(source, path);
      if (value !== undefined) {
        this.setPath(picked, path, value);
      }
    }

    const stripped = this.stripDenied(picked);
    if (
      stripped === null ||
      typeof stripped !== 'object' ||
      Array.isArray(stripped)
    ) {
      return null;
    }
    return this.capSize(stripped as JsonObject);
  }

  capSize(value: JsonObject): JsonObject {
    const json = JSON.stringify(value);
    if (json.length <= AUDIT_STATE_MAX_BYTES) {
      return value;
    }
    return { _truncated: true };
  }

  stripDenied(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.stripDenied(item));
    }
    if (value !== null && typeof value === 'object') {
      const result: JsonObject = {};
      for (const [key, nested] of Object.entries(value)) {
        if (AUDIT_DENYLIST_NORMALIZED.has(normalizeAuditKey(key))) {
          continue;
        }
        result[key] = this.stripDenied(nested);
      }
      return result;
    }
    return value;
  }

  getPath(source: unknown, path: string): unknown {
    const parts = path.split('.').filter((part) => part.length > 0);
    let current: unknown = source;
    for (const part of parts) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== 'object'
      ) {
        return undefined;
      }
      current = (current as JsonObject)[part];
    }
    return current;
  }

  private setPath(target: JsonObject, path: string, value: unknown): void {
    const parts = path.split('.').filter((part) => part.length > 0);
    if (parts.length === 0) {
      return;
    }
    let current: JsonObject = target;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      const next = current[key];
      if (typeof next !== 'object' || next === null || Array.isArray(next)) {
        current[key] = {};
      }
      current = current[key] as JsonObject;
    }
    current[parts[parts.length - 1]] = value;
  }
}
