import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, X } from 'lucide-react-native';
import type { PeriodPreset } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { DateField } from '@/components/date-field';
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
// it opens a page sheet listing the presets. Choosing "Custom" reveals a from–to
// range (reusing DateField) applied via the footer button.
export function PeriodPicker({
  period,
  customFrom,
  customTo,
  onApply,
}: PeriodPickerProps) {
  const c = useTheme();
  const { t } = useTranslation('dashboard');
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(period === 'custom');
  const [draftFrom, setDraftFrom] = useState(customFrom);
  const [draftTo, setDraftTo] = useState(customTo);

  const activeLabel = t(
    OPTIONS.find((o) => o.value === period)?.key ?? 'period.thisMonth'
  );

  function openSheet() {
    setShowCustom(period === 'custom');
    setDraftFrom(customFrom);
    setDraftTo(customTo);
    setOpen(true);
  }

  function selectPreset(value: PeriodPreset) {
    if (value === 'custom') {
      setShowCustom(true);
      return;
    }
    onApply(value, customFrom, customTo);
    setOpen(false);
  }

  function applyCustom() {
    onApply('custom', draftFrom, draftTo);
    setOpen(false);
  }

  return (
    <>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel={t('period.accessibilityLabel')}
        onPress={openSheet}
        hitSlop={8}
        style={({ pressed }) => [
          styles.pill,
          { backgroundColor: c.card, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Text style={[styles.pillLabel, { color: c.foreground }]}>
          {activeLabel}
        </Text>
        <ChevronDown size={16} color={c.mutedForeground} />
      </Pressable>

      <Modal
        visible={open}
        animationType='slide'
        presentationStyle='pageSheet'
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.sheet, { backgroundColor: c.background }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: c.foreground }]}>
              {t('period.title')}
            </Text>
            <Pressable
              hitSlop={8}
              accessibilityRole='button'
              accessibilityLabel={t('common:actions.close')}
              onPress={() => setOpen(false)}
            >
              <X size={22} color={c.mutedForeground} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.sheetBody,
              { paddingBottom: insets.bottom + Spacing.five },
            ]}
          >
            {OPTIONS.map((o) => {
              const active =
                o.value === 'custom'
                  ? showCustom
                  : !showCustom && o.value === period;
              return (
                <Pressable
                  key={o.value}
                  onPress={() => selectPreset(o.value)}
                  style={styles.option}
                >
                  <Text style={[styles.optionText, { color: c.foreground }]}>
                    {t(o.key)}
                  </Text>
                  {active ? <Check size={18} color={c.primary} /> : null}
                </Pressable>
              );
            })}

            {showCustom ? (
              <View style={styles.customWrap}>
                <View style={styles.dateRow}>
                  <View style={styles.dateItem}>
                    <DateField
                      value={draftFrom}
                      onChange={setDraftFrom}
                      maximumDate={draftTo}
                    />
                  </View>
                  <Text style={[styles.dash, { color: c.mutedForeground }]}>
                    –
                  </Text>
                  <View style={styles.dateItem}>
                    <DateField
                      value={draftTo}
                      onChange={setDraftTo}
                      minimumDate={draftFrom}
                    />
                  </View>
                </View>
                <Button
                  label={t('common:actions.apply')}
                  onPress={applyCustom}
                />
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
  },
  pillLabel: { fontFamily: Fonts.semibold, fontSize: 14 },
  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  sheetTitle: { fontFamily: Fonts.bold, fontSize: 20 },
  sheetBody: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  optionText: { fontFamily: Fonts.medium, fontSize: 16 },
  customWrap: { gap: Spacing.three, paddingTop: Spacing.two },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dateItem: { flex: 1 },
  dash: { fontFamily: Fonts.regular, fontSize: 16 },
});
