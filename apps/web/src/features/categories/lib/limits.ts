// Per-user caps on the spending taxonomy. Kept in sync with the DB triggers in
// supabase/schemas/10_tiers.sql and 11_categories.sql.
export const MAX_TIERS = 6;
export const MAX_CATEGORIES_PER_TIER = 15;
