import { endOfDay, endOfWeek, startOfDay, startOfWeek } from 'date-fns';
import type { Database } from '@rinciku/db';
import { activeDateFnsLocale, activeLocale } from './locale';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export type Cycle = {
  start: Date;
  end: Date;
};

export function getCurrentCycle(
  profile: Pick<ProfileRow, 'month_start_day'>,
  now: Date = new Date()
): Cycle {
  const day = clampDay(profile.month_start_day ?? 1);
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  let startYear = year;
  let startMonth = month;
  if (today < day) {
    startMonth = month - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }

  const start = new Date(startYear, startMonth, day, 0, 0, 0, 0);
  const nextStart = new Date(startYear, startMonth + 1, day, 0, 0, 0, 0);
  const end = new Date(nextStart.getTime() - 1);
  return { start, end };
}

export function getCycleLengthDays(cycle: Cycle): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.max(
    1,
    Math.round((cycle.end.getTime() - cycle.start.getTime()) / msPerDay)
  );
}

export function getDaysLeft(cycle: Cycle, now: Date = new Date()): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = cycle.end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / msPerDay));
}

export function getCycleLabel(cycle: Cycle): string {
  const monthFmt = new Intl.DateTimeFormat(activeLocale(), { month: 'short' });
  const startDay = cycle.start.getDate();
  const endDay = cycle.end.getDate();
  const startMonth = monthFmt.format(cycle.start);
  const endMonth = monthFmt.format(cycle.end);
  if (startMonth === endMonth) {
    return `${startDay}–${endDay} ${startMonth}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

// Preset periods for filtering dashboard/analytics views. `month` maps to the
// user's billing cycle (respecting month_start_day); the others are plain
// calendar windows. Week start follows the active language's locale (Sunday for
// en, Monday for id) via date-fns.
export type PeriodPreset = 'today' | 'week' | 'month' | 'custom';

export function getPeriodRange(
  preset: PeriodPreset,
  profile: Pick<ProfileRow, 'month_start_day'>,
  opts: { now?: Date; customFrom?: Date; customTo?: Date } = {}
): Cycle {
  const now = opts.now ?? new Date();
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week': {
      const locale = activeDateFnsLocale();
      return {
        start: startOfWeek(now, { locale }),
        end: endOfWeek(now, { locale }),
      };
    }
    case 'custom':
      return {
        start: startOfDay(opts.customFrom ?? now),
        end: endOfDay(opts.customTo ?? now),
      };
    case 'month':
    default:
      return getCurrentCycle(profile, now);
  }
}

function clampDay(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(28, Math.trunc(value)));
}
