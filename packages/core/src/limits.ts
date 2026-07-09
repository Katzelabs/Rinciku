// Shared numeric bounds for user-entered money amounts.
//
// 1e15 (one quadrillion) is far beyond any personal-finance amount even in
// IDR (≈ USD 60B), yet stays inside float64's exact-integer range
// (2^53 ≈ 9e15) so sums and formatting remain exact. Schemas cap form and
// CSV-import amounts with it; without a cap, `Infinity` or astronomically
// large values pass `.positive()` and corrupt totals downstream.
export const MAX_AMOUNT = 1e15;
