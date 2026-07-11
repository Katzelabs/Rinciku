// The export_transactions tool: pure parsing + the executors that resolve
// ground-truth stats for the card and build the actual files after the user
// confirms. Terminal write-style routing (see EXPORT_TOOL in agent-tools.ts);
// nothing here runs inside the model loop.
//
// Column contract matches the manual export dialogs (apps/*/features/
// {expenses,incomes}/lib/csv-export.ts): amounts stay in their ORIGINAL
// currency so a CSV round-trips losslessly back through import. For incomes
// the `category` column carries the income-source name.

import type { PostgrestError } from '@supabase/supabase-js';
import {
  convertToBase,
  ensureRates,
  toCsv,
  type CsvCell,
  type CurrencyCode,
} from '@rinciku/core';

import type { Profile } from '../auth';
import { resolveWindow, type AgentToolApis } from './agent-tools';
import { exportToolInputSchema } from './schemas';
import type {
  ChatResponse,
  ExportFile,
  ExportFormat,
  ExportStats,
  ProposedExport,
  ToolUseBlock,
} from './types';

type Result<T> = { data: T | null; error: PostgrestError | Error | null };

// Same cap as the manual export dialogs (EXPORT_ROW_CAP).
const EXPORT_ROW_CAP = 10000;

const COLUMNS = [
  'date',
  'amount',
  'currency',
  'category',
  'note',
  'source',
] as const;

// --- Pure parsing -----------------------------------------------------------

export function parseExport(res: ChatResponse): ProposedExport | null {
  const block = (res.content ?? []).find(
    (b): b is ToolUseBlock =>
      b.type === 'tool_use' && b.name === 'export_transactions'
  );
  if (!block) return null;
  const parsed = exportToolInputSchema.safeParse(block.input);
  if (!parsed.success) return null;
  return {
    kind: parsed.data.kind,
    from: parsed.data.from ?? null,
    to: parsed.data.to ?? null,
  };
}

// Fallback display text persisted for the assistant turn (the card itself is
// session-state only, mirroring change proposals).
export function summarizeExport(p: ProposedExport): string {
  const what = p.kind === 'both' ? 'expenses and incomes' : (p.kind as string);
  const range =
    p.window ??
    (p.from || p.to ? { from: p.from ?? '…', to: p.to ?? '…' } : null);
  const tail = range
    ? ` from ${range.from} to ${range.to}`
    : ' for the current cycle';
  return `Prepared an export of your ${what}${tail} — review and download it below.`;
}

// --- Executors (bound to injected apis) -------------------------------------

export function createExportTools(apis: AgentToolApis) {
  const { expenses, incomes } = apis;

  function baseOf(profile: Profile): CurrencyCode {
    return (profile.base_currency ?? 'IDR') as CurrencyCode;
  }

  // LOCAL calendar day, matching the manual export dialogs (date-fns format).
  // Slicing the ISO string would use the UTC day — off by one for evening/
  // morning timestamps in non-UTC timezones (e.g. UTC+7).
  function isoDay(iso: string): string {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Attaches the resolved date window + ground-truth row counts/totals so the
  // card shows real numbers ("43 expenses · Rp 3.2jt"), not the model's claim.
  // Count failures degrade to null (card shows "count unavailable") — nothing
  // destructive rides on this, so no fail-closed gate like resolveChangeTarget.
  async function resolveExport(
    p: ProposedExport,
    profile: Profile
  ): Promise<ProposedExport> {
    const base = baseOf(profile);
    const win = resolveWindow(profile, { from: p.from, to: p.to });
    const window = {
      from: isoDay(win.startISO),
      to: isoDay(win.endInclusiveISO),
    };

    const sumRows = (
      rows: { amount: unknown; currency: string }[] | null
    ): { count: number; total_base: number } | null => {
      if (!rows) return null;
      const total = rows.reduce(
        (s, r) =>
          s +
          convertToBase(Number(r.amount), r.currency as CurrencyCode, base)
            .amount_base,
        0
      );
      return { count: rows.length, total_base: Math.round(total * 100) / 100 };
    };

    const stats: ExportStats = { expenses: null, incomes: null };
    try {
      await ensureRates();
      const [expRes, incRes] = await Promise.all([
        p.kind !== 'incomes'
          ? expenses.sumExpenses({
              from: win.startISO,
              to: win.endInclusiveISO,
            })
          : Promise.resolve(null),
        p.kind !== 'expenses'
          ? incomes.sumIncomes({ from: win.startISO, to: win.endInclusiveISO })
          : Promise.resolve(null),
      ]);
      stats.expenses = expRes && !expRes.error ? sumRows(expRes.data) : null;
      stats.incomes = incRes && !incRes.error ? sumRows(incRes.data) : null;
    } catch {
      // stats stay null — the card degrades gracefully.
    }
    return { ...p, window, stats };
  }

  type ShapedRows = {
    label: 'expenses' | 'incomes';
    rows: Record<string, CsvCell>[];
  };

  async function fetchRows(
    p: ProposedExport,
    profile: Profile
  ): Promise<ShapedRows[]> {
    const win = resolveWindow(profile, { from: p.from, to: p.to });
    const shaped: ShapedRows[] = [];

    if (p.kind !== 'incomes') {
      const { data, error } = await expenses.listExpenses({
        from: win.startISO,
        to: win.endInclusiveISO,
        limit: EXPORT_ROW_CAP,
        offset: 0,
      });
      if (error) throw error;
      shaped.push({
        label: 'expenses',
        rows: (data ?? []).map((row) => ({
          date: isoDay(row.occurred_at),
          amount: Number(row.amount),
          currency: row.currency,
          category: row.category?.name ?? '',
          note: row.note ?? '',
          source: row.source,
        })),
      });
    }
    if (p.kind !== 'expenses') {
      const { data, error } = await incomes.listIncomes({
        from: win.startISO,
        to: win.endInclusiveISO,
        limit: EXPORT_ROW_CAP,
        offset: 0,
      });
      if (error) throw error;
      shaped.push({
        label: 'incomes',
        rows: (data ?? []).map((row) => ({
          date: isoDay(row.occurred_at),
          amount: Number(row.amount),
          currency: row.currency,
          category: row.category?.name ?? '',
          note: row.note ?? '',
          source: row.source,
        })),
      });
    }
    return shaped;
  }

  // Builds a per-category totals summary (base currency) for the xlsx Summary
  // sheet. Plain arithmetic over the already-fetched rows — no extra queries.
  function summarySheetRows(
    shaped: ShapedRows[],
    base: CurrencyCode
  ): Record<string, CsvCell>[] {
    const out: Record<string, CsvCell>[] = [];
    for (const { label, rows } of shaped) {
      const byCategory = new Map<string, number>();
      let total = 0;
      for (const r of rows) {
        const inBase = convertToBase(
          Number(r.amount),
          r.currency as CurrencyCode,
          base
        ).amount_base;
        total += inBase;
        const key = (r.category as string) || '(uncategorized)';
        byCategory.set(key, (byCategory.get(key) ?? 0) + inBase);
      }
      out.push({
        section: label,
        category: 'TOTAL',
        [`amount_${base}`]: Math.round(total * 100) / 100,
      });
      for (const [category, amount] of [...byCategory.entries()].sort(
        (a, b) => b[1] - a[1]
      )) {
        out.push({
          section: label,
          category,
          [`amount_${base}`]: Math.round(amount * 100) / 100,
        });
      }
    }
    return out;
  }

  // Generates the confirmed export. CSV: one file per kind (CSV has no
  // sheets). XLSX: one workbook — Expenses / Incomes sheets + a Summary tab
  // with totals and per-category breakdown in the base currency. SheetJS is
  // imported lazily so its ~800 KB never loads until an export actually runs.
  async function buildExportFiles(
    p: ProposedExport,
    profile: Profile,
    format: ExportFormat
  ): Promise<Result<ExportFile[]>> {
    try {
      const base = baseOf(profile);
      const win = resolveWindow(profile, { from: p.from, to: p.to });
      const rangeTag = `${isoDay(win.startISO)}_${isoDay(win.endInclusiveISO)}`;
      const shaped = await fetchRows(p, profile);

      if (format === 'csv') {
        return {
          data: shaped.map(({ label, rows }) => ({
            filename: `${label}-${rangeTag}.csv`,
            kind: 'csv' as const,
            data: toCsv(rows, COLUMNS),
          })),
          error: null,
        };
      }

      await ensureRates();
      const { toXlsxBase64 } = await import('@rinciku/core/xlsx');
      const summaryBase = `amount_${base}`;
      const sheets = [
        ...shaped.map(({ label, rows }) => ({
          name: label === 'expenses' ? 'Expenses' : 'Incomes',
          rows,
          columns: COLUMNS,
        })),
        {
          name: 'Summary',
          rows: summarySheetRows(shaped, base),
          columns: ['section', 'category', summaryBase] as const,
        },
      ];
      return {
        data: [
          {
            filename: `rinciku-export-${rangeTag}.xlsx`,
            kind: 'xlsx' as const,
            data: toXlsxBase64(sheets),
          },
        ],
        error: null,
      };
    } catch (err) {
      return {
        data: null,
        error: err instanceof Error ? err : new Error('Export failed.'),
      };
    }
  }

  return { resolveExport, buildExportFiles };
}

export type ExportTools = ReturnType<typeof createExportTools>;
