// Per-user caps on the spending taxonomy, shared with mobile in @rinciku/domain.
// Kept in sync with the DB triggers in supabase/schemas/10_tiers.sql and
// 11_categories.sql.
export { MAX_TIERS, MAX_CATEGORIES_PER_TIER } from '@rinciku/domain/categories';
