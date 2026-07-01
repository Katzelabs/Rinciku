// Groups a flat, already date-sorted list of transactions (expenses or incomes)
// into per-day sections for the redesigned list screens. Pure + presentation-
// agnostic: the caller supplies how to read each row's date, its base-currency
// amount (so the per-day subtotal stays in one currency), and the localized day
// labels. Input order is preserved, so pass rows already sorted newest-first.

export type TxnGroup<T> = {
  /** Stable local calendar-day key (YYYY-MM-DD). */
  key: string;
  /** Localized heading, e.g. "Today", "Yesterday", or a formatted date. */
  label: string;
  rows: T[];
  /** Sum of the group's rows, in the base currency. */
  subtotal: number;
};

export type DayLabels = {
  today: string;
  yesterday: string;
  /** Formats any other day (e.g. via `formatDate(d, 'PP')`). */
  format: (date: Date) => string;
};

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function labelForDay(date: Date, labels: DayLabels): string {
  const now = new Date();
  const todayKey = dayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const key = dayKey(date);
  if (key === todayKey) return labels.today;
  if (key === dayKey(yesterday)) return labels.yesterday;
  return labels.format(date);
}

export function groupByDay<T>(
  rows: T[],
  getDate: (row: T) => Date,
  getBaseAmount: (row: T) => number,
  labels: DayLabels
): TxnGroup<T>[] {
  const groups: TxnGroup<T>[] = [];
  const byKey = new Map<string, TxnGroup<T>>();

  for (const row of rows) {
    const date = getDate(row);
    const key = dayKey(date);
    let group = byKey.get(key);
    if (!group) {
      group = { key, label: labelForDay(date, labels), rows: [], subtotal: 0 };
      byKey.set(key, group);
      groups.push(group);
    }
    group.rows.push(row);
    group.subtotal += getBaseAmount(row);
  }

  return groups;
}
