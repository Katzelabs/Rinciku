import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import { makeCategorySchema, makeTierSchema } from './schemas';

const t = ((key: string) => key) as unknown as TFunction;

describe('makeCategorySchema', () => {
  const schema = makeCategorySchema(t);
  const valid = {
    name: 'Groceries',
    tier_id: '11111111-1111-4111-8111-111111111111',
    icon: 'shopping-cart',
    color: '#a3a86b',
  };

  it('accepts a valid category', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('trims and requires a name', () => {
    expect(schema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
    expect(schema.safeParse({ ...valid, name: 'x'.repeat(41) }).success).toBe(
      false
    );
  });

  it('requires a uuid tier_id', () => {
    const r = schema.safeParse({ ...valid, tier_id: 'needs' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toBe('errors.tierRequired');
  });

  it('requires a non-empty icon', () => {
    expect(schema.safeParse({ ...valid, icon: '' }).success).toBe(false);
  });

  it('enforces a 6-digit hex color', () => {
    for (const bad of ['#fff', 'a3a86b', '#a3a86bff', 'red']) {
      expect(schema.safeParse({ ...valid, color: bad }).success).toBe(false);
    }
    expect(schema.safeParse({ ...valid, color: '#A3A86B' }).success).toBe(true);
  });
});

describe('makeTierSchema', () => {
  const schema = makeTierSchema(t);

  it('accepts a valid tier', () => {
    expect(
      schema.safeParse({
        name: 'Needs',
        color: '#a3a86b',
        is_essential: true,
      }).success
    ).toBe(true);
  });

  it('requires the is_essential boolean', () => {
    expect(schema.safeParse({ name: 'Needs', color: '#a3a86b' }).success).toBe(
      false
    );
  });

  it('rejects a bad color', () => {
    expect(
      schema.safeParse({
        name: 'Needs',
        color: 'olive',
        is_essential: false,
      }).success
    ).toBe(false);
  });
});
