import { useRef, useState, type ReactNode } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

// Cloudflare Turnstile, env-gated: without VITE_TURNSTILE_SITE_KEY nothing
// renders and `token` stays undefined — matching a Supabase project with
// [auth.captcha] off. With the key set, gate submits on `ready`, pass `token`
// to the auth call, and call `reset()` after every attempt (tokens are
// single-use). Enabling [auth.captcha] server-side is a separate launch toggle
// (supabase/config.toml) and must wait until mobile also serves a widget.
const SITE_KEY: string | undefined = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export const captchaEnabled = Boolean(SITE_KEY);

export type Captcha = {
  // The widget element (null when captcha is off — render unconditionally).
  widget: ReactNode;
  // Current single-use token to pass to the auth call.
  token: string | undefined;
  // True when a submit may proceed (captcha off, or a token is present).
  ready: boolean;
  // Invalidate the current token and request a fresh one. Call after every
  // auth attempt — consumed tokens are rejected on reuse.
  reset: () => void;
};

export function useCaptcha(): Captcha {
  const ref = useRef<TurnstileInstance | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const reset = () => {
    setToken(null);
    ref.current?.reset();
  };

  const widget = captchaEnabled ? (
    <Turnstile
      ref={ref}
      siteKey={SITE_KEY!}
      onSuccess={setToken}
      onExpire={reset}
      onError={() => setToken(null)}
      options={{ theme: 'auto', size: 'flexible' }}
    />
  ) : null;

  return {
    widget,
    token: token ?? undefined,
    ready: !captchaEnabled || token !== null,
    reset,
  };
}
