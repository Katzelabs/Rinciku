// FX rate map and currency allow-list. Rates are expressed as
//   currentRates[code] = how many IDR per 1 unit of `code`
// so IDR itself is always 1. `convertToBase` pivots through IDR.
//
// Source order, walked top-down by `ensureRates()`:
//   1. live  — GET https://open.er-api.com/v6/latest/IDR (no API key)
//   2. cache — localStorage `rinciku.fx.v1`, 24h TTL
//   3. stub  — FX_STUB below, frozen snapshot dated 2026-06-09
//
// `convertToBase` stays sync and reads the module's `currentRates`. The
// dashboard awaits `ensureRates()` before the SQL call so its `p_rates`
// jsonb argument reflects whatever the cache+live walk produced. The
// `<FxBanner />` reacts to `useFxStatus()` so the user knows when totals
// are computed from cache-or-stub rather than fresh rates.

export const CURRENCY_CODES = [
  'IDR',
  'USD',
  'EUR',
  'JPY',
  'GBP',
  'SGD',
  'MYR',
  'AUD',
  'CAD',
  'CNY',
  'KRW',
  'HKD',
  'THB',
  'PHP',
  'INR',
  'VND',
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export type RateMap = Record<CurrencyCode, number>;

export const FX_STUB_DATE = '2026-06-09';

export const FX_STUB: RateMap = {
  IDR: 1,
  USD: 16200,
  EUR: 17500,
  JPY: 105,
  GBP: 20500,
  SGD: 12000,
  MYR: 3500,
  AUD: 10700,
  CAD: 11900,
  CNY: 2240,
  KRW: 11.8,
  HKD: 2080,
  THB: 460,
  PHP: 285,
  INR: 192,
  VND: 0.64,
};

const CACHE_KEY = 'rinciku.fx.v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SOURCE_URL = 'https://open.er-api.com/v6/latest/IDR';

export type FxSource = 'live' | 'cache' | 'stub';

export type FxStatus = {
  source: FxSource;
  stale: boolean;
  lastFetchedAt: string | null;
  sourceUnix: number | null;
  stubDate: string;
  lastError: string | null;
};

type CachePayload = {
  rates: RateMap;
  fetched_at: string;
  source_unix: number;
};

type ApiResponse =
  | {
      result: 'success';
      time_last_update_unix: number;
      base_code: string;
      rates: Record<string, number>;
    }
  | { result: 'error'; 'error-type'?: string };

let currentRates: RateMap = { ...FX_STUB };
let currentSource: FxSource = 'stub';
let lastFetchedAt: string | null = null;
let lastSourceUnix: number | null = null;
let lastError: string | null = null;
let inflight: Promise<FxStatus> | null = null;

const listeners = new Set<() => void>();

function isStale(fetchedAt: string | null): boolean {
  if (!fetchedAt) return true;
  const ts = Date.parse(fetchedAt);
  if (Number.isNaN(ts)) return true;
  return Date.now() - ts > CACHE_TTL_MS;
}

function computeSnapshot(): FxStatus {
  return {
    source: currentSource,
    stale: currentSource !== 'stub' && isStale(lastFetchedAt),
    lastFetchedAt,
    sourceUnix: lastSourceUnix,
    stubDate: FX_STUB_DATE,
    lastError,
  };
}

let snapshot: FxStatus = computeSnapshot();

function emit(): void {
  snapshot = computeSnapshot();
  for (const listener of listeners) listener();
}

function loadFromCache(): CachePayload | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CachePayload>;
    if (!parsed || typeof parsed !== 'object' || !parsed.rates) return null;
    const rates = parsed.rates as Record<string, unknown>;
    const validated: Partial<RateMap> = {};
    for (const code of CURRENCY_CODES) {
      const value = rates[code];
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return null;
      }
      validated[code] = value;
    }
    if (typeof parsed.fetched_at !== 'string') return null;
    return {
      rates: validated as RateMap,
      fetched_at: parsed.fetched_at,
      source_unix:
        typeof parsed.source_unix === 'number' ? parsed.source_unix : 0,
    };
  } catch {
    return null;
  }
}

function saveToCache(payload: CachePayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Best-effort: quota / privacy-mode errors are non-fatal.
  }
}

function hydrateFromCache(): void {
  const cached = loadFromCache();
  if (!cached) return;
  currentRates = cached.rates;
  currentSource = 'cache';
  lastFetchedAt = cached.fetched_at;
  lastSourceUnix = cached.source_unix;
  snapshot = computeSnapshot();
}

hydrateFromCache();

async function fetchLive(): Promise<RateMap> {
  const res = await fetch(SOURCE_URL, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`FX source HTTP ${res.status} ${res.statusText}`);
  }
  const body = (await res.json()) as ApiResponse;
  if (body.result !== 'success') {
    const reason =
      'error-type' in body && body['error-type']
        ? body['error-type']
        : 'unknown';
    throw new Error(`FX source returned error: ${reason}`);
  }
  if (body.base_code !== 'IDR') {
    throw new Error(`FX source returned base=${body.base_code}, expected IDR`);
  }
  // Endpoint reports rates as "1 IDR = X foreign". Invert so our map says
  // "1 foreign = Y IDR", matching the FX_STUB convention.
  const inverted: Partial<RateMap> = { IDR: 1 };
  for (const code of CURRENCY_CODES) {
    if (code === 'IDR') continue;
    const rate = body.rates[code];
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
      throw new Error(`FX source missing or invalid rate for ${code}`);
    }
    inverted[code] = 1 / rate;
  }
  return inverted as RateMap;
}

export function getCurrentRates(): RateMap {
  return currentRates;
}

export function getFxStatus(): FxStatus {
  return snapshot;
}

export function subscribeFx(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function ensureRates(
  opts: { force?: boolean } = {}
): Promise<FxStatus> {
  if (!opts.force && currentSource !== 'stub' && !isStale(lastFetchedAt)) {
    return snapshot;
  }
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const rates = await fetchLive();
      currentRates = rates;
      currentSource = 'live';
      lastFetchedAt = new Date().toISOString();
      lastSourceUnix = Math.floor(Date.parse(lastFetchedAt) / 1000);
      lastError = null;
      saveToCache({
        rates,
        fetched_at: lastFetchedAt,
        source_unix: lastSourceUnix,
      });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      // Leave currentRates / currentSource on whatever hydrate produced
      // (cache hit → 'cache', miss → 'stub'). Banner surfaces the state.
    } finally {
      emit();
      inflight = null;
    }
    return snapshot;
  })();
  return inflight;
}

export function convertToBase(
  amount: number,
  from: CurrencyCode,
  base: CurrencyCode
): { amount_base: number; rate: number } {
  const rate = currentRates[from] / currentRates[base];
  const amount_base = Math.round(amount * rate * 100) / 100;
  return { amount_base, rate };
}
