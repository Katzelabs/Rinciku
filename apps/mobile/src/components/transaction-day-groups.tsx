import { StyleSheet, View } from 'react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { Spacing } from '@/constants/theme';
import { AppText, Card, SectionHeader } from '@/components/ui';
import { TransactionRow } from '@/components/transaction-row';
import { useTheme } from '@/hooks/use-theme';

export interface DayGroup<Row> {
  key: string;
  label: string;
  subtotal: number;
  rows: Row[];
}

/** The fields TransactionDayGroups needs to render a single row. */
export interface DayGroupRow {
  id: string;
  icon?: string | null;
  color?: string | null;
  title: string;
  subtitle?: string | null;
  amount: number;
  currency: CurrencyCode;
  onPress: () => void;
}

interface TransactionDayGroupsProps<Row> {
  groups: DayGroup<Row>[];
  base: CurrencyCode;
  /** Income tints amounts + subtotals with the primary color and prefixes '+'. */
  tone?: 'expense' | 'income';
  /** Map a raw row to the fields the transaction row renders. */
  getRow: (row: Row) => DayGroupRow;
}

/**
 * The day-grouped transaction list (uppercase date header + subtotal over a card
 * of rows) shared by the expenses and incomes screens. Was a byte-identical tree
 * duplicated across both; only the income `+`/primary tint differs.
 */
export function TransactionDayGroups<Row>({
  groups,
  base,
  tone = 'expense',
  getRow,
}: TransactionDayGroupsProps<Row>) {
  const c = useTheme();
  const isIncome = tone === 'income';

  return (
    <>
      {groups.map((group) => (
        <View key={group.key} style={styles.section}>
          <SectionHeader
            variant='overline'
            title={group.label}
            right={
              <AppText
                variant='amountSmall'
                color={isIncome ? 'primary' : 'foreground'}
              >
                {isIncome && group.subtotal > 0 ? '+' : ''}
                {formatCurrency(group.subtotal, base)}
              </AppText>
            }
          />
          <Card padding={0} style={styles.rowsCard}>
            {group.rows.map((raw, i) => {
              const row = getRow(raw);
              return (
                <TransactionRow
                  key={row.id}
                  icon={row.icon}
                  color={row.color}
                  title={row.title}
                  subtitle={row.subtitle}
                  amount={row.amount}
                  currency={row.currency}
                  sign={isIncome ? '+' : undefined}
                  amountColor={isIncome ? c.primary : undefined}
                  topBorder={i > 0}
                  onPress={row.onPress}
                />
              );
            })}
          </Card>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.one },
  rowsCard: { paddingHorizontal: Spacing.three },
});
