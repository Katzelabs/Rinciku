import { icons, type LucideIcon } from 'lucide-react';

// The icon *name* list is shared with mobile in @rinciku/domain (no lucide
// import there). Only the lucide resolution below is web-specific.
export {
  CATEGORY_ICONS,
  type CategoryIconName,
} from '@rinciku/domain/categories';

export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (name && name in icons) {
    return icons[name as keyof typeof icons] as LucideIcon;
  }
  return icons.Tag as LucideIcon;
}
