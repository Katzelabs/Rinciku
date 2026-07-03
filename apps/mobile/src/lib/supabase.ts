import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMobileClient } from '@rinciku/db';

// Expo inlines `EXPO_PUBLIC_*` env vars at build time. The mobile client uses
// the base supabase-js `createClient` (not the SSR/cookie path) with an
// AsyncStorage adapter for session persistence — see `createMobileClient` in
// `@rinciku/db`. `AsyncStorage` already satisfies the `SupportedStorage` shape
// (get/set/removeItem), so it is passed straight through.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. ' +
      'Copy apps/mobile/.env.example to apps/mobile/.env and fill it in.'
  );
}

export const supabase = createMobileClient(url, publishableKey, AsyncStorage);
