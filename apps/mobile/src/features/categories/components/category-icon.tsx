import {
  Banknote,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  Coffee,
  CreditCard,
  Droplet,
  Dumbbell,
  Flame,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  type LucideIcon,
  Phone,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  Tag,
  Train,
  TrendingUp,
  Tv,
  UtensilsCrossed,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react-native';

import { useTheme } from '@/hooks/use-theme';

// Explicit map over the curated CATEGORY_ICONS (from @rinciku/domain). Named
// imports keep only these ~32 glyphs in the bundle (Metro doesn't tree-shake a
// `import * as`), and mirror the web `resolveIcon` map. Unknown/legacy names
// (e.g. the lowercase seed values) fall back to Tag, same as web.
const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Wifi,
  Zap,
  Droplet,
  Flame,
  ShoppingCart,
  ShoppingBag,
  Car,
  Bus,
  Train,
  Fuel,
  HeartPulse,
  Stethoscope,
  Pill,
  Dumbbell,
  UtensilsCrossed,
  Coffee,
  Tv,
  Gamepad2,
  BookOpen,
  GraduationCap,
  Plane,
  Gift,
  Receipt,
  CreditCard,
  Wallet,
  Banknote,
  PiggyBank,
  Briefcase,
  TrendingUp,
  Shirt,
  Phone,
};

interface CategoryIconProps {
  name: string | null | undefined;
  size?: number;
  color?: string;
}

export function CategoryIcon({ name, size = 20, color }: CategoryIconProps) {
  const c = useTheme();
  const Glyph = (name && ICON_MAP[name]) || Tag;
  return <Glyph size={size} color={color ?? c.foreground} />;
}
