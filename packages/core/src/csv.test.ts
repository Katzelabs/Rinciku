import { describe, expect, it } from 'vitest';
import { isCurrencyCode, parseCsv, parseCsvDate, toCsv } from './csv';

describe('toCsv', () => {
  it('emits quoted fields with CRLF line endings in column order', () => {
    const csv = toCsv(
      [
        { name: 'lunch', amount: 50000 },
        { name: 'coffee', amount: 25000 },
      ],
      ['name', 'amount']
    );
    expect(csv).toBe('"name","amount"\r\n"lunch","50000"\r\n"coffee","25000"');
  });

  it('neutralizes formula injection in string cells', () => {
    for (const payload of [
      '=HYPERLINK("http://evil")',
      '+1234',
      '-cmd',
      '@SUM(A1)',
      '\tleading tab',
    ]) {
      const csv = toCsv([{ note: payload }], ['note']);
      expect(csv).toContain(`'${payload.slice(0, 1)}`); // apostrophe prefix
      expect(csv.split('\r\n')[1]!.startsWith(`"'`)).toBe(true);
    }
  });

  it('leaves negative numbers numeric (not escaped)', () => {
    const csv = toCsv([{ amount: -500 }], ['amount']);
    expect(csv.split('\r\n')[1]).toBe('"-500"');
  });

  it('escapes embedded quotes safely', () => {
    const csv = toCsv([{ note: 'said "hi"' }], ['note']);
    expect(csv.split('\r\n')[1]).toBe('"said ""hi"""');
  });
});

describe('parseCsv', () => {
  it('keys rows by lowercased, trimmed headers', () => {
    const { rows, headerError } = parseCsv(' Name ,AMOUNT\r\nlunch,50000\r\n', [
      'name',
      'amount',
    ]);
    expect(headerError).toBeNull();
    expect(rows).toEqual([{ name: 'lunch', amount: '50000' }]);
  });

  it('reports missing required headers', () => {
    const { headerError } = parseCsv('name\r\nlunch\r\n', [
      'name',
      'amount',
      'currency',
    ]);
    expect(headerError).toBe('Missing column(s): amount, currency');
  });

  it('skips empty lines', () => {
    const { rows } = parseCsv('name,amount\r\n\r\nlunch,1\r\n  \r\n', [
      'name',
      'amount',
    ]);
    expect(rows).toHaveLength(1);
  });
});

describe('isCurrencyCode', () => {
  it('accepts supported codes case-insensitively', () => {
    expect(isCurrencyCode('IDR')).toBe(true);
    expect(isCurrencyCode('idr')).toBe(true);
    expect(isCurrencyCode('usd')).toBe(true);
  });

  it('rejects unknown codes', () => {
    expect(isCurrencyCode('BTC')).toBe(false);
    expect(isCurrencyCode('')).toBe(false);
  });
});

describe('parseCsvDate', () => {
  it('pins date-only input to local noon so the day survives UTC round-trips', () => {
    const parsed = parseCsvDate('2026-06-21');
    expect(parsed).not.toBeNull();
    expect(parsed!.getFullYear()).toBe(2026);
    expect(parsed!.getMonth()).toBe(5);
    expect(parsed!.getDate()).toBe(21);
    expect(parsed!.getHours()).toBe(12);
  });

  it('parses full ISO timestamps as-is', () => {
    const parsed = parseCsvDate('2026-06-21T08:30:00Z');
    expect(parsed?.getTime()).toBe(Date.parse('2026-06-21T08:30:00Z'));
  });

  it('trims surrounding whitespace', () => {
    expect(parseCsvDate('  2026-06-21  ')?.getDate()).toBe(21);
  });

  it('returns null for empty or unparseable input', () => {
    expect(parseCsvDate('')).toBeNull();
    expect(parseCsvDate('   ')).toBeNull();
    expect(parseCsvDate('not a date')).toBeNull();
  });
});
