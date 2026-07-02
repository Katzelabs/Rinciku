import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Calendar, Check, ChevronDown, Search, Wallet } from 'lucide-react-native';

import { formatDate } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { AppText, Card, Pill, Sheet } from '@/components/ui';
import { CategoryBadge } from '@/components/category-badge';
import { DateField } from '@/components/date-field';
import { Button } from '@/features/auth/components/button';
import { FieldLabel } from '@/features/auth/components/text-field';
import { useIncomeSources } from '@/features/incomes/hooks/use-income-sources';
import { useTheme } from '@/hooks/use-theme';

interface IncomeFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sourceIds: string[];
  onSourceIdsChange: (ids: string[]) => void;
  /** Inclusive date range currently applied (defaults to the monthly cycle). */
  from: Date;
  to: Date;
  onDateRangeChange: (from: Date, to: Date) => void;
}

// The transactions-list filter card: a full-width search on top, then a row of
// two dropdown pills (source + date range). Each opens a page-sheet; the source
// picker is multi-select, the date range picker lets the user pick an arbitrary
// from–to (default is the monthly cycle). Mirrors ExpenseFilters so both
// transaction lists read identically.
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
  const [sourceOpen, setSourceOpen] = useState(false);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  const sourceLabel =
    sourceIds.length === 0
      ? t('filters.source')
      : t('common:multiSelect.selectedCount', { count: sourceIds.length });

  const rangeLabel = `${formatDate(from, 'MMM d')} – ${formatDate(to, 'MMM d')}`;

  function openRange() {
    setDraftFrom(from);
    setDraftTo(to);
    setRangeOpen(true);
  }

  function applyRange() {
    onDateRangeChange(draftFrom, draftTo);
    setRangeOpen(false);
  }

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
          leading={<Wallet size={16} color={c.mutedForeground} />}
          trailing={<ChevronDown size={16} color={c.mutedForeground} />}
          label={sourceLabel}
          active={sourceIds.length > 0}
          onPress={() => setSourceOpen(true)}
        />
        <Pill
          fill
          leading={<Calendar size={16} color={c.mutedForeground} />}
          trailing={<ChevronDown size={16} color={c.mutedForeground} />}
          label={rangeLabel}
          active
          onPress={openRange}
        />
      </View>

      <SourceMultiSelect
        open={sourceOpen}
        onClose={() => setSourceOpen(false)}
        selected={sourceIds}
        onChange={onSourceIdsChange}
      />
      <Sheet
        visible={rangeOpen}
        onClose={() => setRangeOpen(false)}
        title={t('period.rangeTitle')}
      >
        <View style={styles.rangeField}>
          <FieldLabel>{t('period.from')}</FieldLabel>
          <DateField
            value={draftFrom}
            onChange={setDraftFrom}
            maximumDate={draftTo}
          />
        </View>
        <View style={styles.rangeField}>
          <FieldLabel>{t('period.to')}</FieldLabel>
          <DateField
            value={draftTo}
            onChange={setDraftTo}
            minimumDate={draftFrom}
          />
        </View>
        <Button
          label={t('common:actions.apply')}
          onPress={applyRange}
          style={styles.applyButton}
        />
      </Sheet>
    </Card>
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
  const { sources, loading } = useIncomeSources();

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
      title={t('filters.allSources')}
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
      {loading ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : sources.length === 0 ? (
        <AppText variant='body' color='mutedForeground' style={styles.empty}>
          {t('filters.noSources')}
        </AppText>
      ) : (
        sources.map((source) => {
          const checked = selectedSet.has(source.id);
          return (
            <Pressable
              key={source.id}
              onPress={() => toggle(source.id)}
              style={styles.option}
            >
              <CategoryBadge icon={source.icon} color={source.color} size={32} />
              <AppText variant='bodyMedium' style={styles.optionText}>
                {source.name}
              </AppText>
              {checked ? <Check size={18} color={c.primary} /> : null}
            </Pressable>
          );
        })
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
  empty: { textAlign: 'center', paddingVertical: Spacing.four },
  rangeField: { gap: Spacing.two },
  applyButton: { marginTop: Spacing.two },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  optionText: { flex: 1 },
});
