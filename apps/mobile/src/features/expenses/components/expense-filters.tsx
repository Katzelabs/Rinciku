import { useEffect, useState } from 'react';
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
import type { Tables } from '@rinciku/db';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { DateField } from '@/components/date-field';
import { listCategories, listTiers } from '@/features/categories/api';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { groupByTier, type Tier, type TierGroup } from '@/features/categories/types';
import { InputShell } from '@/features/auth/components/text-field';
import { useTheme } from '@/hooks/use-theme';

type Category = Tables<'categories'>;

interface ExpenseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryIds: string[];
  onCategoryIdsChange: (ids: string[]) => void;
  from: Date;
  to: Date;
  onDateRangeChange: (from: Date, to: Date) => void;
}

export function ExpenseFilters({
  search,
  onSearchChange,
  categoryIds,
  onCategoryIdsChange,
  from,
  to,
  onDateRangeChange,
}: ExpenseFiltersProps) {
  const c = useTheme();
  const { t } = useTranslation('expenses');
  const [pickerOpen, setPickerOpen] = useState(false);

  const label =
    categoryIds.length === 0
      ? t('filters.allCategories')
      : t('common:multiSelect.selectedCount', { count: categoryIds.length });

  return (
    <View style={styles.wrap}>
      <InputShell leading={<Search size={16} color={c.mutedForeground} />}>
        <TextInput
          style={[styles.searchInput, { color: c.foreground }]}
          placeholder={t('filters.searchPlaceholder')}
          placeholderTextColor={c.mutedForeground}
          value={search}
          onChangeText={onSearchChange}
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

      <Pressable accessibilityRole='button' onPress={() => setPickerOpen(true)}>
        <InputShell>
          <Text
            style={[
              styles.pickerLabel,
              {
                color: categoryIds.length ? c.foreground : c.mutedForeground,
              },
            ]}
          >
            {label}
          </Text>
          <ChevronDown size={18} color={c.mutedForeground} />
        </InputShell>
      </Pressable>

      <CategoryMultiSelect
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selected={categoryIds}
        onChange={onCategoryIdsChange}
      />
    </View>
  );
}

function CategoryMultiSelect({
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
  const { t } = useTranslation('expenses');
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<{
    categories: Category[];
    tiers: Tier[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCategories(), listTiers()]).then(([cats, tiers]) => {
      if (cancelled) return;
      setData({ categories: cats.data ?? [], tiers: tiers.data ?? [] });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups: TierGroup[] = data
    ? groupByTier(data.categories, data.tiers)
    : [];
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
            {t('filters.allCategories')}
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
          {data === null ? (
            <ActivityIndicator color={c.primary} style={styles.loader} />
          ) : (
            groups.map((group) =>
              group.categories.length === 0 ? null : (
                <View key={group.tier?.id ?? '__untiered__'} style={styles.group}>
                  <Text style={[styles.groupLabel, { color: c.mutedForeground }]}>
                    {group.tier ? group.tier.name : t('form.untiered')}
                  </Text>
                  {group.categories.map((cat) => {
                    const checked = selectedSet.has(cat.id);
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => toggle(cat.id)}
                        style={styles.option}
                      >
                        <View
                          style={[
                            styles.iconBadge,
                            { backgroundColor: `${cat.color ?? '#8d8d8d'}22` },
                          ]}
                        >
                          <CategoryIcon
                            name={cat.icon}
                            size={16}
                            color={cat.color ?? c.foreground}
                          />
                        </View>
                        <Text style={[styles.optionText, { color: c.foreground }]}>
                          {cat.name}
                        </Text>
                        {checked ? <Check size={18} color={c.primary} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              )
            )
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
  pickerLabel: { flex: 1, fontFamily: Fonts.regular, fontSize: 16, paddingVertical: Spacing.three },
  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  clear: { fontFamily: Fonts.semibold, fontSize: 15 },
  sheetTitle: { fontFamily: Fonts.bold, fontSize: 20 },
  sheetBody: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  loader: { marginVertical: Spacing.four },
  group: { gap: Spacing.one },
  groupLabel: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
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
