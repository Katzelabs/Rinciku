import { type ReactNode, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Trash2 } from 'lucide-react-native';

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
  /** When set, the row is swipe-left-to-delete. Route through your own confirm. */
  onDelete?: () => void;
  /** Accessibility label for the revealed delete action. */
  deleteLabel?: string;
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
 * duplicated across both; only the income `+`/primary tint differs. Rows opt into
 * swipe-to-delete by returning `onDelete` from `getRow`.
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
              const content = (
                <View style={[styles.rowInner, { backgroundColor: c.card }]}>
                  <TransactionRow
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
                </View>
              );

              return row.onDelete ? (
                <SwipeableRow
                  key={row.id}
                  onDelete={row.onDelete}
                  deleteLabel={row.deleteLabel ?? row.title}
                >
                  {content}
                </SwipeableRow>
              ) : (
                <View key={row.id}>{content}</View>
              );
            })}
          </Card>
        </View>
      ))}
    </>
  );
}

// Swipe-left-to-delete wrapper. Unlike SwipeRow it doesn't add its own pressable
// body — the child (a TransactionRow) already owns the tap gesture — it only
// layers the gesture + the revealed delete action, closing itself before firing.
function SwipeableRow({
  onDelete,
  deleteLabel,
  children,
}: {
  onDelete: () => void;
  deleteLabel: string;
  children: ReactNode;
}) {
  const c = useTheme();
  const ref = useRef<SwipeableMethods>(null);

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={deleteLabel}
          onPress={() => {
            ref.current?.close();
            onDelete();
          }}
          style={[styles.deleteAction, { backgroundColor: c.destructive }]}
        >
          <Trash2 size={20} color={c.destructiveForeground} />
        </Pressable>
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.one },
  // overflow hidden so a swiped row's red action clips to the card's rounded
  // corners; rows own their horizontal padding (full-bleed over the action).
  rowsCard: { overflow: 'hidden' },
  rowInner: { paddingHorizontal: Spacing.three },
  deleteAction: {
    width: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
