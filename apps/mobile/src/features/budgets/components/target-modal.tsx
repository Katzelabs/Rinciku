import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import type { CurrencyCode } from '@rinciku/core';

import { CurrencyAmountInput } from '@/components/currency-amount-input';
import { Fonts, Spacing } from '@/constants/theme';
import { Button } from '@/features/auth/components/button';
import { FieldError, FieldLabel } from '@/features/auth/components/text-field';
import {
  makeBudgetTargetSchema,
  type BudgetTargetInput,
} from '@/features/budgets/schemas';
import { useTheme } from '@/hooks/use-theme';

type TargetModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  defaultAmount: number | null;
  // Locked to the user's base on create; preserves the stored currency on edit.
  currency: CurrencyCode;
  onSave: (amount: number, currency: CurrencyCode) => Promise<void>;
  // Provided only when an existing target can be removed (unset).
  onRemove?: () => Promise<void>;
};

// Bottom-sheet form to set / edit / remove a single budget target. RN counterpart
// to the web TargetDialog; reuses the shared CurrencyAmountInput + Zod schema.
export function TargetModal({
  visible,
  onClose,
  title,
  defaultAmount,
  currency,
  onSave,
  onRemove,
}: TargetModalProps) {
  const c = useTheme();
  const { t } = useTranslation('budgets');
  const insets = useSafeAreaInsets();
  const [removing, setRemoving] = useState(false);
  const schema = useMemo(() => makeBudgetTargetSchema(t), [t]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<BudgetTargetInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: defaultAmount ?? (undefined as unknown as number),
      currency,
    },
  });

  // Re-seed the form whenever the sheet opens for a different target.
  useEffect(() => {
    if (visible) {
      reset({
        amount: defaultAmount ?? (undefined as unknown as number),
        currency,
      });
    }
  }, [visible, defaultAmount, currency, reset]);

  const submit = handleSubmit(async (values) => {
    await onSave(values.amount, values.currency);
  });

  async function handleRemove() {
    if (!onRemove) return;
    setRemoving(true);
    try {
      await onRemove();
    } finally {
      setRemoving(false);
    }
  }

  const busy = isSubmitting || removing;

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: c.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.foreground }]}>{title}</Text>
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
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + Spacing.five },
          ]}
        >
          <Controller
            control={control}
            name='amount'
            render={({ field, fieldState }) => (
              <View style={styles.field}>
                <FieldLabel>{t('dialog.monthlyTarget')}</FieldLabel>
                <CurrencyAmountInput
                  currency={currency}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={fieldState.invalid}
                />
                <FieldError message={fieldState.error?.message} />
              </View>
            )}
          />

          <Button
            label={isSubmitting ? t('dialog.saving') : t('dialog.saveTarget')}
            loading={isSubmitting}
            disabled={busy}
            onPress={submit}
          />
          {onRemove ? (
            <Button
              variant='ghost'
              label={removing ? t('dialog.removing') : t('dialog.removeTarget')}
              loading={removing}
              disabled={busy}
              onPress={handleRemove}
            />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  title: { fontFamily: Fonts.bold, fontSize: 20 },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  field: { gap: Spacing.two },
});
