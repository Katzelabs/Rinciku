import { useTranslation } from 'react-i18next';
import {
  DateRangePicker,
  type DateRangeValue,
} from '@/components/shared/date-range-picker';
import {
  MultiSelect,
  type MultiSelectOption,
} from '@/components/shared/multi-select';
import { Input } from '@/components/ui/input';
import { useCategories } from '@/features/categories/hooks/use-categories';

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  categoryIds: string[];
  onCategoryIdsChange: (value: string[]) => void;
  dateRange: DateRangeValue;
  onDateRangeChange: (value: DateRangeValue) => void;
};

export function ExpenseFilters({
  search,
  onSearchChange,
  categoryIds,
  onCategoryIdsChange,
  dateRange,
  onDateRangeChange,
}: Props) {
  const { t } = useTranslation('expenses');
  const { data: categories } = useCategories();
  const options: MultiSelectOption[] = (categories ?? []).map((category) => ({
    label: category.name,
    value: category.id,
    color: category.color,
  }));

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
      <Input
        placeholder={t('filters.searchPlaceholder')}
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className='sm:max-w-[240px]'
      />
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
