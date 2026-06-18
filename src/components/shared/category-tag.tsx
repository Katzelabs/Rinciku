import { Badge } from '@/components/ui/badge';
import type { Database } from '@/lib/database.types';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type TierRow = Database['public']['Tables']['tiers']['Row'];

export type CategoryWithTier = CategoryRow & { tier: TierRow | null };

// Structural minimum the tag actually renders — accepts a spending
// CategoryWithTier or a tier-less income category (tier simply omitted).
type TaggableCategory = {
  name: string;
  color: string | null;
  tier?: { name: string } | null;
};

type Props = {
  category: TaggableCategory | null;
};

/**
 * Renders a category as a colored initial chip + name + optional tier badge,
 * with an "Uncategorized" fallback. Shared by the expenses, essentials, and
 * incomes tables.
 */
export function CategoryTag({ category }: Props) {
  if (!category) {
    return <span className='text-muted-foreground italic'>Uncategorized</span>;
  }

  return (
    <div className='flex items-center gap-2'>
      <span
        aria-hidden
        className='inline-flex size-6 items-center justify-center rounded-full text-[10px] font-semibold uppercase text-white'
        style={{ backgroundColor: category.color ?? '#94a3b8' }}
      >
        {category.name.charAt(0)}
      </span>
      <span className='font-medium'>{category.name}</span>
      {category.tier ? (
        <Badge variant='secondary' className='capitalize'>
          {category.tier.name}
        </Badge>
      ) : null}
    </div>
  );
}
