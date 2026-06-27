import { useTranslation } from 'react-i18next';
import {
  DateRangePicker,
  type DateRangeValue,
} from '@/components/shared/date-range-picker';
import {
  MultiSelect,
  type MultiSelectOption,
} from '@/components/shared/multi-select';
import { useCategories } from '@/features/categories/hooks/use-categories';

type Props = {
  dateRange: DateRangeValue;
  onDateRangeChange: (value: DateRangeValue) => void;
  categoryIds: string[];
  onCategoryIdsChange: (value: string[]) => void;
};

// Mirrors the expenses ExpenseFilters layout, minus the text search (analytics
// filters by category + range only). Reuses the shared picker + multiselect.
export function AnalyticsFilters({
  dateRange,
  onDateRangeChange,
  categoryIds,
  onCategoryIdsChange,
}: Props) {
  const { t } = useTranslation('dashboard');
  const { data: categories } = useCategories();
  const options: MultiSelectOption[] = (categories ?? []).map((category) => ({
    label: category.name,
    value: category.id,
    color: category.color,
  }));

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
      <MultiSelect
        options={options}
        value={categoryIds}
        onChange={onCategoryIdsChange}
        placeholder={t('filters.allCategories')}
        searchPlaceholder={t('filters.searchCategories')}
        emptyText={t('filters.noCategories')}
        className='w-full sm:w-[220px]'
      />
      <DateRangePicker
        value={dateRange}
        onChange={onDateRangeChange}
        className='sm:ml-auto'
      />
    </div>
  );
}
