import { useEffect, useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IncomeCategoriesPanel } from '@/features/incomes';
import type { Tables } from '@/lib/database.types';

import { deleteCategory, deleteTier, listCategories, listTiers } from '../api';
import { CategoryForm } from '../components/category-form';
import { CategoryIcon } from '../components/category-icon';
import { TierForm } from '../components/tier-form';
import { MAX_CATEGORIES_PER_TIER, MAX_TIERS } from '../lib/limits';
import {
  groupByTier,
  type Tier,
  type TierGroup,
} from '../hooks/use-categories';

type Category = Tables<'categories'>;

type DialogState =
  | { kind: 'create-category'; tierId: string }
  | { kind: 'edit-category'; row: Category }
  | { kind: 'delete-category'; row: Category }
  | { kind: 'create-tier' }
  | { kind: 'edit-tier'; row: Tier }
  | { kind: 'delete-tier'; row: Tier }
  | null;

type FetchResponse = {
  key: number;
  categories: Category[];
  tiers: Tier[];
  error: string | null;
};

export function CategoriesPage() {
  const { t } = useTranslation('categories');
  const [refetchToken, setRefetchToken] = useState(0);
  const [response, setResponse] = useState<FetchResponse | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listCategories(), listTiers()]).then(([cats, tiers]) => {
      if (cancelled) return;
      setResponse({
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

  const loading = response?.key !== refetchToken;
  const error = response?.error ?? null;
  const tiers = response?.tiers ?? [];
  const groups: TierGroup[] | null =
    !loading && response
      ? groupByTier(response.categories, response.tiers)
      : null;

  function refetch() {
    setRefetchToken((n) => n + 1);
  }

  async function handleConfirmDelete() {
    if (dialog?.kind === 'delete-category') {
      setDeleting(true);
      const { error } = await deleteCategory(dialog.row.id);
      setDeleting(false);
      if (error) {
        toast.error(t('toast.deleteCategoryError'));
        return;
      }
      toast.success(t('toast.categoryDeleted'));
      setDialog(null);
      refetch();
    } else if (dialog?.kind === 'delete-tier') {
      setDeleting(true);
      const { error } = await deleteTier(dialog.row.id);
      setDeleting(false);
      if (error) {
        toast.error(t('toast.deleteTierError'));
        return;
      }
      toast.success(t('toast.tierDeleted'));
      setDialog(null);
      refetch();
    }
  }

  const categoryDialogOpen =
    dialog?.kind === 'create-category' || dialog?.kind === 'edit-category';
  const tierDialogOpen =
    dialog?.kind === 'create-tier' || dialog?.kind === 'edit-tier';
  const deleteDialogOpen =
    dialog?.kind === 'delete-category' || dialog?.kind === 'delete-tier';

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>{t('page.title')}</h1>
        <p className='text-sm text-muted-foreground'>{t('page.subtitle')}</p>
      </div>

      <Tabs defaultValue='spending' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='spending'>{t('tabs.spending')}</TabsTrigger>
          <TabsTrigger value='income'>{t('tabs.income')}</TabsTrigger>
        </TabsList>

        <TabsContent value='spending' className='space-y-6'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold'>{t('spending.title')}</h2>
              <p className='text-sm text-muted-foreground'>
                {t('spending.subtitle')}
                {!loading && (
                  <>
                    {' '}
                    <span className='font-medium'>
                      {tiers.length} / {MAX_TIERS}
                    </span>
                    {tiers.length >= MAX_TIERS &&
                      t('spending.tierLimitReached', { max: MAX_TIERS })}
                  </>
                )}
              </p>
            </div>
            <Button
              size='sm'
              onClick={() => setDialog({ kind: 'create-tier' })}
              disabled={loading || tiers.length >= MAX_TIERS}
            >
              <Plus className='size-4' />
              {t('spending.addTier')}
            </Button>
          </div>

          {error && (
            <div className='rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
              {error}
            </div>
          )}

          <div className='grid grid-cols-1 items-start gap-4 lg:grid-cols-2 xl:grid-cols-3'>
            {loading ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Skeleton className='h-5 w-24' />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryRowSkeletons />
                </CardContent>
              </Card>
            ) : (
              groups?.map((group) => (
                <TierCard
                  key={group.tier?.id ?? '__untiered__'}
                  group={group}
                  onAddCategory={(tierId) =>
                    setDialog({ kind: 'create-category', tierId })
                  }
                  onEditTier={(row) => setDialog({ kind: 'edit-tier', row })}
                  onDeleteTier={(row) =>
                    setDialog({ kind: 'delete-tier', row })
                  }
                  onEditCategory={(row) =>
                    setDialog({ kind: 'edit-category', row })
                  }
                  onDeleteCategory={(row) =>
                    setDialog({ kind: 'delete-category', row })
                  }
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value='income'>
          <IncomeCategoriesPanel />
        </TabsContent>
      </Tabs>

      {/* Category create / edit */}
      <Dialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === 'edit-category'
                ? t('dialog.category.editTitle')
                : t('dialog.category.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'edit-category'
                ? t('dialog.category.editDescription')
                : t('dialog.category.addDescription')}
            </DialogDescription>
          </DialogHeader>
          {dialog?.kind === 'create-category' && (
            <CategoryForm
              mode='create'
              tiers={tiers}
              defaultValues={{ tier_id: dialog.tierId }}
              onSuccess={() => {
                setDialog(null);
                refetch();
              }}
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
              onSuccess={() => {
                setDialog(null);
                refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Tier create / edit */}
      <Dialog
        open={tierDialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === 'edit-tier'
                ? t('dialog.tier.editTitle')
                : t('dialog.tier.addTitle')}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'edit-tier'
                ? t('dialog.tier.editDescription')
                : t('dialog.tier.addDescription')}
            </DialogDescription>
          </DialogHeader>
          {dialog?.kind === 'create-tier' && (
            <TierForm
              mode='create'
              nextSortOrder={tiers.length}
              onSuccess={() => {
                setDialog(null);
                refetch();
              }}
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
              onSuccess={() => {
                setDialog(null);
                refetch();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation (category or tier) */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open && !deleting) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === 'delete-tier'
                ? t('dialog.delete.tierTitle')
                : t('dialog.delete.categoryTitle')}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'delete-category' && (
                <>
                  <span className='font-medium'>{dialog.row.name}</span>{' '}
                  {t('dialog.delete.categoryDescription')}
                </>
              )}
              {dialog?.kind === 'delete-tier' && (
                <>
                  <span className='font-medium'>{dialog.row.name}</span>{' '}
                  {t('dialog.delete.tierDescription')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setDialog(null)}
              disabled={deleting}
            >
              {t('common:actions.cancel')}
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting && <Spinner data-icon='inline-start' />}
              {deleting
                ? t('dialog.delete.deleting')
                : t('common:actions.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  const { t } = useTranslation('categories');
  const { tier, categories } = group;
  const color = tier?.color ?? '#94a3b8';
  const atCategoryLimit = categories.length >= MAX_CATEGORIES_PER_TIER;

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <span
            className='inline-block size-2.5 rounded-full'
            style={{ background: color }}
            aria-hidden
          />
          {tier ? tier.name : t('tier.untiered')}
          {tier?.is_essential && (
            <Badge variant='secondary' className='font-normal'>
              {t('tier.essentialBadge')}
            </Badge>
          )}
          {tier && (
            <span className='ml-auto text-sm font-normal text-muted-foreground'>
              {categories.length} / {MAX_CATEGORIES_PER_TIER}
            </span>
          )}
        </CardTitle>
        {tier && (
          <CardAction className='flex items-center gap-1'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onAddCategory(tier.id)}
              disabled={atCategoryLimit}
              title={
                atCategoryLimit
                  ? t('tier.categoryLimitTooltip', {
                      max: MAX_CATEGORIES_PER_TIER,
                    })
                  : undefined
              }
            >
              <Plus className='size-4' />
              {t('tier.addCategory')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={t('tier.actionsLabel', { name: tier.name })}
                >
                  <MoreHorizontal className='size-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onSelect={() => onEditTier(tier)}>
                  <Pencil className='size-4' />
                  {t('tier.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onDeleteTier(tier)}
                  variant='destructive'
                >
                  <Trash2 className='size-4' />
                  {t('tier.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {categories.length > 0 ? (
          <ul className='divide-y'>
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onEdit={() => onEditCategory(category)}
                onDelete={() => onDeleteCategory(category)}
              />
            ))}
          </ul>
        ) : (
          <p className='py-6 text-center text-sm text-muted-foreground'>
            {t('tier.empty')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

type CategoryRowProps = {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
};

function CategoryRow({ category, onEdit, onDelete }: CategoryRowProps) {
  const { t } = useTranslation('categories');
  const color = category.color ?? '#94a3b8';
  return (
    <li className='flex items-center justify-between gap-3 py-2'>
      <div className='flex items-center gap-3'>
        <span
          className='flex size-8 items-center justify-center rounded-full'
          style={{ background: `${color}22` }}
        >
          <CategoryIcon
            name={category.icon}
            className='size-4'
            style={{ color }}
          />
        </span>
        <span
          className='inline-block size-2.5 rounded-full'
          style={{ background: color }}
          aria-hidden
        />
        <span className='text-sm font-medium'>{category.name}</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            aria-label={t('category.actionsLabel', { name: category.name })}
          >
            <MoreHorizontal className='size-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className='size-4' />
            {t('category.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onDelete} variant='destructive'>
            <Trash2 className='size-4' />
            {t('category.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

function CategoryRowSkeletons() {
  return (
    <ul className='divide-y'>
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className='flex items-center justify-between gap-3 py-2'>
          <div className='flex items-center gap-3'>
            <Skeleton className='size-8 rounded-full' />
            <Skeleton className='h-4 w-32' />
          </div>
          <Skeleton className='size-8 rounded-md' />
        </li>
      ))}
    </ul>
  );
}
