import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { Fonts, Spacing } from '@/constants/theme';
import { Card, Notice, Pill, Sheet } from '@/components/ui';
import { CategoryBadge } from '@/components/category-badge';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { deleteEssential } from '@/features/essentials/api';
import { EssentialForm } from '@/features/essentials/components/essential-form';
import { MonthlyBaselineSummary } from '@/features/essentials/components/monthly-baseline-summary';
import { useEssentials } from '@/features/essentials/hooks/use-essentials';
import type { EssentialWithCategory } from '@/features/essentials/types';
import { useTheme } from '@/hooks/use-theme';

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; row: EssentialWithCategory }
  | null;

export type EssentialsManagerHandle = { openCreate: () => void };

interface EssentialsManagerProps {
  /** Show the inline top-row "Add" pill. Off on the standalone screen, which
   * provides the action in the header instead. */
  inlineAdd?: boolean;
}

// Essentials list + baseline summary + create/edit/delete, mirroring the web
// essentials page. The Stack header supplies the large title; this renders a
// plain View so the screen owns the scroll container (like CategoriesManager).
// The standalone screen drives creation from the header via the imperative
// `openCreate` handle; the onboarding wizard uses the inline add pill.
export const EssentialsManager = forwardRef<
  EssentialsManagerHandle,
  EssentialsManagerProps
>(function EssentialsManager({ inlineAdd = true }, ref) {
  const c = useTheme();
  const { t } = useTranslation('essentials');
  const { profile } = useAuth();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const { essentials, tiers, baseline, loading, error, refetch } =
    useEssentials(base);
  const [dialog, setDialog] = useState<DialogState>(null);

  useImperativeHandle(ref, () => ({
    openCreate: () => setDialog({ kind: 'create' }),
  }));

  function confirmDelete(row: EssentialWithCategory) {
    Alert.alert(t('dialog.delete.title'), t('dialog.delete.description'), [
      { text: t('common:actions.cancel'), style: 'cancel' },
      {
        text: t('common:actions.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error: delError } = await deleteEssential(row.id);
          if (delError) {
            Alert.alert(t('toast.deleteError'));
            return;
          }
          refetch();
        },
      },
    ]);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          {t('page.subtitle')}
        </Text>
        {inlineAdd ? (
          <Pill
            tone='primary'
            systemImage='plus'
            label={t('page.addButton')}
            leading={<Plus size={16} color={c.primaryForeground} />}
            onPress={() => setDialog({ kind: 'create' })}
          />
        ) : null}
      </View>

      {error ? <Notice tone='error'>{error}</Notice> : null}

      {loading ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : essentials.length === 0 ? (
        <Text style={[styles.empty, { color: c.mutedForeground }]}>
          {t('table.empty')}
        </Text>
      ) : (
        <Card padding={0} style={styles.card}>
          {essentials.map((row, i) => (
            <View
              key={row.id}
              style={[
                styles.row,
                i > 0 && {
                  borderTopColor: c.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <CategoryBadge
                icon={row.category?.icon}
                color={row.category?.color}
                size={32}
              />
              <View style={styles.rowText}>
                <Text style={[styles.name, { color: c.foreground }]}>
                  {row.name}
                </Text>
                {row.category ? (
                  <Text style={[styles.category, { color: c.mutedForeground }]}>
                    {row.category.name}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.amount, { color: c.foreground }]}>
                {formatCurrency(
                  Number(row.estimated_amount),
                  row.currency as CurrencyCode
                )}
              </Text>
              <IconButton
                onPress={() => setDialog({ kind: 'edit', row })}
                accessibilityLabel={t('table.editLabel')}
              >
                <Pencil size={16} color={c.mutedForeground} />
              </IconButton>
              <IconButton
                onPress={() => confirmDelete(row)}
                accessibilityLabel={t('table.deleteLabel')}
              >
                <Trash2 size={16} color={c.destructive} />
              </IconButton>
            </View>
          ))}
        </Card>
      )}

      {!loading && essentials.length > 0 ? (
        <MonthlyBaselineSummary baseline={baseline} tiers={tiers} base={base} />
      ) : null}

      <FormModal
        dialog={dialog}
        onClose={() => setDialog(null)}
        onSuccess={() => {
          setDialog(null);
          refetch();
        }}
      />
    </View>
  );
});

function FormModal({
  dialog,
  onClose,
  onSuccess,
}: {
  dialog: DialogState;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation('essentials');
  const title =
    dialog?.kind === 'edit' ? t('dialog.edit.title') : t('dialog.create.title');

  return (
    <Sheet visible={dialog !== null} onClose={onClose} title={title}>
      {dialog?.kind === 'edit' ? (
        <EssentialForm
          mode='edit'
          defaultValues={{
            id: dialog.row.id,
            name: dialog.row.name,
            estimated_amount: Number(dialog.row.estimated_amount),
            currency: dialog.row.currency as CurrencyCode,
            category_id: dialog.row.category_id ?? '',
          }}
          onSuccess={onSuccess}
        />
      ) : dialog?.kind === 'create' ? (
        <EssentialForm mode='create' onSuccess={onSuccess} />
      ) : null}
    </Sheet>
  );
}

function IconButton({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole='button'
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconButton,
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  subtitle: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  loader: { marginVertical: Spacing.four },
  empty: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  card: { paddingHorizontal: Spacing.three },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  rowText: { flex: 1, gap: 2 },
  name: { fontFamily: Fonts.medium, fontSize: 15 },
  category: { fontFamily: Fonts.regular, fontSize: 13 },
  amount: { fontFamily: Fonts.semibold, fontSize: 15 },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
