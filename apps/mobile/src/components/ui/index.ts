// Shared UI primitive library. Import primitives from here:
//   import { Card, ScreenScroll, AppText } from '@/components/ui';
// Feature-aware shared components (TransactionRow, CategoryBadge, EmptyState…)
// live one level up in `@/components/*`, not in this barrel.

export { Button } from './button';
export {
  TextField,
  InputShell,
  FieldLabel,
  FieldError,
} from './text-field';
export { PasswordField } from './password-field';
export { Notice } from './notice';
export { AppText } from './text';
export { Card, Divider } from './card';
export { Screen, ScreenScroll } from './screen';
export { Sheet } from './sheet';
export { SectionHeader } from './section-header';
export { Pill, IconButton } from './pill';
