import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, Search, X } from 'lucide-react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { DateField } from '@/components/date-field';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { InputShell } from '@/features/auth/components/text-field';
import { useIncomeSources } from '@/features/incomes/hooks/use-income-sources';
import { useTheme } from '@/hooks/use-theme';

interface IncomeFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sourceIds: string[];
  onSourceIdsChange: (ids: string[]) => void;
  from: Date;
  to: Date;
  onDateRangeChange: (from: Date, to: Date) => void;
}

export function IncomeFilters({
  search,
  onSearchChange,
  sourceIds,
  onSourceIdsChange,
  from,
  to,
  onDateRangeChange,
}: IncomeFiltersProps) {
  const c = useTheme();
  const { t } = useTranslation('incomes');
  const [pickerOpen, setPickerOpen] = useState(false);

  const label =
    sourceIds.length === 0
      ? t('filters.allSources')
      : t('common:multiSelect.selectedCount', { count: sourceIds.length });

  return (
    <View style={styles.wrap}>
      <InputShell leading={<Search size={16} color={c.mutedForeground} />}>
        <TextInput
          style={[styles.searchInput, { color: c.foreground }]}
          placeholder={t('filters.searchPlaceholder')}
          placeholderTextColor={c.mutedForeground}
          value={search}
          onChangeText={onSearchChange}
          accessibilityLabel={t('filters.searchPlaceholder')}
          autoCapitalize='none'
          returnKeyType='search'
        />
      </InputShell>

      <View style={styles.dateRow}>
        <View style={styles.dateItem}>
          <DateField
            value={from}
            onChange={(d) => onDateRangeChange(d, to)}
            maximumDate={to}
          />
        </View>
        <Text style={[styles.dash, { color: c.mutedForeground }]}>–</Text>
        <View style={styles.dateItem}>
          <DateField
            value={to}
            onChange={(d) => onDateRangeChange(from, d)}
            minimumDate={from}
          />
        </View>
      </View>

      <Pressable
        accessibilityRole='button'
        accessibilityLabel={label}
        onPress={() => setPickerOpen(true)}
      >
        <InputShell>
          <Text
            style={[
              styles.pickerLabel,
              { color: sourceIds.length ? c.foreground : c.mutedForeground },
            ]}
          >
            {label}
          </Text>
          <ChevronDown size={18} color={c.mutedForeground} />
        </InputShell>
      </Pressable>

      <SourceMultiSelect
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selected={sourceIds}
        onChange={onSourceIdsChange}
      />
    </View>
  );
}

function SourceMultiSelect({
  open,
  onClose,
  selected,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const c = useTheme();
  const { t } = useTranslation('incomes');
  const insets = useSafeAreaInsets();
  const { sources, loading } = useIncomeSources();

  const selectedSet = new Set(selected);

  function toggle(id: string) {
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  return (
    <Modal
      visible={open}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: c.background }]}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: c.foreground }]}>
            {t('filters.allSources')}
          </Text>
          <View style={styles.headerActions}>
            {selected.length > 0 ? (
              <Pressable hitSlop={8} onPress={() => onChange([])}>
                <Text style={[styles.clear, { color: c.primary }]}>
                  {t('common:multiSelect.clear')}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              hitSlop={8}
              accessibilityRole='button'
              accessibilityLabel={t('common:actions.close')}
              onPress={onClose}
            >
              <X size={22} color={c.mutedForeground} />
            </Pressable>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={[
            styles.sheetBody,
            { paddingBottom: insets.bottom + Spacing.five },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={c.primary} style={styles.loader} />
          ) : sources.length === 0 ? (
            <Text style={[styles.emptyText, { color: c.mutedForeground }]}>
              {t('filters.noSources')}
            </Text>
          ) : (
            sources.map((source) => {
              const checked = selectedSet.has(source.id);
              return (
                <Pressable
                  key={source.id}
                  onPress={() => toggle(source.id)}
                  style={styles.option}
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
                  {checked ? <Check size={18} color={c.primary} /> : null}
                </Pressable>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.two },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dateItem: { flex: 1 },
  dash: { fontFamily: Fonts.regular, fontSize: 16 },
  pickerLabel: {
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  clear: { fontFamily: Fonts.semibold, fontSize: 15 },
  sheetTitle: { fontFamily: Fonts.bold, fontSize: 20 },
  sheetBody: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.one,
  },
  loader: { marginVertical: Spacing.four },
  emptyText: {
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
