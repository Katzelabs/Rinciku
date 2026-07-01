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
import { Pencil, Trash2, X } from 'lucide-react-native';
import type { Tables } from '@rinciku/db';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { Notice } from '@/features/auth/components/notice';
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
          <View
            style={[
              styles.card,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
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
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: `${source.color ?? '#8d8d8d'}22` },
                  ]}
                >
                  <CategoryIcon
                    name={source.icon}
                    size={16}
                    color={source.color ?? c.foreground}
                  />
                </View>
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
          </View>
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
  const c = useTheme();
  const { t } = useTranslation('incomes');
  const insets = useSafeAreaInsets();
  const visible = dialog !== null;

  const title = !dialog
    ? ''
    : dialog.kind === 'create'
      ? t('categories.createTitle')
      : t('categories.editTitle');

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
  subtitle: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
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
  name: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
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
