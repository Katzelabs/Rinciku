import { StyleSheet } from 'react-native';

import { type CurrencyCode } from '@rinciku/core';

import { CurrencyAmountInput } from '@/components/currency-amount-input';
import { AppText, Card, FieldError } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

// The amount-first hero of the create/edit forms: a big, shell-less currency
// entry framed by a soft tone wash (income green, expense warm-neutral) so the
// figure you're logging is the visual anchor — matching the list summary
// headers and detail hero. Wraps the shared CurrencyAmountInput's `hero`
// variant so money entry stays on one code path everywhere.
export function AmountHeroField({
  tone,
  label,
  currency,
  value,
  onChange,
  onBlur,
  error,
}: {
  tone: 'expense' | 'income';
  label: string;
  currency: CurrencyCode;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  error?: string;
}) {
  const c = useTheme();
  const accent = tone === 'income' ? c.positive : c.expense;

  return (
    <Card
      style={[
        styles.card,
        {
          backgroundColor: withAlpha(accent, '14'),
          borderColor: withAlpha(accent, '33'),
        },
      ]}
    >
      <AppText variant='amountSmall' color='mutedForeground'>
        {label}
      </AppText>
      <CurrencyAmountInput
        variant='hero'
        currency={currency}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        invalid={!!error}
      />
      <FieldError message={error} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
});
