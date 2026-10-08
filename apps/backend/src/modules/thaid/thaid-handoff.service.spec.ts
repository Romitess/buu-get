import { Repository } from 'typeorm';
import { ThaidAuthState } from './entities/thaid-auth-state.entity';
import { ThaidHandoff } from './entities/thaid-handoff.entity';
import { ThaidHandoffService } from './thaid-handoff.service';

describe('ThaidHandoffService', () => {
  const states: ThaidAuthState[] = [];
  const handoffs: ThaidHandoff[] = [];
  let nextId = 1;

  const stateRepo = {
    create: jest.fn((data: Partial<ThaidAuthState>) => data),
    save: jest.fn(async (row: ThaidAuthState) => {
      const saved = {
        ...row,
        thaidStateId: nextId++,
      };
      states.push(saved);
      return saved;
    }),
    findOne: jest.fn(async ({ where }: { where: { stateHash: string } }) => {
      return states.find((row) => row.stateHash === where.stateHash) ?? null;
    }),
    update: jest.fn(
      async (
        where: { thaidStateId: number; consumedAt: unknown },
        patch: { consumedAt: Date },
      ) => {
        const row = states.find(
          (item) => item.thaidStateId === where.thaidStateId,
        );
        if (!row || row.consumedAt) {
          return { affected: 0 };
        }
        row.consumedAt = patch.consumedAt;
        return { affected: 1 };
      },
    ),
  };

  const handoffRepo = {
    create: jest.fn((data: Partial<ThaidHandoff>) => data),
    save: jest.fn(async (row: ThaidHandoff) => {
      const saved = { ...row, thaidHandoffId: nextId++ };
      handoffs.push(saved);
      return saved;
    }),
    findOne: jest.fn(
      async ({ where }: { where: { ticketHash: string; kind: string } }) => {
        return (
          handoffs.find(
            (row) =>
              row.ticketHash === where.ticketHash && row.kind === where.kind,
          ) ?? null
        );
      },
    ),
    update: jest.fn(
      async (
        where: { thaidHandoffId: number },
        patch: { consumedAt: Date },
      ) => {
        const row = handoffs.find(
          (item) => item.thaidHandoffId === where.thaidHandoffId,
        );
        if (!row || row.consumedAt) {
          return { affected: 0 };
        }
        row.consumedAt = patch.consumedAt;
        return { affected: 1 };
      },
    ),
  };

  const service = new ThaidHandoffService(
    stateRepo as unknown as Repository<ThaidAuthState>,
    handoffRepo as unknown as Repository<ThaidHandoff>,
  );

  beforeEach(() => {
    states.length = 0;
    handoffs.length = 0;
    nextId = 1;
  });

  it('accepts a state once and rejects reuse', async () => {
    const state = await service.createState('login');

    await expect(service.consumeState(state)).resolves.toEqual({
      intent: 'login',
      userId: null,
    });
    await expect(service.consumeState(state)).resolves.toBeNull();
  });

  it('rejects an unknown state without marking anything consumed', async () => {
    await expect(service.consumeState('missing')).resolves.toBeNull();
  });
});
