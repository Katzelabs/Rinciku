import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { makeExpenseCsvRowSchema, makeExpenseSchema } from './schemas';

// The schema factories are i18n-aware: they call t(key) for messages. Tests
// don't need real translations, so t is stubbed to echo the key — that also
// lets assertions check WHICH validation fired.
const t = ((key: string) => key) as unknown as TFunction;

const validForm = () => ({
  amount: 45000,
  currency: 'IDR' as const,
  category_id: '11111111-1111-4111-8111-111111111111',
  occurred_at: new Date('2020-01-01'),
  note: 'lunch',
});

describe('makeExpenseSchema', () => {
  const schema = makeExpenseSchema(t);

  it('accepts a valid expense', () => {
    expect(schema.safeParse(validForm()).success).toBe(true);
  });

  it('rejects a non-positive amount', () => {
    const r = schema.safeParse({ ...validForm(), amount: 0 });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('errors.amountPositive');
  });

  it('rejects a non-finite / astronomically large amount', () => {
    expect(schema.safeParse({ ...validForm(), amount: Infinity }).success).toBe(
      false
    );
    expect(schema.safeParse({ ...validForm(), amount: 1e16 }).success).toBe(
      false
    );
  });

  it('rejects an unsupported currency', () => {
    expect(schema.safeParse({ ...validForm(), currency: 'BTC' }).success).toBe(
      false
    );
  });

  it('rejects a non-uuid category_id', () => {
    const r = schema.safeParse({ ...validForm(), category_id: 'food' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('errors.categoryRequired');
  });

  it('rejects a future date', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const r = schema.safeParse({ ...validForm(), occurred_at: tomorrow });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('errors.dateFuture');
  });

  it('rejects a note over 280 chars', () => {
    expect(
      schema.safeParse({ ...validForm(), note: 'x'.repeat(281) }).success
    ).toBe(false);
  });

  it('allows an empty note', () => {
    expect(schema.safeParse({ ...validForm(), note: '' }).success).toBe(true);
  });
});

describe('makeExpenseCsvRowSchema', () => {
  const schema = makeExpenseCsvRowSchema(t);

  it('coerces a valid string row to typed values', () => {
    const r = schema.parse({
      date: '2026-06-21',
      amount: '45,000',
      currency: 'idr',
      category: ' Food ',
      note: ' lunch ',
    });
    expect(r.amount).toBe(45000); // commas stripped, coerced to number
    expect(r.currency).toBe('IDR'); // uppercased
    expect(r.category).toBe('Food'); // trimmed
    expect(r.note).toBe('lunch');
  });

  it('rejects an unparseable date', () => {
    const r = schema.safeParse({
      date: 'not-a-date',
      amount: '1',
      currency: 'IDR',
    });
    expect(r.success).toBe(false);
  });

  it('rejects a non-positive or non-numeric amount', () => {
    expect(
      schema.safeParse({ date: '2026-06-21', amount: '0', currency: 'IDR' })
        .success
    ).toBe(false);
    expect(
      schema.safeParse({ date: '2026-06-21', amount: 'abc', currency: 'IDR' })
        .success
    ).toBe(false);
  });

  it('rejects an unsupported currency', () => {
    expect(
      schema.safeParse({ date: '2026-06-21', amount: '1', currency: 'BTC' })
        .success
    ).toBe(false);
  });

  it('defaults category and note to empty strings when omitted', () => {
    const r = schema.parse({
      date: '2026-06-21',
      amount: '1',
      currency: 'IDR',
    });
    expect(r.category).toBe('');
    expect(r.note).toBe('');
  });
});
