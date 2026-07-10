import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { Plus } from 'lucide-react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { Spacing } from '@/constants/theme';
import { AppText, Card, Notice, Pill, Sheet } from '@/components/ui';
import { CategoryBadge } from '@/components/category-badge';
import { SwipeRow } from '@/components/swipe-row';
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
// essentials page. Rows are tap-to-edit / swipe-to-delete (see SwipeRow) so the
// name + amount aren't crowded by inline action buttons. Renders a plain View so
// the host screen owns the scroll container (like CategoriesManager). The
// standalone screen drives creation from the header via the imperative
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
        <AppText variant='caption' color='mutedForeground' style={styles.flex}>
          {t('page.subtitle')}
        </AppText>
        {inlineAdd ? (
          <Pill
            tone='primary'
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
        <AppText variant='label' color='mutedForeground' style={styles.empty}>
          {t('table.empty')}
        </AppText>
      ) : (
        <Card padding={0} style={styles.card}>
          {essentials.map((row, i) => (
            <SwipeRow
              key={row.id}
              topBorder={i > 0}
              deleteLabel={t('table.deleteLabel')}
              onPress={() => setDialog({ kind: 'edit', row })}
              onDelete={() => confirmDelete(row)}
            >
              <CategoryBadge
                icon={row.category?.icon}
                color={row.category?.color}
                size={32}
              />
              <View style={styles.rowText}>
                <AppText variant='bodyMedium'>{row.name}</AppText>
                {row.category ? (
                  <AppText variant='caption' color='mutedForeground'>
                    {row.category.name}
                  </AppText>
                ) : null}
              </View>
              <AppText variant='amount'>
                {formatCurrency(
                  Number(row.estimated_amount),
                  row.currency as CurrencyCode
                )}
              </AppText>
            </SwipeRow>
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
            notes: dialog.row.notes ?? '',
          }}
          onSuccess={onSuccess}
        />
      ) : dialog?.kind === 'create' ? (
        <EssentialForm mode='create' onSuccess={onSuccess} />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  flex: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  loader: { marginVertical: Spacing.four },
  empty: { textAlign: 'center', paddingVertical: Spacing.four },
  // overflow hidden so a swiped row's red delete action is clipped to the
  // card's rounded corners; rows own their horizontal padding (SwipeRow).
  card: { overflow: 'hidden' },
  rowText: { flex: 1, gap: 2 },
});
