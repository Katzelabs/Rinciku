import { Platform } from 'react-native';
import { Host, Picker, Text as SwiftText } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';

import { Segmented, type SegmentedOption } from '@/components/segmented';

interface PeriodTabsProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (key: T) => void;
}

// Quick period selector. On iOS this renders a real native segmented control
// (SwiftUI `Picker` with `.pickerStyle(.segmented)`) via @expo/ui so it matches
// the platform chrome; on Android it falls back to the custom pill `Segmented`
// (there's no SwiftUI bridge there). Both take the same option/value/onChange
// contract, so callers don't branch.
export function PeriodTabs<T extends string>({
  options,
  value,
  onChange,
}: PeriodTabsProps<T>) {
  if (Platform.OS === 'ios') {
    return (
      <Host matchContents={{ vertical: true }} style={{ width: '100%' }}>
        <Picker
          selection={value}
          onSelectionChange={(v) => onChange(v as T)}
          modifiers={[pickerStyle('segmented')]}
        >
          {options.map((o) => (
            <SwiftText key={o.key} modifiers={[tag(o.key)]}>
              {o.label}
            </SwiftText>
          ))}
        </Picker>
      </Host>
    );
  }

  return <Segmented options={options} value={value} onChange={onChange} />;
}
