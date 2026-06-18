import { useEffect, useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
        toast.error('Could not delete category.');
        return;
      }
      toast.success('Category deleted');
      setDialog(null);
      refetch();
    } else if (dialog?.kind === 'delete-tier') {
      setDeleting(true);
      const { error } = await deleteTier(dialog.row.id);
      setDeleting(false);
      if (error) {
        toast.error('Could not delete tier.');
        return;
      }
      toast.success('Tier deleted');
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
        <h1 className='text-2xl font-semibold'>Categories</h1>
        <p className='text-sm text-muted-foreground'>
          Organize the money you spend and the money you earn.
        </p>
      </div>

      <Tabs defaultValue='spending' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='spending'>Spending</TabsTrigger>
          <TabsTrigger value='income'>Income</TabsTrigger>
        </TabsList>

        <TabsContent value='spending' className='space-y-6'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <h2 className='text-lg font-semibold'>Spending tiers</h2>
              <p className='text-sm text-muted-foreground'>
                Organize your spending into tiers you control.
              </p>
            </div>
            <Button
              size='sm'
              onClick={() => setDialog({ kind: 'create-tier' })}
            >
              <Plus className='size-4' />
              Add tier
            </Button>
          </div>

          {error && (
            <div className='rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
              {error}
            </div>
          )}

          <div className='grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3'>
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
                ? 'Edit category'
                : 'Add category'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'edit-category'
                ? 'Update the details of this category.'
                : 'Create a new category and assign it to a tier.'}
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
              {dialog?.kind === 'edit-tier' ? 'Edit tier' : 'Add tier'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'edit-tier'
                ? 'Rename, recolor, or change whether this tier counts as essential.'
                : 'Create a new tier to group your categories.'}
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
                ? 'Delete tier?'
                : 'Delete category?'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'delete-category' && (
                <>
                  <span className='font-medium'>{dialog.row.name}</span> will be
                  removed. Expenses tagged with it stay, but become
                  uncategorized.
                </>
              )}
              {dialog?.kind === 'delete-tier' && (
                <>
                  <span className='font-medium'>{dialog.row.name}</span> will be
                  removed. Categories in this tier stay, but become untiered
                  until you reassign them.
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
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting && <Spinner data-icon='inline-start' />}
              {deleting ? 'Deleting…' : 'Delete'}
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
  const { tier, categories } = group;
  const color = tier?.color ?? '#94a3b8';

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <span
            className='inline-block size-2.5 rounded-full'
            style={{ background: color }}
            aria-hidden
          />
          {tier ? tier.name : 'Untiered'}
          {tier?.is_essential && (
            <Badge variant='secondary' className='font-normal'>
              Essential
            </Badge>
          )}
        </CardTitle>
        <p className='text-sm text-muted-foreground'>
          {tier
            ? tier.is_essential
              ? 'Counts toward your monthly essentials baseline.'
              : 'Discretionary — not part of the essentials baseline.'
            : 'Categories whose tier was deleted. Edit them to reassign a tier.'}
        </p>
        {tier && (
          <CardAction className='flex items-center gap-1'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onAddCategory(tier.id)}
            >
              <Plus className='size-4' />
              Add category
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  aria-label={`Actions for ${tier.name} tier`}
                >
                  <MoreHorizontal className='size-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onSelect={() => onEditTier(tier)}>
                  <Pencil className='size-4' />
                  Edit tier
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onDeleteTier(tier)}
                  variant='destructive'
                >
                  <Trash2 className='size-4' />
                  Delete tier
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
            No categories in this tier yet — add your first one.
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
            aria-label={`Actions for ${category.name}`}
          >
            <MoreHorizontal className='size-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil className='size-4' />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onDelete} variant='destructive'>
            <Trash2 className='size-4' />
            Delete
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
