import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Calendar, Check, ChevronDown, Search, Shapes } from 'lucide-react-native';
import type { Tables } from '@rinciku/db';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { AppText, Card, Pill, Sheet } from '@/components/ui';
import { CategoryBadge } from '@/components/category-badge';
import { listCategories, listTiers } from '@/features/categories/api';
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
    <Card padding={Spacing.three} style={styles.card}>
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
        <Pill
          fill
          leading={<Shapes size={16} color={c.mutedForeground} />}
          trailing={<ChevronDown size={16} color={c.mutedForeground} />}
          label={categoryLabel}
          active={categoryIds.length > 0}
          onPress={() => setCategoryOpen(true)}
        />
        <Pill
          fill
          leading={<Calendar size={16} color={c.mutedForeground} />}
          trailing={<ChevronDown size={16} color={c.mutedForeground} />}
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
    </Card>
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
  const options: ListPeriod[] = ['today', 'week', 'month'];

  return (
    <Sheet visible={open} onClose={onClose} title={t('period.title')}>
      {options.map((o) => (
        <Pressable
          key={o}
          onPress={() => onChange(o)}
          style={styles.periodOption}
        >
          <AppText variant='body'>{t(PERIOD_KEY[o])}</AppText>
          {o === value ? <Check size={18} color={c.primary} /> : null}
        </Pressable>
      ))}
    </Sheet>
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
    <Sheet
      visible={open}
      onClose={onClose}
      title={t('filters.allCategories')}
      headerRight={
        selected.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => onChange([])}>
            <AppText variant='bodyMedium' color='primary'>
              {t('common:multiSelect.clear')}
            </AppText>
          </Pressable>
        ) : undefined
      }
    >
      {data === null ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : (
        groups.map((group) =>
          group.categories.length === 0 ? null : (
            <View key={group.tier?.id ?? '__untiered__'} style={styles.group}>
              <AppText variant='overline' color='mutedForeground'>
                {group.tier ? group.tier.name : t('form.untiered')}
              </AppText>
              {group.categories.map((cat) => {
                const checked = selectedSet.has(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => toggle(cat.id)}
                    style={styles.option}
                  >
                    <CategoryBadge icon={cat.icon} color={cat.color} size={32} />
                    <AppText variant='bodyMedium' style={styles.optionText}>
                      {cat.name}
                    </AppText>
                    {checked ? <Check size={18} color={c.primary} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )
        )
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
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
  loader: { marginVertical: Spacing.four },
  periodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  group: { gap: Spacing.one },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  optionText: { flex: 1 },
});
