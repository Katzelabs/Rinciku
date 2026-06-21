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
  const { data: categories } = useCategories();
  const options: MultiSelectOption[] = (categories ?? []).map((category) => ({
    label: category.name,
    value: category.id,
    color: category.color,
  }));

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
      <Input
        placeholder='Search notes…'
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        className='sm:max-w-[240px]'
      />
      <MultiSelect
        options={options}
        value={categoryIds}
        onChange={onCategoryIdsChange}
        placeholder='All categories'
        searchPlaceholder='Search categories…'
        emptyText='No categories.'
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
