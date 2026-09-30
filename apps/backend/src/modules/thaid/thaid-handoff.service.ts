import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import {
  ThaidAuthState,
  ThaidIntent,
} from './entities/thaid-auth-state.entity';
import {
  ThaidHandoff,
  ThaidHandoffKind,
} from './entities/thaid-handoff.entity';

const STATE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 10 * 60 * 1000;
const REGISTER_PROOF_TTL_MS = 30 * 60 * 1000;

export interface ThaidPrefillPayload {
  nationalId: string;
  titleTH: string;
  titleEN: string;
  fullName: string;
  englishName: string;
  birthdate: string;
}

export interface ThaidLoginTicketPayload {
  outcome: 'login';
  notice: 'signed_in' | 'existing_account';
  userId: number;
}

export interface ThaidPrefillTicketPayload {
  outcome: 'prefill';
  notice: 'no_account' | 'continue_register';
  registrationToken: string;
  prefill: ThaidPrefillPayload;
}

export type ThaidSessionTicketPayload =
  | ThaidLoginTicketPayload
  | ThaidPrefillTicketPayload;

export interface ThaidRegisterProof {
  pid: string;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function randomSecret(): string {
  return randomBytes(32).toString('base64url');
}

@Injectable()
export class ThaidHandoffService {
  constructor(
    @InjectRepository(ThaidAuthState)
    private readonly states: Repository<ThaidAuthState>,
    @InjectRepository(ThaidHandoff)
    private readonly handoffs: Repository<ThaidHandoff>,
  ) {}

  async createState(intent: ThaidIntent): Promise<string> {
    const raw = randomSecret();
    const row = this.states.create({
      stateHash: sha256(raw),
      intent,
      expiresAt: new Date(Date.now() + STATE_TTL_MS),
      consumedAt: null,
    });
    await this.states.save(row);
    return raw;
  }

  /** คืนเจตนาเมื่อ state ยังไม่ใช้และไม่หมดอายุ แล้วทำเครื่องหมายว่าใช้แล้ว */
  async consumeState(rawState: string): Promise<ThaidIntent | null> {
    const row = await this.states.findOne({
      where: { stateHash: sha256(rawState) },
    });
    if (!row || row.consumedAt || row.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    const updated = await this.states.update(
      { thaidStateId: row.thaidStateId, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
    if (!updated.affected) {
      return null;
    }
    return row.intent;
  }

  async createSessionTicket(
    payload: ThaidSessionTicketPayload,
  ): Promise<string> {
    return this.insertHandoff('session', payload, SESSION_TTL_MS);
  }

  async consumeSessionTicket(
    rawTicket: string,
  ): Promise<ThaidSessionTicketPayload | null> {
    const payload = await this.consumeHandoff(rawTicket, 'session');
    if (!payload || !isSessionPayload(payload)) {
      return null;
    }
    return payload;
  }

  async createRegisterProof(pid: string): Promise<string> {
    return this.insertHandoff(
      'register_proof',
      { pid } satisfies ThaidRegisterProof,
      REGISTER_PROOF_TTL_MS,
    );
  }

  async peekRegisterProof(
    rawToken: string,
  ): Promise<ThaidRegisterProof | null> {
    const row = await this.handoffs.findOne({
      where: { ticketHash: sha256(rawToken), kind: 'register_proof' },
    });
    if (!row || row.consumedAt || row.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    return parseRegisterProof(row.payloadJson);
  }

  async consumeRegisterProof(rawToken: string): Promise<void> {
    await this.consumeHandoff(rawToken, 'register_proof');
  }

  private async insertHandoff(
    kind: ThaidHandoffKind,
    payload: unknown,
    ttlMs: number,
  ): Promise<string> {
    const raw = randomSecret();
    const row = this.handoffs.create({
      ticketHash: sha256(raw),
      kind,
      payloadJson: JSON.stringify(payload),
      expiresAt: new Date(Date.now() + ttlMs),
      consumedAt: null,
    });
    await this.handoffs.save(row);
    return raw;
  }

  private async consumeHandoff(
    rawTicket: string,
    kind: ThaidHandoffKind,
  ): Promise<unknown> {
    const row = await this.handoffs.findOne({
      where: { ticketHash: sha256(rawTicket), kind },
    });
    if (!row || row.consumedAt || row.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    const updated = await this.handoffs.update(
      { thaidHandoffId: row.thaidHandoffId, consumedAt: IsNull() },
      { consumedAt: new Date() },
    );
    if (!updated.affected) {
      return null;
    }
    try {
      return JSON.parse(row.payloadJson) as unknown;
    } catch {
      return null;
    }
  }
}

function parseRegisterProof(payloadJson: string): ThaidRegisterProof | null {
  try {
    const parsed: unknown = JSON.parse(payloadJson);
    if (
      parsed === null ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    const pid = (parsed as Record<string, unknown>).pid;
    if (typeof pid !== 'string' || !/^\d{13}$/.test(pid)) {
      return null;
    }
    return { pid };
  } catch {
    return null;
  }
}

function isSessionPayload(value: unknown): value is ThaidSessionTicketPayload {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const outcome = (value as Record<string, unknown>).outcome;
  return outcome === 'login' || outcome === 'prefill';
}
