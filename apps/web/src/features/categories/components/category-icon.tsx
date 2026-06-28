import { createElement, type CSSProperties } from 'react';

import { resolveIcon } from '../lib/icons';

type CategoryIconProps = {
  name: string | null | undefined;
  className?: string;
  style?: CSSProperties;
};

export function CategoryIcon({ name, className, style }: CategoryIconProps) {
  return createElement(resolveIcon(name), { className, style });
}
