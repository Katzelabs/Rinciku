// Shared "brain" for the web (Vite) and mobile (Expo) apps: per-feature data
// access (Supabase client dependency-injected via `create<Feature>Api(db)`),
// Zod schema factories, and types. UI, routing and caching stay in each app.
export type { TypedSupabaseClient } from '@rinciku/db';
