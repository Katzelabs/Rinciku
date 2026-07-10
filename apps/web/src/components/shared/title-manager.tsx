import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatches } from 'react-router';
import type { TFunction } from 'i18next';

/**
 * A route's `handle.title` may be either an i18n key (resolved against the
 * bundled namespaces, e.g. `'expenses:page.title'`) or a function that derives
 * a title from the route's loader `data` (for dynamic pages).
 */
type TitleValue =
  | string
  | ((data: unknown, t: TFunction) => string | undefined);

interface TitleHandle {
  title?: TitleValue;
}

function readTitle(handle: unknown): TitleValue | undefined {
  if (typeof handle === 'object' && handle !== null && 'title' in handle) {
    return (handle as TitleHandle).title;
  }
  return undefined;
}

/**
 * Syncs `document.title` to the current route. Reads `handle.title` off the
 * deepest matched route that defines one, so titles live in the route config
 * (not scattered across page components) and stay localized — the effect
 * re-runs on `i18n.language` change. Renders nothing.
 */
export function TitleManager() {
  const { t, i18n } = useTranslation();
  const matches = useMatches();

  useEffect(() => {
    const appName = t('brand.name');

    const match = [...matches]
      .reverse()
      .find((m) => readTitle(m.handle) !== undefined);
    const raw = match ? readTitle(match.handle) : undefined;

    const resolved =
      typeof raw === 'function'
        ? raw(match?.data, t)
        : typeof raw === 'string'
          ? t(raw)
          : undefined;

    document.title = resolved ? `${resolved} | ${appName}` : appName;
  }, [matches, t, i18n.language]);

  return null;
}
