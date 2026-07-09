// Framework-free CSV mechanics shared by the expenses and incomes features:
// unparse + Blob download on the export side, parse + field coercers on the
// import side. No React, no Supabase — domain logic stays in each feature.

import Papa from 'papaparse';

import { CURRENCY_CODES, type CurrencyCode } from './fx';

// --- export side -----------------------------------------------------------

export type CsvCell = string | number;

// OWASP CSV-injection guard: a cell starting with = + - @ (or tab/CR) is
// executed as a formula when the file opens in Excel/Sheets, so user text like
// a `=HYPERLINK(...)` note would become live. A leading apostrophe makes
// spreadsheets read the cell as literal text. Numbers pass through untouched
// (negative amounts must stay numeric). The apostrophe survives a re-import —
// accepted trade-off; stripping it on import would create an ambiguity an
// attacker-crafted file could abuse.
function escapeFormulaCell(cell: CsvCell): CsvCell {
  if (typeof cell !== 'string') return cell;
  return /^[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell;
}

// Caller passes already-shaped plain rows; `columns` fixes header order. Papa
// handles quoting/escaping. CRLF + quoted fields keep Excel/Sheets happy.
export function toCsv<T extends Record<string, CsvCell>>(
  rows: T[],
  columns: readonly (keyof T & string)[]
): string {
  const data = rows.map((row) =>
    columns.map((col) => escapeFormulaCell(row[col]))
  );
  return Papa.unparse(
    { fields: columns as string[], data },
    { quotes: true, newline: '\r\n' }
  );
}

// Native Blob + anchor download. A UTF-8 BOM makes Excel read non-ASCII
// (notes, currency symbols) correctly instead of mojibake.
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(['﻿', csv], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- import side -----------------------------------------------------------

export type ParsedCsv = {
  rows: Record<string, string>[];
  headerError: string | null;
};

// Parse to objects keyed by (lowercased, trimmed) header. Synchronous — fine
// for the personal-finance scale we expect. `requiredHeaders` must already be
// lowercase; a missing one short-circuits the import with a header error.
export function parseCsv(
  text: string,
  requiredHeaders: readonly string[]
): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  const fields = result.meta.fields ?? [];
  const missing = requiredHeaders.filter((h) => !fields.includes(h));
  return {
    rows: result.data,
    headerError:
      missing.length > 0 ? `Missing column(s): ${missing.join(', ')}` : null,
  };
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(value.toUpperCase());
}

// Accepts ISO timestamps, date-only `YYYY-MM-DD`, or anything Date can parse.
// Date-only input is pinned to NOON LOCAL so the calendar day survives the
// later `toISOString()` round-trip in negative-offset timezones (a bare
// `new Date('2026-06-21')` parses as UTC midnight → previous day locally).
export function parseCsvDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(trimmed);
  const d = new Date(dateOnly ? `${trimmed}T12:00:00` : trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}
