import { StyleSheet, View } from 'react-native';

import { Card, Skeleton } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * First-load placeholder for the expenses/incomes screens: one day-group
 * section shaped exactly like `TransactionDayGroups` (overline header +
 * subtotal over a card of rows), so the loaded list lands without layout
 * shift. Row anatomy mirrors `TransactionRow`: 40pt category badge, title +
 * subtitle lines, trailing amount.
 */
export function TransactionListSkeleton({ rows = 5 }: { rows?: number }) {
  const c = useTheme();

  return (
    <View
      style={styles.section}
      importantForAccessibility='no-hide-descendants'
    >
      <View style={styles.header}>
        <Skeleton width={88} height={12} radius={Radius.sm} />
        <Skeleton width={72} height={14} radius={Radius.sm} />
      </View>
      <Card padding={0}>
        {Array.from({ length: rows }, (_, i) => (
          <View
            key={i}
            style={[
              styles.row,
              i > 0 && {
                borderTopColor: c.border,
                borderTopWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <Skeleton width={40} height={40} radius={Radius.xl} />
            <View style={styles.text}>
              <Skeleton width='55%' height={14} radius={Radius.sm} />
              <Skeleton width='35%' height={11} radius={Radius.sm} />
            </View>
            <Skeleton width={72} height={14} radius={Radius.sm} />
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.one },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  text: { flex: 1, gap: 6 },
});
