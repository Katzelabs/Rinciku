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
import { CategoryIcon } from '@/features/categories/components/category-icon';
import type { Tables } from '@/lib/database.types';

import { deleteIncomeCategory, listIncomeCategories } from '../api';
import { MAX_INCOME_CATEGORIES } from '../lib/limits';
import { IncomeCategoryForm } from './income-category-form';

type IncomeCategory = Tables<'income_categories'>;

type DialogState =
  | { kind: 'create' }
  | { kind: 'edit'; row: IncomeCategory }
  | { kind: 'delete'; row: IncomeCategory }
  | null;

type FetchResponse = {
  key: number;
  categories: IncomeCategory[];
  error: string | null;
};

export function IncomeCategoriesPanel() {
  const [refetchToken, setRefetchToken] = useState(0);
  const [response, setResponse] = useState<FetchResponse | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listIncomeCategories().then((res) => {
      if (cancelled) return;
      setResponse({
        key: refetchToken,
        categories: res.data ?? [],
        error: res.error?.message ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refetchToken]);

  const loading = response?.key !== refetchToken;
  const error = response?.error ?? null;
  const categories = response?.categories ?? [];

  function refetch() {
    setRefetchToken((n) => n + 1);
  }

  async function handleConfirmDelete() {
    if (dialog?.kind !== 'delete') return;
    setDeleting(true);
    const { error } = await deleteIncomeCategory(dialog.row.id);
    setDeleting(false);
    if (error) {
      toast.error('Could not delete income category.');
      return;
    }
    toast.success('Income category deleted');
    setDialog(null);
    refetch();
  }

  const formDialogOpen = dialog?.kind === 'create' || dialog?.kind === 'edit';

  return (
    <div className='space-y-6'>
      {error && (
        <div className='rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Income categories</CardTitle>
          <p className='text-sm text-muted-foreground'>
            Label where your money comes from — salary, freelance, investments.
            {!loading && (
              <>
                {' '}
                <span className='font-medium'>
                  {categories.length} / {MAX_INCOME_CATEGORIES}
                </span>
                {categories.length >= MAX_INCOME_CATEGORIES &&
                  ` — you've reached the ${MAX_INCOME_CATEGORIES}-category limit.`}
              </>
            )}
          </p>
          <CardAction>
            <Button
              size='sm'
              onClick={() => setDialog({ kind: 'create' })}
              disabled={loading || categories.length >= MAX_INCOME_CATEGORIES}
            >
              <Plus className='size-4' />
              Add category
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <IncomeCategoryRowSkeletons />
          ) : categories.length > 0 ? (
            <ul className='divide-y'>
              {categories.map((category) => (
                <IncomeCategoryRow
                  key={category.id}
                  category={category}
                  onEdit={() => setDialog({ kind: 'edit', row: category })}
                  onDelete={() => setDialog({ kind: 'delete', row: category })}
                />
              ))}
            </ul>
          ) : (
            <p className='py-6 text-center text-sm text-muted-foreground'>
              No income categories yet — add your first one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create / edit */}
      <Dialog
        open={formDialogOpen}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === 'edit'
                ? 'Edit income category'
                : 'Add income category'}
            </DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'edit'
                ? 'Update the details of this income category.'
                : 'Create a new income source label.'}
            </DialogDescription>
          </DialogHeader>
          {dialog?.kind === 'create' && (
            <IncomeCategoryForm
              mode='create'
              sortOrder={categories.length}
              onSuccess={() => {
                setDialog(null);
                refetch();
              }}
            />
          )}
          {dialog?.kind === 'edit' && (
            <IncomeCategoryForm
              mode='edit'
              defaultValues={{
                id: dialog.row.id,
                name: dialog.row.name,
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

      {/* Delete confirmation */}
      <Dialog
        open={dialog?.kind === 'delete'}
        onOpenChange={(open) => {
          if (!open && !deleting) setDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete income category?</DialogTitle>
            <DialogDescription>
              {dialog?.kind === 'delete' && (
                <>
                  <span className='font-medium'>{dialog.row.name}</span> will be
                  removed. Incomes tagged with it stay, but become
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

type IncomeCategoryRowProps = {
  category: IncomeCategory;
  onEdit: () => void;
  onDelete: () => void;
};

function IncomeCategoryRow({
  category,
  onEdit,
  onDelete,
}: IncomeCategoryRowProps) {
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

function IncomeCategoryRowSkeletons() {
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
