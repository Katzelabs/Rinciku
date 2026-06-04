import { icons, type LucideIcon } from 'lucide-react';

export const CATEGORY_ICONS = [
  'Home',
  'Wifi',
  'Zap',
  'Droplet',
  'Flame',
  'ShoppingCart',
  'ShoppingBag',
  'Car',
  'Bus',
  'Train',
  'Fuel',
  'HeartPulse',
  'Stethoscope',
  'Pill',
  'Dumbbell',
  'UtensilsCrossed',
  'Coffee',
  'Tv',
  'Gamepad2',
  'BookOpen',
  'GraduationCap',
  'Plane',
  'Gift',
  'Receipt',
  'CreditCard',
  'Wallet',
  'Banknote',
  'PiggyBank',
  'Shirt',
  'Phone',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];

export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (name && name in icons) {
    return icons[name as keyof typeof icons] as LucideIcon;
  }
  return icons.Tag as LucideIcon;
}
