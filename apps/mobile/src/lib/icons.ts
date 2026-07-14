// Curated lucide icon barrel — import icons from '@/lib/icons', NEVER from
// 'lucide-react-native' directly.
//
// Metro does not tree-shake, so a named import from lucide's barrel
// (`import { ChevronRight } from 'lucide-react-native'`) ships all ~1500 icons:
// ~3MB, the single largest package in the RN bundle. Deep-importing only what we
// use cuts that to the handful below. lucide's `exports` field doesn't expose
// the per-icon subpaths, so `lucide-react-native/icons/<name>` is a Metro
// resolver alias (see metro.config.js) typed by src/types/lucide-icons.d.ts.
//
// To add an icon: add a line here (file name is the icon's kebab-case form) and
// import it from '@/lib/icons'. Note lucide's own file names win over its
// deprecated aliases — LineChart lives in chart-line, Trash2 in trash-2.
export { default as ArrowUp } from 'lucide-react-native/icons/arrow-up';
export { default as Calendar } from 'lucide-react-native/icons/calendar';
export { default as CalendarClock } from 'lucide-react-native/icons/calendar-clock';
export { default as Check } from 'lucide-react-native/icons/check';
export { default as ChevronDown } from 'lucide-react-native/icons/chevron-down';
export { default as ChevronLeft } from 'lucide-react-native/icons/chevron-left';
export { default as ChevronRight } from 'lucide-react-native/icons/chevron-right';
export { default as Coins } from 'lucide-react-native/icons/coins';
export { default as Copy } from 'lucide-react-native/icons/copy';
export { default as FileText } from 'lucide-react-native/icons/file-text';
export { default as ImagePlus } from 'lucide-react-native/icons/image-plus';
export { default as LineChart } from 'lucide-react-native/icons/chart-line';
export { default as Lock } from 'lucide-react-native/icons/lock';
export { default as MessageSquarePlus } from 'lucide-react-native/icons/message-square-plus';
export { default as MessagesSquare } from 'lucide-react-native/icons/messages-square';
export { default as Pencil } from 'lucide-react-native/icons/pencil';
export { default as Plus } from 'lucide-react-native/icons/plus';
export { default as Receipt } from 'lucide-react-native/icons/receipt';
export { default as Repeat } from 'lucide-react-native/icons/repeat';
export { default as Search } from 'lucide-react-native/icons/search';
export { default as SearchX } from 'lucide-react-native/icons/search-x';
export { default as Shapes } from 'lucide-react-native/icons/shapes';
export { default as Share } from 'lucide-react-native/icons/share';
export { default as ShieldCheck } from 'lucide-react-native/icons/shield-check';
export { default as SlidersHorizontal } from 'lucide-react-native/icons/sliders-horizontal';
export { default as Sparkles } from 'lucide-react-native/icons/sparkles';
export { default as Tags } from 'lucide-react-native/icons/tags';
export { default as Target } from 'lucide-react-native/icons/target';
export { default as Trash2 } from 'lucide-react-native/icons/trash-2';
export { default as Wallet } from 'lucide-react-native/icons/wallet';
export { default as X } from 'lucide-react-native/icons/x';

// Type-only — erased at compile time, so it costs nothing at runtime and can
// safely come from the package root.
export type { LucideIcon } from 'lucide-react-native';
