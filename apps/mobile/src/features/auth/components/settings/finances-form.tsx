import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import {
  CURRENCY_CODES,
  CURRENCY_NAMES,
  currencySymbol,
  type CurrencyCode,
} from '@rinciku/core';

import { Button, Card, FieldLabel, InputShell } from '@/components/ui';
import { CurrencyAmountInput } from '@/components/currency-amount-input';
import { updateProfile } from '@/features/auth/api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Finances page form: base currency, expected monthly income, and the budget
// cycle start day — saved together in one updateProfile call. Extracted from
// the old settings screen (currency picker markup preserved).
export function FinancesForm() {
  const c = useTheme();
  const { t } = useTranslation('auth');
  const { user, profile, refreshProfile } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode>(
    (CURRENCY_CODES as readonly string[]).includes(profile?.base_currency ?? '')
      ? (profile!.base_currency as CurrencyCode)
      : 'IDR'
  );
  const [income, setIncome] = useState<number | undefined>(
    profile?.expected_monthly_income ?? undefined
  );
  const [day, setDay] = useState(
    profile?.month_start_day != null ? String(profile.month_start_day) : '1'
  );
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, {
        base_currency: currency,
        expected_monthly_income: income ?? 0,
        month_start_day: Number(day || 1),
      });
      await refreshProfile();
      Alert.alert(t('financial.updated'));
    } catch {
      Alert.alert(t('financial.updateError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card style={styles.card}>
      <FieldLabel>{t('profileFields.baseCurrency')}</FieldLabel>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={[styles.select, { borderColor: c.border }]}
      >
        <Text style={[styles.selectText, { color: c.foreground }]}>
          {currencySymbol(currency)} · {currency} · {CURRENCY_NAMES[currency]}
        </Text>
        <Text style={{ color: c.mutedForeground }}>{open ? '▲' : '▼'}</Text>
      </Pressable>
      {open ? (
        <View style={[styles.currencyList, { borderColor: c.border }]}>
          {CURRENCY_CODES.map((code, i) => (
            <Pressable
              key={code}
              onPress={() => {
                setCurrency(code);
                setOpen(false);
              }}
              style={[
                styles.currencyRow,
                i > 0 && {
                  borderTopColor: c.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
                code === currency && { backgroundColor: c.muted },
              ]}
            >
              <Text style={[styles.currencySymbol, { color: c.foreground }]}>
                {currencySymbol(code)}
              </Text>
              <Text style={[styles.currencyName, { color: c.foreground }]}>
                {code} · {CURRENCY_NAMES[code]}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <FieldLabel>{t('profileFields.expectedIncome')}</FieldLabel>
      <CurrencyAmountInput
        currency={currency}
        value={income}
        onChange={setIncome}
      />

      <FieldLabel>{t('profileFields.cycleStartDay')}</FieldLabel>
      <InputShell>
        <TextInput
          style={[styles.input, { color: c.foreground }]}
          keyboardType='numeric'
          value={day}
          onChangeText={(v) => setDay(v.replace(/[^0-9]/g, ''))}
        />
      </InputShell>

      <Button label={t('profileForm.save')} loading={saving} onPress={save} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  input: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 16,
    paddingVertical: Spacing.three,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  selectText: { fontFamily: Fonts.medium, fontSize: 15 },
  currencyList: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  currencySymbol: {
    minWidth: 36,
    fontFamily: Fonts.medium,
    fontSize: 15,
  },
  currencyName: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
});
