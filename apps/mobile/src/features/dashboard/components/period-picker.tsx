import { MenuView, type MenuAction } from '@expo/ui/community/menu';
import type { PeriodPreset } from '@rinciku/core';
import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { Sheet } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { Button } from '@/features/auth/components/button';
import { useTheme } from '@/hooks/use-theme';

const OPTIONS: { value: PeriodPreset; key: string }[] = [
  { value: 'today', key: 'period.today' },
  { value: 'week', key: 'period.thisWeek' },
  { value: 'month', key: 'period.thisMonth' },
  { value: 'custom', key: 'period.custom' },
];

interface PeriodPickerProps {
  period: PeriodPreset;
  customFrom: Date;
  customTo: Date;
  onApply: (period: PeriodPreset, customFrom: Date, customTo: Date) => void;
}

// Dashboard header-right control. A compact pill shows the active period; tapping
// it opens a native pull-down menu (UIMenu on iOS, PopupMenu on Android) listing
// the presets with a checkmark on the active one. Choosing "Custom" opens a small
// sheet with a from–to range (reusing DateField) applied via the footer button.
export function PeriodPicker({
  period,
  customFrom,
  customTo,
  onApply,
}: PeriodPickerProps) {
  const c = useTheme();
  const { t } = useTranslation('dashboard');
  const [customOpen, setCustomOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(customFrom);
  const [draftTo, setDraftTo] = useState(customTo);

  const activeLabel = t(
    OPTIONS.find((o) => o.value === period)?.key ?? 'period.thisMonth'
  );

  const actions: MenuAction[] = OPTIONS.map((o) => ({
    id: o.value,
    title: t(o.key),
    state: o.value === period ? 'on' : 'off',
  }));

  function handleAction(value: PeriodPreset) {
    if (value === 'custom') {
      setDraftFrom(customFrom);
      setDraftTo(customTo);
      setCustomOpen(true);
      return;
    }
    onApply(value, customFrom, customTo);
  }

  function applyCustom() {
    onApply('custom', draftFrom, draftTo);
    setCustomOpen(false);
  }

  return (
    <>
      <MenuView
        title={t('period.title')}
        actions={actions}
        onPressAction={({ nativeEvent }) =>
          handleAction(nativeEvent.event as PeriodPreset)
        }
      >
        <View
          accessibilityRole='button'
          accessibilityLabel={t('period.accessibilityLabel')}
          style={styles.pill}
        >
          <Text style={[styles.pillLabel, { color: c.foreground }]}>
            {activeLabel}
          </Text>
          <ChevronDown size={16} color={c.mutedForeground} />
        </View>
      </MenuView>

      <Sheet
        visible={customOpen}
        onClose={() => setCustomOpen(false)}
        title={t('period.custom')}
      >
        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <DateField
              value={draftFrom}
              onChange={setDraftFrom}
              maximumDate={draftTo}
            />
          </View>
          <Text style={[styles.dash, { color: c.mutedForeground }]}>–</Text>
          <View style={styles.dateItem}>
            <DateField
              value={draftTo}
              onChange={setDraftTo}
              minimumDate={draftFrom}
            />
          </View>
        </View>
        <Button label={t('common:actions.apply')} onPress={applyCustom} />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  // The pill is transparent, so generous padding grows the touch target
  // invisibly — the MenuView wrapper owns tap handling, and hitSlop on this
  // plain View child isn't reliable, so the padding IS the hit area.
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 40,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
  },
  pillLabel: { fontFamily: Fonts.semibold, fontSize: 14 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dateItem: { flex: 1 },
  dash: { fontFamily: Fonts.regular, fontSize: 16 },
});
