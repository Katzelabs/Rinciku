import { describe, expect, it } from 'vitest';
import {
  changeToolInputSchema,
  exportToolInputSchema,
  proposalToolInputSchema,
} from './schemas';

// These schemas validate raw tool `input` straight from the model before the
// app trusts it. They are the last gate between an LLM-shaped object and a
// mutation, so malformed / hallucinated input must be rejected or coerced,
// never passed through.

describe('proposalToolInputSchema', () => {
  it('accepts a well-formed proposal', () => {
    const parsed = proposalToolInputSchema.parse({
      amount: 45000,
      currency: 'IDR',
      note: 'lunch',
      confidence: 0.9,
    });
    expect(parsed.amount).toBe(45000);
    expect(parsed.currency).toBe('IDR');
  });

  it('rejects a non-positive amount', () => {
    expect(
      proposalToolInputSchema.safeParse({ amount: 0, currency: 'IDR' }).success
    ).toBe(false);
    expect(
      proposalToolInputSchema.safeParse({ amount: -5, currency: 'USD' }).success
    ).toBe(false);
  });

  it('falls back to IDR for an unknown currency instead of failing', () => {
    const parsed = proposalToolInputSchema.parse({
      amount: 10,
      currency: 'BTC',
    });
    expect(parsed.currency).toBe('IDR');
  });

  it('tolerates omitted optional fields', () => {
    const parsed = proposalToolInputSchema.parse({
      amount: 10,
      currency: 'USD',
    });
    expect(parsed.note).toBeUndefined();
  });

  it('rejects a confidence outside 0..1', () => {
    expect(
      proposalToolInputSchema.safeParse({
        amount: 10,
        currency: 'IDR',
        confidence: 1.5,
      }).success
    ).toBe(false);
  });
});

describe('changeToolInputSchema', () => {
  it('accepts each valid action/entity pair', () => {
    for (const action of ['create', 'update', 'delete'] as const) {
      for (const entity of [
        'expense',
        'income',
        'category',
        'income_category',
        'essential',
        'budget',
        'tier',
      ] as const) {
        expect(
          changeToolInputSchema.safeParse({ action, entity, summary: 'x' })
            .success
        ).toBe(true);
      }
    }
  });

  it('rejects unknown actions and entities', () => {
    expect(
      changeToolInputSchema.safeParse({
        action: 'truncate',
        entity: 'expense',
        summary: 'x',
      }).success
    ).toBe(false);
    expect(
      changeToolInputSchema.safeParse({
        action: 'delete',
        entity: 'profile',
        summary: 'x',
      }).success
    ).toBe(false);
  });

  it('requires a non-empty summary', () => {
    expect(
      changeToolInputSchema.safeParse({
        action: 'delete',
        entity: 'tier',
        summary: '',
      }).success
    ).toBe(false);
  });

  it('keeps data as an opaque record for the dispatcher to re-validate', () => {
    const parsed = changeToolInputSchema.parse({
      action: 'update',
      entity: 'budget',
      data: { amount: 100, nested: { anything: true } },
      summary: 'x',
    });
    expect(parsed.data).toEqual({ amount: 100, nested: { anything: true } });
  });
});

describe('exportToolInputSchema', () => {
  it('accepts a valid kind with ISO dates', () => {
    const parsed = exportToolInputSchema.parse({
      kind: 'both',
      from: '2026-07-01',
      to: '2026-07-31',
    });
    expect(parsed.kind).toBe('both');
    expect(parsed.from).toBe('2026-07-01');
  });

  it('coerces a wrong-shaped date to null rather than rejecting the export', () => {
    const parsed = exportToolInputSchema.parse({
      kind: 'expenses',
      from: 'last week',
      to: '07/31/2026',
    });
    expect(parsed.from).toBeNull();
    expect(parsed.to).toBeNull();
  });

  it('validates date SHAPE only — a calendar-invalid but digit-shaped date passes through', () => {
    // The regex gate checks YYYY-MM-DD shape, not real calendar validity;
    // downstream date parsing is responsible for the final window.
    const parsed = exportToolInputSchema.parse({
      kind: 'both',
      from: '2026-13-99',
    });
    expect(parsed.from).toBe('2026-13-99');
  });

  it('rejects an unknown kind', () => {
    expect(
      exportToolInputSchema.safeParse({ kind: 'everything' }).success
    ).toBe(false);
  });
});
