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
import { Pencil, Trash2 } from 'lucide-react-native';
import type { Tables } from '@rinciku/db';

import { Fonts, Spacing } from '@/constants/theme';
import { Card, Notice, Sheet } from '@/components/ui';
import { CategoryBadge } from '@/components/category-badge';
import { deleteIncomeCategory } from '@/features/incomes/api';
import { IncomeSourceForm } from '@/features/incomes/components/income-source-form';
import { useIncomeSources } from '@/features/incomes/hooks/use-income-sources';
import { useTheme } from '@/hooks/use-theme';

type IncomeSource = Tables<'income_categories'>;

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; row: IncomeSource }
  | null;

// Max active income sources per user (enforced by a DB trigger; shown here as a
// count for the user's benefit).
const MAX_INCOME_SOURCES = 20;

export type IncomeSourcesManagerHandle = { openCreate: () => void };

// Flat income-source CRUD, mirroring CategoriesManager but without tiers. Reused
// by the standalone sources screen (header "+" via the imperative `openCreate`
// handle). Sources are seeded at signup; edits persist immediately + refetch.
export const IncomeSourcesManager = forwardRef<IncomeSourcesManagerHandle>(
  function IncomeSourcesManager(_props, ref) {
    const c = useTheme();
    const { t } = useTranslation('incomes');
    const { sources, loading, error, refetch } = useIncomeSources();
    const [dialog, setDialog] = useState<DialogState>(null);

    useImperativeHandle(ref, () => ({
      openCreate: () => setDialog({ kind: 'create' }),
    }));

    function confirmDelete(row: IncomeSource) {
      Alert.alert(
        t('categories.deleteTitle'),
        `${row.name}${t('categories.deleteDescriptionSuffix')}`,
        [
          { text: t('common:actions.cancel'), style: 'cancel' },
          {
            text: t('common:actions.delete'),
            style: 'destructive',
            onPress: async () => {
              const { error } = await deleteIncomeCategory(row.id);
              if (error) {
                Alert.alert(t('categories.deleteError'));
                return;
              }
              refetch();
            },
          },
        ]
      );
    }

    return (
      <View style={styles.wrap}>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          {t('categories.description')}
          {!loading ? `  ${sources.length}/${MAX_INCOME_SOURCES}` : ''}
        </Text>

        {error ? <Notice tone='error'>{error}</Notice> : null}

        {loading ? (
          <ActivityIndicator color={c.primary} style={styles.loader} />
        ) : sources.length === 0 ? (
          <Text style={[styles.empty, { color: c.mutedForeground }]}>
            {t('categories.empty')}
          </Text>
        ) : (
          <Card padding={0} style={styles.card}>
            {sources.map((source, i) => (
              <View
                key={source.id}
                style={[
                  styles.row,
                  i > 0 && {
                    borderTopColor: c.border,
                    borderTopWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <CategoryBadge
                  icon={source.icon}
                  color={source.color}
                  size={32}
                />
                <Text style={[styles.name, { color: c.foreground }]}>
                  {source.name}
                </Text>
                <IconButton
                  onPress={() => setDialog({ kind: 'edit', row: source })}
                  accessibilityLabel={t('actions.edit')}
                >
                  <Pencil size={16} color={c.mutedForeground} />
                </IconButton>
                <IconButton
                  onPress={() => confirmDelete(source)}
                  accessibilityLabel={t('table.deleteIncome')}
                >
                  <Trash2 size={16} color={c.destructive} />
                </IconButton>
              </View>
            ))}
          </Card>
        )}

        <FormModal
          dialog={dialog}
          nextSortOrder={sources.length}
          onClose={() => setDialog(null)}
          onSuccess={() => {
            setDialog(null);
            refetch();
          }}
        />
      </View>
    );
  }
);

function FormModal({
  dialog,
  nextSortOrder,
  onClose,
  onSuccess,
}: {
  dialog: DialogState;
  nextSortOrder: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation('incomes');

  const title = !dialog
    ? ''
    : dialog.kind === 'create'
      ? t('categories.createTitle')
      : t('categories.editTitle');

  return (
    <Sheet visible={dialog !== null} onClose={onClose} title={title}>
      {dialog?.kind === 'create' && (
        <IncomeSourceForm
          mode='create'
          nextSortOrder={nextSortOrder}
          onSuccess={onSuccess}
        />
      )}
      {dialog?.kind === 'edit' && (
        <IncomeSourceForm
          mode='edit'
          defaultValues={{
            id: dialog.row.id,
            name: dialog.row.name,
            icon: dialog.row.icon ?? '',
            color: dialog.row.color ?? '',
          }}
          onSuccess={onSuccess}
        />
      )}
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
  subtitle: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
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
  name: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
