import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from './database.types';
export { Constants } from './database.types';

/**
 * Build a typed Supabase browser client. The caller supplies the URL + anon key
 * so this package stays free of any bundler-specific env access (Vite's
 * `import.meta.env`, Expo's `process.env`, etc.).
 */
export function createSupabaseClient(url: string, anonKey: string) {
  return createBrowserClient<Database>(url, anonKey);
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
