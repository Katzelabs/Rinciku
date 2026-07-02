import {
  forwardRef,
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
  View,
} from 'react-native';
import { Pencil, Plus } from 'lucide-react-native';
import type { Tables } from '@rinciku/db';

import { Radius, Spacing } from '@/constants/theme';
import { AppText, Card, Notice, Pill, Sheet } from '@/components/ui';
import { CategoryBadge } from '@/components/category-badge';
import { SwipeRow } from '@/components/swipe-row';
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
// Category rows are tap-to-edit / swipe-to-delete (see SwipeRow); tiers edit by
// tapping the card header (Delete lives inside that sheet), and "+ Add category"
// is a full-width ghost row — replacing the old cramped inline icon buttons.
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
            setDialog(null);
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
        <AppText variant='caption' color='mutedForeground' style={styles.flex}>
          {t('spending.subtitle')}
          {!loading ? `  ${tiers.length}/${MAX_TIERS}` : ''}
        </AppText>
        {inlineAdd ? (
          <Pill
            tone='primary'
            systemImage='plus'
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
            onEditCategory={(row) => setDialog({ kind: 'edit-category', row })}
            onDeleteCategory={confirmDeleteCategory}
          />
        ))
      )}

      <FormModal
        dialog={dialog}
        tiers={tiers}
        onClose={() => setDialog(null)}
        onDeleteTier={confirmDeleteTier}
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
  onDeleteTier,
}: {
  dialog: DialogState;
  tiers: Tier[];
  onClose: () => void;
  onSuccess: () => void;
  onDeleteTier: (row: Tier) => void;
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
          onDelete={() => onDeleteTier(dialog.row)}
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
  onEditCategory: (row: Category) => void;
  onDeleteCategory: (row: Category) => void;
};

function TierCard({
  group,
  onAddCategory,
  onEditTier,
  onEditCategory,
  onDeleteCategory,
}: TierCardProps) {
  const c = useTheme();
  const { t } = useTranslation('categories');
  const { tier, categories } = group;
  const atCategoryLimit = categories.length >= MAX_CATEGORIES_PER_TIER;

  return (
    <Card padding={0} style={styles.card}>
      {/* Header — tapping it edits the tier (Delete lives in that sheet). */}
      <Pressable
        accessibilityRole={tier ? 'button' : undefined}
        onPress={tier ? () => onEditTier(tier) : undefined}
        disabled={!tier}
        style={({ pressed }) => [
          styles.cardHeader,
          tier && pressed ? styles.pressed : null,
        ]}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: tier?.color ?? c.mutedForeground },
          ]}
        />
        <AppText variant='heading'>
          {tier ? tier.name : t('tier.untiered')}
        </AppText>
        {tier?.is_essential ? (
          <View style={[styles.badge, { backgroundColor: c.muted }]}>
            <AppText variant='overline' color='mutedForeground'>
              {t('tier.essentialBadge')}
            </AppText>
          </View>
        ) : null}
        {tier ? (
          <View style={styles.headerEnd}>
            <AppText variant='caption' color='mutedForeground'>
              {categories.length}/{MAX_CATEGORIES_PER_TIER}
            </AppText>
            <Pencil size={16} color={c.mutedForeground} />
          </View>
        ) : null}
      </Pressable>

      {categories.length > 0 ? (
        categories.map((category) => (
          <SwipeRow
            key={category.id}
            topBorder
            deleteLabel={t('category.delete')}
            onPress={() => onEditCategory(category)}
            onDelete={() => onDeleteCategory(category)}
          >
            <CategoryBadge
              icon={category.icon}
              color={category.color}
              size={32}
            />
            <AppText variant='bodyMedium' style={styles.flex}>
              {category.name}
            </AppText>
          </SwipeRow>
        ))
      ) : (
        <AppText variant='label' color='mutedForeground' style={styles.empty}>
          {t('tier.empty')}
        </AppText>
      )}

      {/* Add-category ghost row (tiered groups only). */}
      {tier ? (
        <Pressable
          accessibilityRole='button'
          accessibilityLabel={t('tier.addCategory')}
          disabled={atCategoryLimit}
          onPress={() => onAddCategory(tier.id)}
          style={({ pressed }) => [
            styles.addRow,
            { borderTopColor: c.border },
            atCategoryLimit && styles.disabled,
            !atCategoryLimit && pressed ? styles.pressed : null,
          ]}
        >
          <Plus size={16} color={c.primary} />
          <AppText variant='bodyMedium' color='primary'>
            {t('tier.addCategory')}
          </AppText>
        </Pressable>
      ) : null}
    </Card>
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
  // overflow hidden so a swiped category row's delete action is clipped to the
  // card's rounded corners; sections own their padding.
  card: { overflow: 'hidden' },
  pressed: { opacity: 0.6 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
  },
  dot: { width: 10, height: 10, borderRadius: Radius.pill },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  headerEnd: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  disabled: { opacity: 0.4 },
});
