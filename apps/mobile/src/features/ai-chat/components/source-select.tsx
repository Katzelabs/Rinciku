import { useEffect, useState } from 'react';
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
import { Check, ChevronDown, X } from 'lucide-react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { listIncomeCategories } from '@/features/incomes/api';
import { InputShell } from '@/features/auth/components/text-field';
import { useTheme } from '@/hooks/use-theme';

type SourceRow = { id: string; name: string };

interface SourceSelectProps {
  /** Selected income-source id, or '' for "no source". */
  value: string;
  onChange: (id: string) => void;
}

// Flat single-select picker for income sources (income categories have no tier).
// Opens a page-sheet list with a "No source" option first. The income analogue
// of CategorySelect, used only by the AI income proposal card.
export function SourceSelect({ value, onChange }: SourceSelectProps) {
  const c = useTheme();
  const { t } = useTranslation('aiChat');
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<SourceRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listIncomeCategories().then(({ data }) => {
      if (cancelled) return;
      setRows((data ?? []).map((r) => ({ id: r.id, name: r.name })));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const selected = rows?.find((r) => r.id === value) ?? null;

  function pick(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <>
      <Pressable accessibilityRole='button' onPress={() => setOpen(true)}>
        <InputShell>
          <Text
            style={[
              styles.triggerText,
              { color: selected ? c.foreground : c.mutedForeground },
            ]}
          >
            {selected ? selected.name : t('proposal.noSource')}
          </Text>
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
              {t('proposal.source')}
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
            {rows === null ? (
              <ActivityIndicator color={c.primary} style={styles.loader} />
            ) : (
              [{ id: '', name: t('proposal.noSource') }, ...rows].map(
                (row, i) => {
                  const isSelected = row.id === value;
                  return (
                    <Pressable
                      key={row.id || '__none__'}
                      onPress={() => pick(row.id)}
                      style={[
                        styles.option,
                        i > 0 && {
                          borderTopColor: c.border,
                          borderTopWidth: StyleSheet.hairlineWidth,
                        },
                        isSelected && { backgroundColor: c.muted },
                      ]}
                    >
                      <Text
                        style={[styles.optionText, { color: c.foreground }]}
                      >
                        {row.name}
                      </Text>
                      {isSelected ? (
                        <Check size={18} color={c.primary} />
                      ) : null}
                    </Pressable>
                  );
                }
              )
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerText: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
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
  },
  loader: { marginVertical: Spacing.four },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.lg,
  },
  optionText: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
});
