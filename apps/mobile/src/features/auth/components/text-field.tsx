// Moved to the shared UI primitive library. Kept as a re-export shim so existing
// imports keep working; migrate call sites to `@/components/ui` over time.
export {
  FieldLabel,
  FieldError,
  InputShell,
  TextField,
} from '@/components/ui/text-field';
