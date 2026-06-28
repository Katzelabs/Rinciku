// Agent tooling for the ai-chat feature.
//
// The chat is a real agentic loop: the model can READ the user's finances
// (auto-executed here, client-side, reusing each feature's RLS-scoped api layer
// + the FX helpers) and WRITE to them (surfaced as a confirmation the user
// approves — never executed silently). Read tools run inside the loop; write
// tools (`propose_*`) end the turn with a card.
//
// Keeping the executors client-side reuses all existing aggregation + currency
// conversion instead of re-implementing it in the Deno edge function, which
// only needs to relay the model call and round-trip tool results.

import type { PostgrestError } from '@supabase/supabase-js';
import {
  convertToBase,
  ensureRates,
  getCurrentRates,
  CURRENCY_CODES,
  type CurrencyCode,
} from '@rinciku/core';
import { getCurrentCycle } from '@rinciku/core';
import type { Profile } from '@/features/auth';
import { getMonthlySummary } from '@/features/dashboard/api';
import {
  deleteExpense,
  listExpenses,
  updateExpense,
} from '@/features/expenses/api';
import {
  createIncomeCategory,
  deleteIncome,
  deleteIncomeCategory,
  listIncomeCategories,
  listIncomes,
  updateIncome,
  updateIncomeCategory,
} from '@/features/incomes/api';
import {
  createCategory,
  createTier,
  deleteCategory,
  deleteTier,
  listCategories,
  listTiers,
  updateCategory,
  updateTier,
} from '@/features/categories/api';
import {
  createEssential,
  deleteEssential,
  listEssentials,
  updateEssential,
} from '@/features/essentials/api';
import {
  deleteBudget,
  deleteTierBudget,
  getBudgetActuals,
  listBudgets,
  listTierBudgets,
  upsertBudget,
  upsertTierBudget,
} from '@/features/budgets/api';
import { TRANSACTION_TOOLS } from './api';
import { changeToolInputSchema } from './schemas';
import type {
  ChatResponse,
  ProposedChange,
  ToolDef,
  ToolUseBlock,
} from './types';

type ApplyResult = { error: PostgrestError | Error | null };

// --- Read tool definitions -------------------------------------------------

const DATE_RANGE_PROPS = {
  from: {
    type: 'string',
    description:
      'Start date (YYYY-MM-DD), inclusive. Omit to default to the current budget cycle.',
  },
  to: {
    type: 'string',
    description:
      'End date (YYYY-MM-DD), inclusive. Omit to default to the current budget cycle.',
  },
} as const;

export const READ_TOOLS: ToolDef[] = [
  {
    name: 'get_financial_overview',
    description:
      "Get the user's current budget snapshot: cycle dates, expected income, income received, total spent, remaining, essentials baseline + still-uncovered, spending per tier, and days left. Use this for affordability / on-track questions.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'query_expenses',
    description:
      'Look at the user\'s expenses. Use group_by="category" or "tier" to find where money goes (e.g. "what wastes my money most"); use group_by="none" to list individual expenses (needed to get ids before editing or deleting one). Amounts are converted to the base currency.',
    input_schema: {
      type: 'object',
      properties: {
        ...DATE_RANGE_PROPS,
        group_by: {
          type: 'string',
          enum: ['category', 'tier', 'none'],
          description: 'How to aggregate. Default "none" (individual rows).',
        },
        search: {
          type: 'string',
          description: 'Optional case-insensitive substring match on the note.',
        },
        category_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional filter to specific category ids.',
        },
        limit: {
          type: 'number',
          description: 'Max rows when group_by="none" (default 50).',
        },
      },
    },
  },
  {
    name: 'query_incomes',
    description:
      'Look at the user\'s income entries. Use group_by="source" to total income per source, or "none" to list individual entries (needed to get ids before editing or deleting one). Amounts are converted to the base currency.',
    input_schema: {
      type: 'object',
      properties: {
        ...DATE_RANGE_PROPS,
        group_by: {
          type: 'string',
          enum: ['source', 'none'],
          description: 'How to aggregate. Default "none".',
        },
        search: { type: 'string', description: 'Substring match on the note.' },
        limit: {
          type: 'number',
          description: 'Max rows when group_by="none" (default 50).',
        },
      },
    },
  },
  {
    name: 'list_categories',
    description:
      "List the user's expense categories with their id, tier, and color. Use to resolve a category name to an id, or before creating/editing categories.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_income_categories',
    description: "List the user's income sources/categories with id and color.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_tiers',
    description:
      'List spending tiers (e.g. Fixed / Needs / Wants) with id and whether each is essential. Categories belong to a tier.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_essentials',
    description:
      "List the user's monthly essential (non-negotiable) items with id, estimated amount, and category.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_budgets',
    description:
      'List per-category and per-tier budget targets for a calendar month, with target vs actual spend (base currency). Defaults to the current month.',
    input_schema: {
      type: 'object',
      properties: {
        year: { type: 'number', description: 'Calendar year, e.g. 2026.' },
        month: { type: 'number', description: 'Month 1-12.' },
      },
    },
  },
];

// --- Write tool definition (generic CRUD proposal) -------------------------

export const CHANGE_TOOL: ToolDef = {
  name: 'propose_change',
  description:
    'Propose creating, updating, or deleting a record for the user to confirm. Use for categories, income sources, essentials, budgets, tiers, and for EDITING or DELETING an existing expense/income (use propose_expense / propose_income to CREATE those). Always resolve real ids via the read tools FIRST. The change is NOT applied until the user confirms — never claim it is done.',
  input_schema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['create', 'update', 'delete'],
      },
      entity: {
        type: 'string',
        enum: [
          'expense',
          'income',
          'category',
          'income_category',
          'essential',
          'budget',
          'tier',
        ],
      },
      id: {
        type: 'string',
        description: 'Record id (required for update and delete).',
      },
      data: {
        type: 'object',
        description:
          'Fields to set (create/update). Examples — category: {name, tier_id?, color?}; essential: {name, estimated_amount, currency, category_id?}; budget: {category_id|tier_id, period_year, period_month, amount, currency}; expense: {amount?, currency?, category_id?, occurred_at?, note?}.',
      },
      summary: {
        type: 'string',
        description:
          'Short human-readable description of the change for the confirmation card, e.g. "Set Wants budget to Rp 1.500.000 for Jun 2026".',
      },
    },
    required: ['action', 'entity', 'summary'],
  },
};

// All tools handed to the model each turn: create-transaction cards, the
// generic change proposal, then the read tools.
export const AGENT_TOOLS: ToolDef[] = [
  ...TRANSACTION_TOOLS,
  CHANGE_TOOL,
  ...READ_TOOLS,
];

const READ_TOOL_NAMES = new Set(READ_TOOLS.map((t) => t.name));
const WRITE_TOOL_NAMES = new Set([
  'propose_expense',
  'propose_income',
  'propose_change',
]);

export function isReadTool(name: string): boolean {
  return READ_TOOL_NAMES.has(name);
}

export function isWriteTool(name: string): boolean {
  return WRITE_TOOL_NAMES.has(name);
}

// --- Read tool execution ---------------------------------------------------

type Input = Record<string, unknown>;

function baseOf(profile: Profile): CurrencyCode {
  return (profile.base_currency ?? 'IDR') as CurrencyCode;
}

function asCurrency(v: unknown, fallback: CurrencyCode): CurrencyCode {
  return typeof v === 'string' &&
    (CURRENCY_CODES as readonly string[]).includes(v)
    ? (v as CurrencyCode)
    : fallback;
}

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Resolves the [from, to] window from optional YYYY-MM-DD inputs, defaulting to
// the user's current budget cycle. occurred_at is timestamptz, so we return ISO
// timestamps spanning whole days.
function resolveWindow(
  profile: Profile,
  input: Input
): { startISO: string; endInclusiveISO: string; endExclusiveISO: string } {
  const cycle = getCurrentCycle(profile);
  const from = typeof input.from === 'string' ? input.from : null;
  const to = typeof input.to === 'string' ? input.to : null;
  const start = from ? new Date(`${from}T00:00:00`) : cycle.start;
  const end = to ? new Date(`${to}T23:59:59.999`) : cycle.end;
  return {
    startISO: start.toISOString(),
    endInclusiveISO: end.toISOString(),
    endExclusiveISO: new Date(end.getTime() + 1).toISOString(),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Dispatches a read tool to the matching api layer and returns a compact JSON
// string for the model. Never throws — failures come back as { error } so the
// model can recover within the loop.
export async function executeReadTool(
  name: string,
  rawInput: unknown,
  profile: Profile
): Promise<string> {
  const input: Input =
    rawInput && typeof rawInput === 'object' ? (rawInput as Input) : {};
  try {
    const result = await runReadTool(name, input, profile);
    return JSON.stringify(result);
  } catch (err) {
    return JSON.stringify({
      error: err instanceof Error ? err.message : 'Tool failed.',
    });
  }
}

async function runReadTool(
  name: string,
  input: Input,
  profile: Profile
): Promise<unknown> {
  const base = baseOf(profile);

  switch (name) {
    case 'get_financial_overview': {
      const { data, error } = await getMonthlySummary(profile);
      if (error || !data) throw error ?? new Error('No budget data.');
      return {
        base_currency: data.base_currency,
        cycle: { start: isoDay(data.cycle.start), end: isoDay(data.cycle.end) },
        days_left: data.days_left,
        expected_monthly_income: data.expected_monthly_income,
        income_received: data.income_received,
        spent_total: data.spent_total,
        remaining: data.remaining,
        essentials_baseline: data.baseline_total,
        essentials_uncovered: data.baseline_uncovered,
        uncategorized_spent: data.uncategorized_spent,
        spending_by_tier: data.tiers.map((t) => ({
          id: t.id,
          name: t.name,
          spent: round2(data.by_tier[t.id] ?? 0),
        })),
      };
    }

    case 'query_expenses': {
      await ensureRates();
      const win = resolveWindow(profile, input);
      const groupBy =
        typeof input.group_by === 'string' ? input.group_by : 'none';

      if (groupBy === 'category' || groupBy === 'tier') {
        const [actualsRes, catsRes, tiersRes] = await Promise.all([
          getBudgetActuals(
            win.startISO,
            win.endExclusiveISO,
            base,
            getCurrentRates()
          ),
          listCategories(),
          listTiers(),
        ]);
        if (actualsRes.error) throw actualsRes.error;
        const actuals = actualsRes.data;
        if (groupBy === 'category') {
          const cats = catsRes.data ?? [];
          const breakdown = cats
            .map((c) => ({
              id: c.id,
              name: c.name,
              amount_base: round2(actuals?.by_category[c.id] ?? 0),
            }))
            .filter((x) => x.amount_base > 0)
            .sort((a, b) => b.amount_base - a.amount_base);
          return {
            base_currency: base,
            group_by: 'category',
            window: {
              from: isoDay(new Date(win.startISO)),
              to: input.to ?? null,
            },
            total_base: round2(
              breakdown.reduce((s, x) => s + x.amount_base, 0)
            ),
            breakdown,
          };
        }
        const tiers = tiersRes.data ?? [];
        const breakdown = tiers
          .map((t) => ({
            id: t.id,
            name: t.name,
            amount_base: round2(actuals?.by_tier[t.id] ?? 0),
          }))
          .filter((x) => x.amount_base > 0)
          .sort((a, b) => b.amount_base - a.amount_base);
        return {
          base_currency: base,
          group_by: 'tier',
          total_base: round2(breakdown.reduce((s, x) => s + x.amount_base, 0)),
          breakdown,
        };
      }

      const limit =
        typeof input.limit === 'number' && input.limit > 0
          ? Math.min(input.limit, 200)
          : 50;
      const { data, error } = await listExpenses({
        from: win.startISO,
        to: win.endInclusiveISO,
        categoryIds: Array.isArray(input.category_ids)
          ? (input.category_ids as string[])
          : undefined,
        search: typeof input.search === 'string' ? input.search : undefined,
        limit,
        offset: 0,
      });
      if (error) throw error;
      const rows = (data ?? []).map((e) => ({
        id: e.id,
        amount: e.amount,
        currency: e.currency,
        amount_base: convertToBase(
          Number(e.amount),
          e.currency as CurrencyCode,
          base
        ).amount_base,
        category: e.category?.name ?? null,
        category_id: e.category_id,
        occurred_at: isoDay(new Date(e.occurred_at)),
        note: e.note,
      }));
      return {
        base_currency: base,
        count: rows.length,
        total_base: round2(rows.reduce((s, r) => s + r.amount_base, 0)),
        expenses: rows,
      };
    }

    case 'query_incomes': {
      await ensureRates();
      const win = resolveWindow(profile, input);
      const limit =
        typeof input.limit === 'number' && input.limit > 0
          ? Math.min(input.limit, 500)
          : typeof input.group_by === 'string' && input.group_by === 'source'
            ? 500
            : 50;
      const { data, error } = await listIncomes({
        from: win.startISO,
        to: win.endInclusiveISO,
        search: typeof input.search === 'string' ? input.search : undefined,
        limit,
        offset: 0,
      });
      if (error) throw error;
      const rows = (data ?? []).map((i) => ({
        id: i.id,
        amount: i.amount,
        currency: i.currency,
        amount_base: convertToBase(
          Number(i.amount),
          i.currency as CurrencyCode,
          base
        ).amount_base,
        source: i.category?.name ?? null,
        source_id: i.source_id,
        occurred_at: isoDay(new Date(i.occurred_at)),
        note: i.note,
      }));

      if (input.group_by === 'source') {
        const byName = new Map<string, number>();
        for (const r of rows) {
          const key = r.source ?? 'Uncategorized';
          byName.set(key, (byName.get(key) ?? 0) + r.amount_base);
        }
        const breakdown = [...byName.entries()]
          .map(([source, amount_base]) => ({
            source,
            amount_base: round2(amount_base),
          }))
          .sort((a, b) => b.amount_base - a.amount_base);
        return {
          base_currency: base,
          group_by: 'source',
          total_base: round2(rows.reduce((s, r) => s + r.amount_base, 0)),
          breakdown,
        };
      }
      return {
        base_currency: base,
        count: rows.length,
        total_base: round2(rows.reduce((s, r) => s + r.amount_base, 0)),
        incomes: rows,
      };
    }

    case 'list_categories': {
      const [catsRes, tiersRes] = await Promise.all([
        listCategories(),
        listTiers(),
      ]);
      if (catsRes.error) throw catsRes.error;
      const tierName = new Map(
        (tiersRes.data ?? []).map((t) => [t.id, t.name])
      );
      return {
        categories: (catsRes.data ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          tier_id: c.tier_id,
          tier: c.tier_id ? (tierName.get(c.tier_id) ?? null) : null,
          color: c.color,
        })),
      };
    }

    case 'list_income_categories': {
      const { data, error } = await listIncomeCategories();
      if (error) throw error;
      return {
        income_categories: (data ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
        })),
      };
    }

    case 'list_tiers': {
      const { data, error } = await listTiers();
      if (error) throw error;
      return {
        tiers: (data ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          is_essential: t.is_essential,
          color: t.color,
        })),
      };
    }

    case 'list_essentials': {
      const { data, error } = await listEssentials();
      if (error) throw error;
      await ensureRates();
      return {
        base_currency: base,
        essentials: (data ?? []).map((e) => ({
          id: e.id,
          name: e.name,
          estimated_amount: e.estimated_amount,
          currency: e.currency,
          amount_base: convertToBase(
            Number(e.estimated_amount),
            e.currency as CurrencyCode,
            base
          ).amount_base,
          category: e.category?.name ?? null,
          is_active: e.is_active,
        })),
      };
    }

    case 'list_budgets': {
      await ensureRates();
      const now = new Date();
      const year =
        typeof input.year === 'number' ? input.year : now.getFullYear();
      const month =
        typeof input.month === 'number' ? input.month : now.getMonth() + 1;
      const startISO = new Date(Date.UTC(year, month - 1, 1)).toISOString();
      const endExclusiveISO = new Date(Date.UTC(year, month, 1)).toISOString();
      const [budgetsRes, tierBudgetsRes, actualsRes, catsRes, tiersRes] =
        await Promise.all([
          listBudgets(year, month),
          listTierBudgets(year, month),
          getBudgetActuals(startISO, endExclusiveISO, base, getCurrentRates()),
          listCategories(),
          listTiers(),
        ]);
      if (budgetsRes.error) throw budgetsRes.error;
      if (tierBudgetsRes.error) throw tierBudgetsRes.error;
      const catName = new Map((catsRes.data ?? []).map((c) => [c.id, c.name]));
      const tierName = new Map(
        (tiersRes.data ?? []).map((t) => [t.id, t.name])
      );
      const actuals = actualsRes.data;
      return {
        base_currency: base,
        period: { year, month },
        category_budgets: (budgetsRes.data ?? []).map((b) => ({
          id: b.id,
          category_id: b.category_id,
          category: catName.get(b.category_id) ?? null,
          target_base: round2(
            convertToBase(Number(b.amount), b.currency as CurrencyCode, base)
              .amount_base
          ),
          actual_base: round2(actuals?.by_category[b.category_id] ?? 0),
        })),
        tier_budgets: (tierBudgetsRes.data ?? []).map((b) => ({
          id: b.id,
          tier_id: b.tier_id,
          tier: tierName.get(b.tier_id) ?? null,
          target_base: round2(
            convertToBase(Number(b.amount), b.currency as CurrencyCode, base)
              .amount_base
          ),
          actual_base: round2(actuals?.by_tier[b.tier_id] ?? 0),
        })),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// --- Write proposal parsing + application ----------------------------------

export function parseChange(res: ChatResponse): ProposedChange | null {
  const block = (res.content ?? []).find(
    (b): b is ToolUseBlock =>
      b.type === 'tool_use' && b.name === 'propose_change'
  );
  if (!block) return null;
  const parsed = changeToolInputSchema.safeParse(block.input);
  if (!parsed.success) return null;
  const v = parsed.data;
  return {
    action: v.action,
    entity: v.entity,
    id: v.id ?? null,
    data: (v.data ?? null) as Record<string, unknown> | null,
    summary: v.summary,
  };
}

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined;
const strOrNull = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v.trim() : null;
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

// Applies a confirmed change by dispatching to the owning feature's api layer.
// Light coercion here; RLS + DB constraints are the final guard. Returns the
// PostgrestError/Error (or null on success).
export async function applyProposedChange(
  change: ProposedChange,
  userId: string,
  base: CurrencyCode
): Promise<ApplyResult> {
  const { action, entity, id } = change;
  const data = change.data ?? {};

  const needId = (): string => {
    if (!id) throw new Error('This change needs a record id.');
    return id;
  };

  try {
    switch (entity) {
      case 'expense':
        if (action === 'delete') return await deleteExpense(needId());
        if (action === 'update')
          return await updateExpense(needId(), {
            ...(num(data.amount) !== undefined
              ? { amount: num(data.amount) }
              : {}),
            ...(str(data.currency)
              ? { currency: asCurrency(data.currency, base) }
              : {}),
            ...(data.category_id !== undefined
              ? { category_id: strOrNull(data.category_id) }
              : {}),
            ...(str(data.occurred_at)
              ? { occurred_at: str(data.occurred_at) }
              : {}),
            ...(data.note !== undefined ? { note: strOrNull(data.note) } : {}),
          });
        // create handled by propose_expense; fall through to unsupported.
        break;

      case 'income':
        if (action === 'delete') return await deleteIncome(needId());
        if (action === 'update')
          return await updateIncome(needId(), {
            ...(num(data.amount) !== undefined
              ? { amount: num(data.amount) }
              : {}),
            ...(str(data.currency)
              ? { currency: asCurrency(data.currency, base) }
              : {}),
            ...(data.source_id !== undefined
              ? { source_id: strOrNull(data.source_id) }
              : {}),
            ...(str(data.occurred_at)
              ? { occurred_at: str(data.occurred_at) }
              : {}),
            ...(data.note !== undefined ? { note: strOrNull(data.note) } : {}),
          });
        break;

      case 'category':
        if (action === 'delete') return await deleteCategory(needId());
        if (action === 'create') {
          const name = str(data.name);
          if (!name) throw new Error('Category needs a name.');
          return await createCategory({
            user_id: userId,
            name,
            tier_id: strOrNull(data.tier_id),
            icon: strOrNull(data.icon),
            color: strOrNull(data.color),
          });
        }
        return await updateCategory(needId(), {
          ...(str(data.name) ? { name: str(data.name) } : {}),
          ...(data.tier_id !== undefined
            ? { tier_id: strOrNull(data.tier_id) }
            : {}),
          ...(data.icon !== undefined ? { icon: strOrNull(data.icon) } : {}),
          ...(data.color !== undefined ? { color: strOrNull(data.color) } : {}),
        });

      case 'income_category':
        if (action === 'delete') return await deleteIncomeCategory(needId());
        if (action === 'create') {
          const name = str(data.name);
          if (!name) throw new Error('Income source needs a name.');
          return await createIncomeCategory({
            user_id: userId,
            name,
            icon: strOrNull(data.icon),
            color: strOrNull(data.color),
          });
        }
        return await updateIncomeCategory(needId(), {
          ...(str(data.name) ? { name: str(data.name) } : {}),
          ...(data.icon !== undefined ? { icon: strOrNull(data.icon) } : {}),
          ...(data.color !== undefined ? { color: strOrNull(data.color) } : {}),
        });

      case 'essential':
        if (action === 'delete') return await deleteEssential(needId());
        if (action === 'create') {
          const name = str(data.name);
          const amount = num(data.estimated_amount);
          if (!name || amount === undefined)
            throw new Error('Essential needs a name and estimated amount.');
          return await createEssential({
            user_id: userId,
            name,
            estimated_amount: amount,
            currency: asCurrency(data.currency, base),
            category_id: strOrNull(data.category_id),
            is_active:
              typeof data.is_active === 'boolean' ? data.is_active : true,
          });
        }
        return await updateEssential(needId(), {
          ...(str(data.name) ? { name: str(data.name) } : {}),
          ...(num(data.estimated_amount) !== undefined
            ? { estimated_amount: num(data.estimated_amount) }
            : {}),
          ...(str(data.currency)
            ? { currency: asCurrency(data.currency, base) }
            : {}),
          ...(data.category_id !== undefined
            ? { category_id: strOrNull(data.category_id) }
            : {}),
          ...(typeof data.is_active === 'boolean'
            ? { is_active: data.is_active }
            : {}),
        });

      case 'tier':
        if (action === 'delete') return await deleteTier(needId());
        if (action === 'create') {
          const name = str(data.name);
          if (!name) throw new Error('Tier needs a name.');
          return await createTier({
            user_id: userId,
            name,
            color: str(data.color) ?? '#94a3b8',
            is_essential:
              typeof data.is_essential === 'boolean'
                ? data.is_essential
                : false,
          });
        }
        return await updateTier(needId(), {
          ...(str(data.name) ? { name: str(data.name) } : {}),
          ...(str(data.color) ? { color: str(data.color) } : {}),
          ...(typeof data.is_essential === 'boolean'
            ? { is_essential: data.is_essential }
            : {}),
        });

      case 'budget': {
        // A "budget" is either a per-category or per-tier target. Tier scope is
        // signalled by a tier_id (create/update) or data.scope === 'tier'.
        const isTier = str(data.tier_id) !== undefined || data.scope === 'tier';
        if (action === 'delete')
          return isTier
            ? await deleteTierBudget(needId())
            : await deleteBudget(needId());

        const now = new Date();
        const period_year = num(data.period_year) ?? now.getFullYear();
        const period_month = num(data.period_month) ?? now.getMonth() + 1;
        const amount = num(data.amount);
        if (amount === undefined) throw new Error('Budget needs an amount.');
        const currency = asCurrency(data.currency, base);
        if (isTier) {
          const tier_id = str(data.tier_id);
          if (!tier_id) throw new Error('Tier budget needs a tier_id.');
          return await upsertTierBudget({
            user_id: userId,
            tier_id,
            period_year,
            period_month,
            amount,
            currency,
          });
        }
        const category_id = str(data.category_id);
        if (!category_id)
          throw new Error('Category budget needs a category_id.');
        return await upsertBudget({
          user_id: userId,
          category_id,
          period_year,
          period_month,
          amount,
          currency,
        });
      }
    }
    return {
      error: new Error(
        `Cannot ${action} a ${entity} this way. Use propose_expense / propose_income to create transactions.`
      ),
    };
  } catch (err) {
    return { error: err instanceof Error ? err : new Error('Change failed.') };
  }
}
