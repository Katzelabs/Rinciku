import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CurrencyCode } from '@rinciku/core';
import { useAuth } from '@/features/auth';

import { deleteBudget, upsertBudget } from '@/features/budgets/api';
import {
  BudgetMeter,
  StatusBadge,
} from '@/features/budgets/components/budget-meter';
import { TargetDialog } from '@/features/budgets/components/target-dialog';
import {
  useBudgets,
  type BudgetCategoryRow,
  type BudgetTierSection,
} from '@/features/budgets/hooks/use-budgets';
import { CategoryIcon } from '@/features/categories/components/category-icon';

// Category-level spending targets reused inside the onboarding wizard. Mirrors
// the Budgets page (same useBudgets view + TargetDialog), trimmed to per-category
// targets only (tier caps stay a page-level feature) and stripped of the header
// and copy-last-month action. Targets persist immediately via upsertBudget.
export function BudgetsReviewStep() {
  const { t } = useTranslation('budgets');
  const { user, profile } = useAuth();
  const { data, isLoading, error, refetch } = useBudgets();
  const [edit, setEdit] = useState<BudgetCategoryRow | null>(null);

  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  async function handleSaveTarget(amount: number, currency: CurrencyCode) {
    if (!user || !data || !edit) {
      toast.error(t('toast.signInRequired'));
      return;
    }
    try {
      const { error } = await upsertBudget({
        user_id: user.id,
        category_id: edit.category.id,
        period_year: data.period.year,
        period_month: data.period.month,
        amount,
        currency,
      });
      if (error) throw error;
      toast.success(t('toast.saved'));
      setEdit(null);
      refetch();
    } catch (err) {
      console.error('Failed to save target', err);
      toast.error(t('toast.saveFailed'));
    }
  }

  async function handleRemoveTarget() {
    if (!edit?.budgetId) return;
    try {
      const { error } = await deleteBudget(edit.budgetId);
      if (error) throw error;
      toast.success(t('toast.removed'));
      setEdit(null);
      refetch();
    } catch (err) {
      console.error('Failed to remove target', err);
      toast.error(t('toast.removeFailed'));
    }
  }

  return (
    <div className='space-y-4'>
      {error && (
        <div className='rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive'>
          {error}
        </div>
      )}

      <div className='grid grid-cols-1 items-start gap-4'>
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
              onEditCategory={(row) => setEdit(row)}
            />
          ))
        )}
      </div>

      <TargetDialog
        open={edit !== null}
        onOpenChange={(open) => !open && setEdit(null)}
        title={t('dialog.categoryTarget', {
          name: edit?.category.name ?? t('dialog.categoryFallback'),
        })}
        defaultAmount={edit?.targetRaw ?? null}
        currency={edit?.targetCurrency ?? base}
        onSave={handleSaveTarget}
        onRemove={edit?.budgetId ? handleRemoveTarget : undefined}
      />
    </div>
  );
}

type TierSectionProps = {
  section: BudgetTierSection;
  base: CurrencyCode;
  onEditCategory: (row: BudgetCategoryRow) => void;
};

function TierSection({ section, base, onEditCategory }: TierSectionProps) {
  const { t } = useTranslation('budgets');
  const { tier } = section;
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {tier?.color && (
            <span
              className='size-3 rounded-full'
              style={{ backgroundColor: tier.color }}
              aria-hidden
            />
          )}
          {tier?.name ?? t('page.untiered')}
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {section.categories.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            {t('page.noCategories')}
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
                  {row.target == null ? t('page.setTarget') : t('page.edit')}
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
