import { useCallback, useEffect, useState } from 'react';

// Drives a countdown for "resend email" buttons so users can't spam them.
// Returns the seconds left, whether a cooldown is active, and a `start(seconds)`
// to (re)arm it. Wall-clock based so it stays accurate across re-renders.
export function useCooldown() {
  const [until, setUntil] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (until === null) return;

    const tick = () => {
      const secondsLeft = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setRemaining(secondsLeft);
      if (secondsLeft <= 0) setUntil(null);
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [until]);

  const start = useCallback((seconds: number) => {
    setRemaining(seconds);
    setUntil(Date.now() + seconds * 1000);
  }, []);

  return { remaining, active: remaining > 0, start };
}

// Default cooldown between resend attempts (seconds).
export const RESEND_COOLDOWN_SECONDS = 60;
