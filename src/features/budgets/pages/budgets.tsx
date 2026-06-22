import { useState } from 'react';
import { CopyPlus, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getCycleLabel } from '@/lib/cycle';
import type { CurrencyCode } from '@/lib/fx';
import { useAuth } from '@/features/auth';

import {
  copyFromPreviousPeriod,
  deleteBudget,
  deleteTierBudget,
  upsertBudget,
  upsertTierBudget,
} from '../api';
import { CategoryIcon } from '@/features/categories/components/category-icon';
import { BudgetMeter, StatusBadge } from '../components/budget-meter';
import { TargetDialog } from '../components/target-dialog';
import {
  useBudgets,
  type BudgetCategoryRow,
  type BudgetTierSection,
} from '../hooks/use-budgets';

type EditState =
  | { kind: 'category'; row: BudgetCategoryRow }
  | { kind: 'tier'; section: BudgetTierSection }
  | null;

export function BudgetsPage() {
  const { user, profile } = useAuth();
  const { data, isLoading, error, refetch } = useBudgets();
  const [edit, setEdit] = useState<EditState>(null);
  const [copying, setCopying] = useState(false);

  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  async function handleCopyLastMonth() {
    if (!data) return;
    setCopying(true);
    try {
      const { data: result, error } = await copyFromPreviousPeriod(
        data.period.year,
        data.period.month
      );
      if (error) throw error;
      const total = (result?.budgets ?? 0) + (result?.tierBudgets ?? 0);
      if (total === 0) {
        toast.info('No targets found in the previous period to copy.');
      } else {
        toast.success(`Copied ${total} target${total === 1 ? '' : 's'}.`);
        refetch();
      }
    } catch (err) {
      console.error('Failed to copy from previous period', err);
      toast.error('Could not copy last month. Please try again.');
    } finally {
      setCopying(false);
    }
  }

  async function handleSaveTarget(amount: number, currency: CurrencyCode) {
    if (!user || !data) {
      toast.error('You need to be signed in to set a target.');
      return;
    }
    try {
      if (edit?.kind === 'category') {
        const { error } = await upsertBudget({
          user_id: user.id,
          category_id: edit.row.category.id,
          period_year: data.period.year,
          period_month: data.period.month,
          amount,
          currency,
        });
        if (error) throw error;
      } else if (edit?.kind === 'tier' && edit.section.tier) {
        const { error } = await upsertTierBudget({
          user_id: user.id,
          tier_id: edit.section.tier.id,
          period_year: data.period.year,
          period_month: data.period.month,
          amount,
          currency,
        });
        if (error) throw error;
      }
      toast.success('Target saved');
      setEdit(null);
      refetch();
    } catch (err) {
      console.error('Failed to save target', err);
      toast.error('Could not save target. Please try again.');
    }
  }

  // The id of the existing target being edited, if any (null → nothing to unset).
  const editingTargetId =
    edit?.kind === 'category'
      ? edit.row.budgetId
      : edit?.kind === 'tier'
        ? edit.section.tierBudgetId
        : null;

  async function handleRemoveTarget() {
    if (!editingTargetId) return;
    try {
      const { error } =
        edit?.kind === 'tier'
          ? await deleteTierBudget(editingTargetId)
          : await deleteBudget(editingTargetId);
      if (error) throw error;
      toast.success('Target removed');
      setEdit(null);
      refetch();
    } catch (err) {
      console.error('Failed to remove target', err);
      toast.error('Could not remove target. Please try again.');
    }
  }

  return (
    <div className='flex flex-col gap-4 md:gap-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Budgets</h1>
          <p className='text-sm text-muted-foreground'>
            Set monthly spending targets per category and tier, and track them
            against actual spend this cycle.
          </p>
          {data && (
            <p className='text-xs text-muted-foreground'>
              Cycle: {getCycleLabel(data.cycle)}
            </p>
          )}
        </div>
        <Button
          variant='outline'
          onClick={handleCopyLastMonth}
          disabled={copying || isLoading || !data}
        >
          <CopyPlus />
          {copying ? 'Copying…' : 'Copy last month'}
        </Button>
      </div>

      {error && (
        <div className='rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      )}

      <div className='grid grid-cols-1 items-start gap-4 lg:grid-cols-2'>
        {isLoading && !data ? (
          <>
            <Skeleton className='h-40 w-full' />
            <Skeleton className='h-40 w-full' />
          </>
        ) : (
          data?.sections.map((section) => (
            <TierSection
              key={section.tier?.id ?? '__untiered__'}
              section={section}
              base={base}
              onEditTier={() => setEdit({ kind: 'tier', section })}
              onEditCategory={(row) => setEdit({ kind: 'category', row })}
            />
          ))
        )}
      </div>

      <TargetDialog
        open={edit !== null}
        onOpenChange={(open) => !open && setEdit(null)}
        title={
          edit?.kind === 'tier'
            ? `${edit.section.tier?.name ?? 'Tier'} cap`
            : `${edit?.kind === 'category' ? edit.row.category.name : 'Category'} target`
        }
        description={
          edit?.kind === 'tier'
            ? 'An independent cap for the whole tier — not a sum of its categories.'
            : undefined
        }
        defaultAmount={
          edit?.kind === 'category'
            ? edit.row.targetRaw
            : edit?.kind === 'tier'
              ? edit.section.targetRaw
              : null
        }
        currency={
          edit?.kind === 'category'
            ? edit.row.targetCurrency
            : edit?.kind === 'tier'
              ? edit.section.targetCurrency
              : base
        }
        onSave={handleSaveTarget}
        onRemove={editingTargetId ? handleRemoveTarget : undefined}
      />
    </div>
  );
}

type TierSectionProps = {
  section: BudgetTierSection;
  base: CurrencyCode;
  onEditTier: () => void;
  onEditCategory: (row: BudgetCategoryRow) => void;
};

function TierSection({
  section,
  base,
  onEditTier,
  onEditCategory,
}: TierSectionProps) {
  const { tier } = section;
  return (
    <Card>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <CardTitle className='flex items-center gap-2'>
            {tier?.color && (
              <span
                className='size-3 rounded-full'
                style={{ backgroundColor: tier.color }}
                aria-hidden
              />
            )}
            {tier?.name ?? 'Untiered'}
            <StatusBadge status={section.status} />
          </CardTitle>
          {tier && (
            <Button variant='outline' size='sm' onClick={onEditTier}>
              <Pencil />
              {section.target == null ? 'Set cap' : 'Edit cap'}
            </Button>
          )}
        </div>
        {tier && (
          <div className='pt-2'>
            <BudgetMeter
              spent={section.spent}
              target={section.target}
              pct={section.pct}
              status={section.status}
              base={base}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {section.categories.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No categories in this tier.
          </p>
        ) : (
          section.categories.map((row) => (
            <div
              key={row.category.id}
              className='flex flex-col gap-1.5 border-t pt-4 first:border-t-0 first:pt-0'
            >
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2 text-sm font-medium'>
                  <span
                    className='flex size-7 shrink-0 items-center justify-center rounded-full'
                    style={{
                      background: `${row.category.color ?? '#888888'}22`,
                    }}
                  >
                    <CategoryIcon
                      name={row.category.icon}
                      className='size-4'
                      style={{ color: row.category.color ?? undefined }}
                    />
                  </span>
                  {row.category.name}
                  <StatusBadge status={row.status} />
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onEditCategory(row)}
                >
                  <Pencil />
                  {row.target == null ? 'Set target' : 'Edit'}
                </Button>
              </div>
              <BudgetMeter
                spent={row.spent}
                target={row.target}
                pct={row.pct}
                status={row.status}
                base={base}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
