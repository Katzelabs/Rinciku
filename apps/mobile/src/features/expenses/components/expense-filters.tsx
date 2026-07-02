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
import {
  Calendar,
  Check,
  ChevronDown,
  Search,
  Shapes,
  X,
} from 'lucide-react-native';
import type { Tables } from '@rinciku/db';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { listCategories, listTiers } from '@/features/categories/api';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import {
  groupByTier,
  type Tier,
  type TierGroup,
} from '@/features/categories/types';
import { useTheme } from '@/hooks/use-theme';

type Category = Tables<'categories'>;

/** Quick period presets offered on the transactions list (custom lives on web). */
export type ListPeriod = 'today' | 'week' | 'month';

const PERIOD_KEY: Record<ListPeriod, string> = {
  today: 'period.today',
  week: 'period.thisWeek',
  month: 'period.thisMonth',
};

interface ExpenseFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  categoryIds: string[];
  onCategoryIdsChange: (ids: string[]) => void;
  period: ListPeriod;
  onPeriodChange: (period: ListPeriod) => void;
}

// The transactions-list filter card from the reference design: a full-width
// search on top, then a row of two dropdown pills (category + period). Each
// dropdown opens a page-sheet; the category picker is multi-select, the period
// picker single-select. Sits in a card so it reads as one grouped control.
export function ExpenseFilters({
  search,
  onSearchChange,
  categoryIds,
  onCategoryIdsChange,
  period,
  onPeriodChange,
}: ExpenseFiltersProps) {
  const c = useTheme();
  const { t } = useTranslation('expenses');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);

  const categoryLabel =
    categoryIds.length === 0
      ? t('filters.category')
      : t('common:multiSelect.selectedCount', { count: categoryIds.length });

  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <View style={[styles.shell, { backgroundColor: c.muted }]}>
        <Search size={16} color={c.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: c.foreground }]}
          placeholder={t('filters.searchTransactions')}
          placeholderTextColor={c.mutedForeground}
          value={search}
          onChangeText={onSearchChange}
          autoCapitalize='none'
          returnKeyType='search'
        />
      </View>

      <View style={styles.row}>
        <DropdownPill
          icon={<Shapes size={16} color={c.mutedForeground} />}
          label={categoryLabel}
          active={categoryIds.length > 0}
          onPress={() => setCategoryOpen(true)}
        />
        <DropdownPill
          icon={<Calendar size={16} color={c.mutedForeground} />}
          label={t(PERIOD_KEY[period])}
          active
          onPress={() => setPeriodOpen(true)}
        />
      </View>

      <CategoryMultiSelect
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        selected={categoryIds}
        onChange={onCategoryIdsChange}
      />
      <PeriodSelect
        open={periodOpen}
        value={period}
        onClose={() => setPeriodOpen(false)}
        onChange={(p) => {
          onPeriodChange(p);
          setPeriodOpen(false);
        }}
      />
    </View>
  );
}

function DropdownPill({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole='button'
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: c.muted, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {icon}
      <Text
        numberOfLines={1}
        style={[
          styles.pillLabel,
          { color: active ? c.foreground : c.mutedForeground },
        ]}
      >
        {label}
      </Text>
      <ChevronDown size={16} color={c.mutedForeground} />
    </Pressable>
  );
}

function PeriodSelect({
  open,
  value,
  onClose,
  onChange,
}: {
  open: boolean;
  value: ListPeriod;
  onClose: () => void;
  onChange: (period: ListPeriod) => void;
}) {
  const c = useTheme();
  const { t } = useTranslation('expenses');
  const insets = useSafeAreaInsets();
  const options: ListPeriod[] = ['today', 'week', 'month'];

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
            {t('period.title')}
          </Text>
          <Pressable
            hitSlop={8}
            accessibilityRole='button'
            accessibilityLabel={t('common:actions.close')}
            onPress={onClose}
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
          {options.map((o) => (
            <Pressable
              key={o}
              onPress={() => onChange(o)}
              style={styles.periodOption}
            >
              <Text style={[styles.periodText, { color: c.foreground }]}>
                {t(PERIOD_KEY[o])}
              </Text>
              {o === value ? <Check size={18} color={c.primary} /> : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
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
                <View
                  key={group.tier?.id ?? '__untiered__'}
                  style={styles.group}
                >
                  <Text
                    style={[styles.groupLabel, { color: c.mutedForeground }]}
                  >
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
                        <Text
                          style={[styles.optionText, { color: c.foreground }]}
                        >
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
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
  row: { flexDirection: 'row', gap: Spacing.two },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  pillLabel: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
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
    gap: Spacing.three,
  },
  loader: { marginVertical: Spacing.four },
  periodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  periodText: { fontFamily: Fonts.medium, fontSize: 16 },
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
