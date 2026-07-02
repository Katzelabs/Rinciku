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
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';
import type { Tables } from '@rinciku/db';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { Card, Notice, Pill, Sheet } from '@/components/ui';
import { CategoryBadge } from '@/components/category-badge';
import {
  deleteCategory,
  deleteTier,
  listCategories,
  listTiers,
} from '@/features/categories/api';
import { CategoryForm } from '@/features/categories/components/category-form';
import { TierForm } from '@/features/categories/components/tier-form';
import {
  groupByTier,
  MAX_CATEGORIES_PER_TIER,
  MAX_TIERS,
  type Tier,
  type TierGroup,
} from '@/features/categories/types';
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
          <Pill
            tone='primary'
            leading={<Plus size={16} color={c.primaryForeground} />}
            label={t('spending.addTier')}
            onPress={() => setDialog({ kind: 'create-tier' })}
            disabled={loading || atTierLimit}
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
  const { t } = useTranslation('categories');

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
    <Sheet visible={dialog !== null} onClose={onClose} title={title}>
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
    </Sheet>
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
    <Card padding={Spacing.three} style={styles.card}>
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
          <Pill
            tone='outline'
            leading={<Plus size={15} color={c.foreground} />}
            label={t('tier.addCategory')}
            onPress={() => onAddCategory(tier.id)}
            disabled={atCategoryLimit}
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
              <CategoryBadge
                icon={category.icon}
                color={category.color}
                size={32}
              />
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
    </Card>
  );
}

// --- small building blocks -------------------------------------------------

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
  card: { gap: Spacing.two },
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
  categoryName: { flex: 1, fontFamily: Fonts.medium, fontSize: 15 },
  empty: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.three,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
