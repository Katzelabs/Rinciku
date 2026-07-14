import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, X } from '@/lib/icons';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { InputShell } from '@/features/auth/components/text-field';
import { Notice } from '@/features/auth/components/notice';
import { useIncomeSources } from '@/features/incomes/hooks/use-income-sources';
import { useTheme } from '@/hooks/use-theme';
import { useState } from 'react';

interface IncomeSourceSelectProps {
  /** Selected source id, or null when nothing is picked. */
  value: string | null;
  onChange: (id: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// Single-select income source picker (flat, no tier). Mirrors CategorySelect but
// for the income taxonomy; opens a page-sheet list.
export function IncomeSourceSelect({
  value,
  onChange,
  invalid,
  disabled,
  placeholder,
}: IncomeSourceSelectProps) {
  const c = useTheme();
  const { t } = useTranslation('incomes');
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { sources, loading, error } = useIncomeSources();

  const selected = sources.find((s) => s.id === value) ?? null;
  const label = placeholder ?? t('form.pickSource');

  return (
    <>
      <Pressable
        accessibilityRole='button'
        accessibilityLabel={label}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <InputShell invalid={invalid}>
          <View style={styles.trigger}>
            {selected ? (
              <>
                <CategoryIcon
                  name={selected.icon}
                  size={18}
                  color={selected.color ?? c.foreground}
                />
                <Text style={[styles.triggerText, { color: c.foreground }]}>
                  {selected.name}
                </Text>
              </>
            ) : (
              <Text style={[styles.triggerText, { color: c.mutedForeground }]}>
                {label}
              </Text>
            )}
          </View>
          <ChevronDown size={18} color={c.mutedForeground} />
        </InputShell>
      </Pressable>

      <Modal
        visible={open}
        animationType='slide'
        // pageSheet is iOS-only; Android renders fullscreen — the translucent
        // flags avoid an opaque bar block and the header inset clears the
        // status bar (same treatment as the ui/Sheet primitive).
        presentationStyle='pageSheet'
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.sheet, { backgroundColor: c.background }]}>
          <View
            style={[
              styles.sheetHeader,
              Platform.OS === 'android' && {
                paddingTop: insets.top + Spacing.two,
              },
            ]}
          >
            <Text style={[styles.sheetTitle, { color: c.foreground }]}>
              {label}
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
            {loading ? (
              <ActivityIndicator color={c.primary} style={styles.loader} />
            ) : error ? (
              <Notice tone='error'>{error}</Notice>
            ) : sources.length === 0 ? (
              <Text style={[styles.empty, { color: c.mutedForeground }]}>
                {t('filters.noSources')}
              </Text>
            ) : (
              sources.map((source, i) => {
                const isSelected = source.id === value;
                return (
                  <Pressable
                    key={source.id}
                    onPress={() => {
                      onChange(source.id);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      i > 0 && {
                        borderTopColor: c.border,
                        borderTopWidth: StyleSheet.hairlineWidth,
                      },
                      isSelected && { backgroundColor: c.muted },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: `${source.color ?? '#8d8d8d'}22` },
                      ]}
                    >
                      <CategoryIcon
                        name={source.icon}
                        size={16}
                        color={source.color ?? c.foreground}
                      />
                    </View>
                    <Text style={[styles.optionText, { color: c.foreground }]}>
                      {source.name}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  triggerText: { fontFamily: Fonts.regular, fontSize: 16 },
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
  loader: { marginVertical: Spacing.four },
  empty: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.lg,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
});
