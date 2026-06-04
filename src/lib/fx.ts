// TODO: replace with live rate (e.g. via an exchangerate API + cache).
const USD_TO_IDR = 16200;

export type Currency = 'IDR' | 'USD';

export type ConvertToIdrResult = {
  amount_idr: number;
  exchange_rate_to_idr: number;
};

export async function getFxRate(from: Currency, to: Currency): Promise<number> {
  if (from === to) return 1;
  if (from === 'USD' && to === 'IDR') return USD_TO_IDR;
  if (from === 'IDR' && to === 'USD') return 1 / USD_TO_IDR;
  throw new Error(`Unsupported FX pair: ${from} -> ${to}`);
}

export async function convertToIdr(input: {
  amount: number;
  currency: Currency;
}): Promise<ConvertToIdrResult> {
  const rate = await getFxRate(input.currency, 'IDR');
  const amount_idr = Math.round(input.amount * rate * 100) / 100;
  return { amount_idr, exchange_rate_to_idr: rate };
}
