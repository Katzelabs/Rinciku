import {
  forwardRef,
  type ReactNode,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
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
import type { Tables } from '@rinciku/db';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import {
  deleteCategory,
  deleteTier,
  listCategories,
  listTiers,
} from '@/features/categories/api';
import { CategoryForm } from '@/features/categories/components/category-form';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { TierForm } from '@/features/categories/components/tier-form';
import {
  groupByTier,
  MAX_CATEGORIES_PER_TIER,
  MAX_TIERS,
  type Tier,
  type TierGroup,
} from '@/features/categories/types';
import { Notice } from '@/features/auth/components/notice';
import { useTheme } from '@/hooks/use-theme';

type Category = Tables<'categories'>;

type DialogState =
  | { kind: 'create-category'; tierId: string }
  | { kind: 'edit-category'; row: Category }
  | { kind: 'create-tier' }
  | { kind: 'edit-tier'; row: Tier }
  | null;

type FetchState = {
  key: number;
  categories: Category[];
  tiers: Tier[];
  error: string | null;
};

export type CategoriesManagerHandle = { openCreate: () => void };

interface CategoriesManagerProps {
  /** Show the inline top-row "Add tier" pill. Off on the standalone screen,
   * which provides the action in the header instead. */
  inlineAdd?: boolean;
}

// Full tiers + categories CRUD, mirroring the web onboarding review step. Reused
// by the onboarding wizard (inline add pill) and the standalone categories
// screen (header "+" via the imperative `openCreate` handle → new tier).
// Tiers/categories already exist (seeded at signup); edits persist immediately
// via the shared api and a refetch.
export const CategoriesManager = forwardRef<
  CategoriesManagerHandle,
  CategoriesManagerProps
>(function CategoriesManager({ inlineAdd = true }, ref) {
  const c = useTheme();
  const { t } = useTranslation('categories');
  const [refetchToken, setRefetchToken] = useState(0);
  const [data, setData] = useState<FetchState | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  useImperativeHandle(ref, () => ({
    openCreate: () => setDialog({ kind: 'create-tier' }),
  }));

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCategories(), listTiers()]).then(([cats, tiers]) => {
      if (cancelled) return;
      setData({
        key: refetchToken,
        categories: cats.data ?? [],
        tiers: tiers.data ?? [],
        error: cats.error?.message ?? tiers.error?.message ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  const loading = data?.key !== refetchToken;
  const error = data?.error ?? null;
  const tiers = data?.tiers ?? [];
  const groups: TierGroup[] | null =
    !loading && data ? groupByTier(data.categories, data.tiers) : null;

  function refetch() {
    setRefetchToken((n) => n + 1);
  }

  function confirmDeleteCategory(row: Category) {
    Alert.alert(
      t('dialog.delete.categoryTitle'),
      `${row.name} ${t('dialog.delete.categoryDescription')}`,
      [
        { text: t('common:actions.cancel'), style: 'cancel' },
        {
          text: t('common:actions.delete'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteCategory(row.id);
            if (error) {
              Alert.alert(t('toast.deleteCategoryError'));
              return;
            }
            refetch();
          },
        },
      ]
    );
  }

  function confirmDeleteTier(row: Tier) {
    Alert.alert(
      t('dialog.delete.tierTitle'),
      `${row.name} ${t('dialog.delete.tierDescription')}`,
      [
        { text: t('common:actions.cancel'), style: 'cancel' },
        {
          text: t('common:actions.delete'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteTier(row.id);
            if (error) {
              Alert.alert(t('toast.deleteTierError'));
              return;
            }
            refetch();
          },
        },
      ]
    );
  }

  const atTierLimit = tiers.length >= MAX_TIERS;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
          {t('spending.subtitle')}
          {!loading ? `  ${tiers.length}/${MAX_TIERS}` : ''}
        </Text>
        {inlineAdd ? (
          <PillButton
            icon={<Plus size={16} color={c.primaryForeground} />}
            label={t('spending.addTier')}
            onPress={() => setDialog({ kind: 'create-tier' })}
            disabled={loading || atTierLimit}
            tone='primary'
          />
        ) : null}
      </View>

      {error ? <Notice tone='error'>{error}</Notice> : null}

      {loading ? (
        <ActivityIndicator color={c.primary} style={styles.loader} />
      ) : (
        groups?.map((group) => (
          <TierCard
            key={group.tier?.id ?? '__untiered__'}
            group={group}
            onAddCategory={(tierId) =>
              setDialog({ kind: 'create-category', tierId })
            }
            onEditTier={(row) => setDialog({ kind: 'edit-tier', row })}
            onDeleteTier={confirmDeleteTier}
            onEditCategory={(row) => setDialog({ kind: 'edit-category', row })}
            onDeleteCategory={confirmDeleteCategory}
          />
        ))
      )}

      <FormModal
        dialog={dialog}
        tiers={tiers}
        onClose={() => setDialog(null)}
        onSuccess={() => {
          setDialog(null);
          refetch();
        }}
      />
    </View>
  );
});

// --- form modal ------------------------------------------------------------

function FormModal({
  dialog,
  tiers,
  onClose,
  onSuccess,
}: {
  dialog: DialogState;
  tiers: Tier[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const c = useTheme();
  const { t } = useTranslation('categories');
  const insets = useSafeAreaInsets();
  const visible = dialog !== null;

  const title = !dialog
    ? ''
    : dialog.kind === 'create-category'
      ? t('dialog.category.addTitle')
      : dialog.kind === 'edit-category'
        ? t('dialog.category.editTitle')
        : dialog.kind === 'create-tier'
          ? t('dialog.tier.addTitle')
          : t('dialog.tier.editTitle');

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
          {dialog?.kind === 'create-category' && (
            <CategoryForm
              mode='create'
              tiers={tiers}
              defaultValues={{ tier_id: dialog.tierId }}
              onSuccess={onSuccess}
            />
          )}
          {dialog?.kind === 'edit-category' && (
            <CategoryForm
              mode='edit'
              tiers={tiers}
              defaultValues={{
                id: dialog.row.id,
                name: dialog.row.name,
                tier_id: dialog.row.tier_id ?? tiers[0]?.id ?? '',
                icon: dialog.row.icon ?? '',
                color: dialog.row.color ?? '',
              }}
              onSuccess={onSuccess}
            />
          )}
          {dialog?.kind === 'create-tier' && (
            <TierForm
              mode='create'
              nextSortOrder={tiers.length}
              onSuccess={onSuccess}
            />
          )}
          {dialog?.kind === 'edit-tier' && (
            <TierForm
              mode='edit'
              defaultValues={{
                id: dialog.row.id,
                name: dialog.row.name,
                color: dialog.row.color ?? '',
                is_essential: dialog.row.is_essential,
              }}
              onSuccess={onSuccess}
            />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// --- tier card -------------------------------------------------------------

type TierCardProps = {
  group: TierGroup;
  onAddCategory: (tierId: string) => void;
  onEditTier: (row: Tier) => void;
  onDeleteTier: (row: Tier) => void;
  onEditCategory: (row: Category) => void;
  onDeleteCategory: (row: Category) => void;
};

function TierCard({
  group,
  onAddCategory,
  onEditTier,
  onDeleteTier,
  onEditCategory,
  onDeleteCategory,
}: TierCardProps) {
  const c = useTheme();
  const { t } = useTranslation('categories');
  const { tier, categories } = group;
  const atCategoryLimit = categories.length >= MAX_CATEGORIES_PER_TIER;

  return (
    <View
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.dot,
            { backgroundColor: tier?.color ?? c.mutedForeground },
          ]}
        />
        <Text style={[styles.tierName, { color: c.foreground }]}>
          {tier ? tier.name : t('tier.untiered')}
        </Text>
        {tier?.is_essential ? (
          <View style={[styles.badge, { backgroundColor: c.muted }]}>
            <Text style={[styles.badgeText, { color: c.mutedForeground }]}>
              {t('tier.essentialBadge')}
            </Text>
          </View>
        ) : null}
        {tier ? (
          <Text style={[styles.count, { color: c.mutedForeground }]}>
            {categories.length}/{MAX_CATEGORIES_PER_TIER}
          </Text>
        ) : null}
      </View>

      {tier ? (
        <View style={styles.cardActions}>
          <PillButton
            icon={<Plus size={15} color={c.foreground} />}
            label={t('tier.addCategory')}
            onPress={() => onAddCategory(tier.id)}
            disabled={atCategoryLimit}
            tone='outline'
          />
          <IconButton
            onPress={() => onEditTier(tier)}
            accessibilityLabel={t('tier.edit')}
          >
            <Pencil size={17} color={c.mutedForeground} />
          </IconButton>
          <IconButton
            onPress={() => onDeleteTier(tier)}
            accessibilityLabel={t('tier.delete')}
          >
            <Trash2 size={17} color={c.destructive} />
          </IconButton>
        </View>
      ) : null}

      {categories.length > 0 ? (
        <View>
          {categories.map((category, i) => (
            <View
              key={category.id}
              style={[
                styles.categoryRow,
                i > 0 && {
                  borderTopColor: c.border,
                  borderTopWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: `${category.color ?? '#8d8d8d'}22` },
                ]}
              >
                <CategoryIcon
                  name={category.icon}
                  size={16}
                  color={category.color ?? c.foreground}
                />
              </View>
              <Text style={[styles.categoryName, { color: c.foreground }]}>
                {category.name}
              </Text>
              <IconButton
                onPress={() => onEditCategory(category)}
                accessibilityLabel={t('category.edit')}
              >
                <Pencil size={16} color={c.mutedForeground} />
              </IconButton>
              <IconButton
                onPress={() => onDeleteCategory(category)}
                accessibilityLabel={t('category.delete')}
              >
                <Trash2 size={16} color={c.destructive} />
              </IconButton>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.empty, { color: c.mutedForeground }]}>
          {t('tier.empty')}
        </Text>
      )}
    </View>
  );
}

// --- small building blocks -------------------------------------------------

function PillButton({
  icon,
  label,
  onPress,
  disabled,
  tone,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone: 'primary' | 'outline';
}) {
  const c = useTheme();
  const primary = tone === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      style={({ pressed }) => [
        styles.pill,
        primary
          ? { backgroundColor: c.primary }
          : {
              borderColor: c.border,
              borderWidth: StyleSheet.hairlineWidth * 2,
            },
        { opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.pillLabel,
          { color: primary ? c.primaryForeground : c.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function IconButton({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
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
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius['2xl'],
    borderCurve: 'continuous',
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 10, height: 10, borderRadius: Radius.pill },
  tierName: { fontFamily: Fonts.semibold, fontSize: 16 },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeText: { fontFamily: Fonts.medium, fontSize: 11 },
  count: { marginLeft: 'auto', fontFamily: Fonts.regular, fontSize: 13 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
  empty: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderCurve: 'continuous',
  },
  pillLabel: { fontFamily: Fonts.semibold, fontSize: 14 },
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
