import { forwardRef, useImperativeHandle, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pencil, Plus, Trash2, X } from 'lucide-react-native';

import { formatCurrency, type CurrencyCode } from '@rinciku/core';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { Notice } from '@/features/auth/components/notice';
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
          <Pressable
            accessibilityRole='button'
            onPress={() => setDialog({ kind: 'create' })}
            style={({ pressed }) => [
              styles.addPill,
              { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Plus size={16} color={c.primaryForeground} />
            <Text style={[styles.addLabel, { color: c.primaryForeground }]}>
              {t('page.addButton')}
            </Text>
          </Pressable>
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
        <View
          style={[
            styles.card,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
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
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: `${row.category?.color ?? '#8d8d8d'}22` },
                ]}
              >
                <CategoryIcon
                  name={row.category?.icon}
                  size={16}
                  color={row.category?.color ?? c.foreground}
                />
              </View>
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
        </View>
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
  const c = useTheme();
  const { t } = useTranslation('essentials');
  const insets = useSafeAreaInsets();
  const visible = dialog !== null;
  const title =
    dialog?.kind === 'edit' ? t('dialog.edit.title') : t('dialog.create.title');

  return (
    <Modal
      visible={visible}
      animationType='slide'
      presentationStyle='pageSheet'
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: c.background }]}>
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: c.foreground }]}>
            {title}
          </Text>
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
            styles.sheetBody,
            { paddingBottom: insets.bottom + Spacing.five },
          ]}
        >
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
        </ScrollView>
      </View>
    </Modal>
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
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
  },
  addLabel: { fontFamily: Fonts.semibold, fontSize: 14 },
  loader: { marginVertical: Spacing.four },
  empty: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
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
  sheet: { flex: 1 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  sheetTitle: { fontFamily: Fonts.bold, fontSize: 20 },
  sheetBody: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
});
