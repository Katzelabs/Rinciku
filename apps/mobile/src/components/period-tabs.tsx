import { Segmented, type SegmentedOption } from '@/components/segmented';

interface PeriodTabsProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (key: T) => void;
}

// Quick period selector — now just the adaptive `Segmented` control (native
// SwiftUI segmented Picker on iOS, pill track on Android). Kept as a named alias
// so the expenses/incomes screens read intently; new code can use `Segmented`
// directly.
export function PeriodTabs<T extends string>(props: PeriodTabsProps<T>) {
  return <Segmented {...props} />;
}
