# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Design system

Before any UI work, read `docs/design-system.md` (repo root) — the canonical
rules + rationale for how Rinciku looks (lime is an accent not a fill,
symbol-based currency formatting, emoji category chips, no gray tags, tabular
money, warm ground + card shadow). Token *values* live in
`src/constants/theme.ts`.

# Security

The app intentionally ships **no WebView** (`react-native-webview` is not a
dependency) — treat that as a safety property, don't add one casually. Captcha
is web-only at launch: the web app renders a client-side Turnstile widget, but
Supabase `[auth.captcha]` stays OFF because server enforcement applies to all
clients and would break mobile sign-in. The mobile Turnstile widget (WebView
scoped to auth screens) is a tracked post-launch task — only then does the
server toggle flip.
