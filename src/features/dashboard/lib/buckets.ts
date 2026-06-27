import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isAfter,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { formatDate } from '@/lib/locale';
import type { BucketGranularity } from '../types';

// Auto-pick the time granularity for the trend charts from the range length, so
// short ranges read day-by-day and long ones don't render hundreds of bars.
export function pickBucket(from: Date, to: Date): BucketGranularity {
  const days = (to.getTime() - from.getTime()) / 86_400_000;
  if (days <= 31) return 'day';
  if (days <= 182) return 'week';
  return 'month';
}

function startOfBucket(date: Date, bucket: BucketGranularity): Date {
  if (bucket === 'day') return startOfDay(date);
  // Match Postgres date_trunc('week') which starts weeks on Monday.
  if (bucket === 'week') return startOfWeek(date, { weekStartsOn: 1 });
  return startOfMonth(date);
}

function nextBucket(date: Date, bucket: BucketGranularity): Date {
  if (bucket === 'day') return addDays(date, 1);
  if (bucket === 'week') return addWeeks(date, 1);
  return addMonths(date, 1);
}

// Every bucket start between `from` and `to` inclusive — used to zero-fill the
// gaps the RPC leaves (it only returns non-empty buckets).
export function enumerateBuckets(
  from: Date,
  to: Date,
  bucket: BucketGranularity
): Date[] {
  const out: Date[] = [];
  let cursor = startOfBucket(from, bucket);
  const end = startOfBucket(to, bucket);
  while (!isAfter(cursor, end)) {
    out.push(cursor);
    cursor = nextBucket(cursor, bucket);
  }
  return out;
}

// Stable key matching the RPC's `bucket date` (yyyy-MM-dd) so server rows merge
// onto the enumerated buckets.
export function bucketKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatBucketLabel(
  date: Date,
  bucket: BucketGranularity
): string {
  if (bucket === 'month') return formatDate(date, 'MMM yyyy');
  return formatDate(date, 'd MMM');
}

// Each calendar month the range touches, as {year, month} with month 1-12 — the
// shape budgets are keyed by (period_year, period_month).
export function monthsInRange(
  from: Date,
  to: Date
): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = [];
  let cursor = startOfMonth(from);
  const end = startOfMonth(to);
  while (!isAfter(cursor, end)) {
    out.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor = addMonths(cursor, 1);
  }
  return out;
}
