import { useEffect, useState } from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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
import type { Tables } from '@/lib/database.types';

import { deleteCategory, listCategories } from '../api';
import { CategoryForm } from '../components/category-form';
import { CategoryIcon } from '../components/category-icon';
import {
  groupByTier,
  type CategoryTier,
} from '../hooks/use-categories';

type Category = Tables<'categories'>;

const TIER_ORDER: CategoryTier[] = ['fixed', 'needs', 'wants'];
const TIER_LABELS: Record<CategoryTier, string> = {
  fixed: 'Fixed',
  needs: 'Needs',
  wants: 'Wants',
};
const TIER_DESCRIPTIONS: Record<CategoryTier, string> = {
  fixed: 'Same-amount monthly commitments.',
  needs: 'Essentials that vary month to month.',
  wants: 'Nice-to-haves and discretionary spend.',
};

type DialogState =
  | { kind: 'create'; tier: CategoryTier }
  | { kind: 'edit'; row: Category }
  | { kind: 'delete'; row: Category }
  | null;

type FetchResponse = {
  key: number;
  rows: Category[];
  error: string | null;
};

export function CategoriesPage() {
  const [refetchToken, setRefetchToken] = useState(0);
  const [response, setResponse] = useState<FetchResponse | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listCategories().then(({ data, error }) => {
      if (cancelled) return;
      setResponse({
        key: refetchToken,
        rows: data ?? [],
        error: error?.message ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  const loading = response?.key !== refetchToken;
  const error = response?.error ?? null;
  const grouped = !loading && response ? groupByTier(response.rows) : null;

  function refetch() {
    setRefetchToken((n) => n + 1);
  }

  async function handleConfirmDelete() {
    if (dialog?.kind !== 'delete') return;
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
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Categories</h1>
        <p className='text-sm text-muted-foreground'>
          Organize your spending into fixed, needs, and wants.
        </p>
      </div>

      {error && (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
          {error}
        </div>
      )}

      <div className='space-y-4'>
        {TIER_ORDER.map((tier) => (
          <Card key={tier}>
            <CardHeader>
              <CardTitle>{TIER_LABELS[tier]}</CardTitle>
              <p className='text-sm text-muted-foreground'>
                {TIER_DESCRIPTIONS[tier]}
              </p>
              <CardAction>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => setDialog({ kind: 'create', tier })}
                >
                  <Plus className='size-4' />
                  Add category
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              {loading ? (
                <CategoryRowSkeletons />
              ) : grouped && grouped[tier].length > 0 ? (
                <ul className='divide-y'>
                  {grouped[tier].map((category) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      onEdit={() => setDialog({ kind: 'edit', row: category })}
                      onDelete={() =>
                        setDialog({ kind: 'delete', row: category })
                      }
                    />
                  ))}
                </ul>
              ) : (
                <p className='py-6 text-center text-sm text-muted-foreground'>
                  No {TIER_LABELS[tier].toLowerCase()} categories yet — add your
                  first one.
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={dialog?.kind === 'create' || dialog?.kind === 'edit'}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === 'edit' ? 'Edit category' : 'Add category'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'edit'
                ? 'Update the details of this category.'
                : `Create a new ${dialog?.kind === 'create' ? TIER_LABELS[dialog.tier].toLowerCase() : ''} category.`}
            </DialogDescription>
          </DialogHeader>
          {dialog?.kind === 'create' && (
            <CategoryForm
              mode='create'
              defaultValues={{ tier: dialog.tier }}
              onSuccess={() => {
                setDialog(null);
                refetch();
              }}
            />
          )}
          {dialog?.kind === 'edit' && (
            <CategoryForm
              mode='edit'
              defaultValues={{
                id: dialog.row.id,
                name: dialog.row.name,
                tier: dialog.row.tier as CategoryTier,
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

      <Dialog
        open={dialog?.kind === 'delete'}
        onOpenChange={(open) => {
          if (!open && !deleting) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'delete' && (
                <>
                  <span className='font-medium'>{dialog.row.name}</span> will be
                  removed. Expenses tagged with it stay, but become
                  uncategorized.
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
