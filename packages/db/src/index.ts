import { createBrowserClient } from '@supabase/ssr';
import {
  createClient,
  type SupabaseClient as SupabaseJsClient,
  type SupportedStorage,
} from '@supabase/supabase-js';
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
export type { SupportedStorage } from '@supabase/supabase-js';

/**
 * Build a typed Supabase browser client. The caller supplies the URL +
 * publishable key so this package stays free of any bundler-specific env access
 * (Vite's `import.meta.env`, Expo's `process.env`, etc.).
 */
export function createSupabaseClient(url: string, publishableKey: string) {
  return createBrowserClient<Database>(url, publishableKey);
}

/**
 * Build a typed Supabase client for React Native / Expo. The browser path
 * (`createSupabaseClient`) relies on cookies + `document`; native has neither,
 * so we use the base `@supabase/supabase-js` `createClient` and let the caller
 * inject a storage adapter (e.g. AsyncStorage) — keeping React Native packages
 * out of `@rinciku/db`. AppState-driven `startAutoRefresh`/`stopAutoRefresh`
 * wiring is the app's responsibility, not this factory's.
 */
export function createMobileClient(
  url: string,
  publishableKey: string,
  storage: SupportedStorage
) {
  return createClient<Database>(url, publishableKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Canonical typed client both factories satisfy — use this for shared
 * (`@rinciku/domain`) api factory signatures so the same code accepts the web
 * browser client and the native client interchangeably.
 */
export type TypedSupabaseClient = SupabaseJsClient<Database>;

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
