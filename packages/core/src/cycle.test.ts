import { describe, expect, it } from 'vitest';
import {
  getCurrentCycle,
  getCycleLabel,
  getCycleLengthDays,
  getDaysLeft,
  getPeriodRange,
} from './cycle';

// All tests pass an explicit `now` — cycle math must be deterministic.
// Without an initialized i18next, label/locale helpers fall back to en-US.

const d = (y: number, m: number, day: number, h = 0, min = 0) =>
  new Date(y, m - 1, day, h, min, 0, 0);

describe('getCurrentCycle', () => {
  it('starts this month when today is on/after month_start_day', () => {
    const { start, end } = getCurrentCycle(
      { month_start_day: 25 },
      d(2026, 7, 25)
    );
    expect(start).toEqual(d(2026, 7, 25));
    expect(end).toEqual(new Date(d(2026, 8, 25).getTime() - 1));
  });

  it('starts last month when today is before month_start_day', () => {
    const { start, end } = getCurrentCycle(
      { month_start_day: 25 },
      d(2026, 7, 14)
    );
    expect(start).toEqual(d(2026, 6, 25));
    expect(end).toEqual(new Date(d(2026, 7, 25).getTime() - 1));
  });

  it('rolls back across the year boundary in January', () => {
    const { start, end } = getCurrentCycle(
      { month_start_day: 25 },
      d(2026, 1, 10)
    );
    expect(start).toEqual(d(2025, 12, 25));
    expect(end).toEqual(new Date(d(2026, 1, 25).getTime() - 1));
  });

  it('covers the calendar month for month_start_day 1', () => {
    const { start, end } = getCurrentCycle(
      { month_start_day: 1 },
      d(2026, 7, 14)
    );
    expect(start).toEqual(d(2026, 7, 1));
    expect(end).toEqual(new Date(d(2026, 8, 1).getTime() - 1));
  });

  it('treats null month_start_day as 1 (runtime guard beyond the row type)', () => {
    const { start } = getCurrentCycle(
      { month_start_day: null as unknown as number },
      d(2026, 7, 14)
    );
    expect(start).toEqual(d(2026, 7, 1));
  });

  it('clamps out-of-range start days into 1..28', () => {
    expect(
      getCurrentCycle({ month_start_day: 31 }, d(2026, 7, 30)).start
    ).toEqual(d(2026, 7, 28));
    expect(
      getCurrentCycle({ month_start_day: 0 }, d(2026, 7, 14)).start
    ).toEqual(d(2026, 7, 1));
    expect(
      getCurrentCycle({ month_start_day: NaN }, d(2026, 7, 14)).start
    ).toEqual(d(2026, 7, 1));
  });
});

describe('getCycleLengthDays', () => {
  it('is 31 for a 31-day month', () => {
    const cycle = getCurrentCycle({ month_start_day: 1 }, d(2026, 7, 14));
    expect(getCycleLengthDays(cycle)).toBe(31);
  });

  it('is 28 for February in a non-leap year', () => {
    const cycle = getCurrentCycle({ month_start_day: 1 }, d(2026, 2, 10));
    expect(getCycleLengthDays(cycle)).toBe(28);
  });

  it('spans month lengths correctly for mid-month starts', () => {
    // Feb 25 – Mar 24 2026: 4 days of Feb + 24 of Mar = 28
    const cycle = getCurrentCycle({ month_start_day: 25 }, d(2026, 3, 10));
    expect(getCycleLengthDays(cycle)).toBe(28);
  });
});

describe('getDaysLeft', () => {
  it('counts remaining days including today', () => {
    const cycle = getCurrentCycle({ month_start_day: 1 }, d(2026, 7, 14));
    expect(getDaysLeft(cycle, d(2026, 7, 14))).toBe(18); // 14th → 31st
  });

  it('is 1 on the last day of the cycle', () => {
    const cycle = getCurrentCycle({ month_start_day: 1 }, d(2026, 7, 14));
    expect(getDaysLeft(cycle, d(2026, 7, 31, 12, 0))).toBe(1);
  });

  it('never goes negative after the cycle ends', () => {
    const cycle = getCurrentCycle({ month_start_day: 1 }, d(2026, 7, 14));
    expect(getDaysLeft(cycle, d(2026, 8, 5))).toBe(0);
  });
});

describe('getCycleLabel', () => {
  it('labels a cross-month cycle with both months', () => {
    const cycle = getCurrentCycle({ month_start_day: 25 }, d(2026, 7, 14));
    expect(getCycleLabel(cycle)).toBe('25 Jun – 24 Jul');
  });

  it('collapses the month when start and end share it', () => {
    const cycle = getCurrentCycle({ month_start_day: 1 }, d(2026, 7, 14));
    expect(getCycleLabel(cycle)).toBe('1–31 Jul');
  });
});

describe('getPeriodRange', () => {
  const profile = { month_start_day: 25 };

  it('today spans the local calendar day', () => {
    const now = d(2026, 7, 14, 15, 30);
    const { start, end } = getPeriodRange('today', profile, { now });
    expect(start).toEqual(d(2026, 7, 14));
    expect(end).toEqual(new Date(d(2026, 7, 15).getTime() - 1));
  });

  it('week is a 7-day window containing now', () => {
    const now = d(2026, 7, 14);
    const { start, end } = getPeriodRange('week', profile, { now });
    expect(start.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(end.getTime()).toBeGreaterThanOrEqual(now.getTime());
    expect(getCycleLengthDays({ start, end })).toBe(7);
  });

  it('month delegates to the billing cycle', () => {
    const now = d(2026, 7, 14);
    expect(getPeriodRange('month', profile, { now })).toEqual(
      getCurrentCycle(profile, now)
    );
  });

  it('custom spans whole days from customFrom to customTo', () => {
    const { start, end } = getPeriodRange('custom', profile, {
      now: d(2026, 7, 14),
      customFrom: d(2026, 7, 1, 10, 0),
      customTo: d(2026, 7, 10, 10, 0),
    });
    expect(start).toEqual(d(2026, 7, 1));
    expect(end).toEqual(new Date(d(2026, 7, 11).getTime() - 1));
  });
});
