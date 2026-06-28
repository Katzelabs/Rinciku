import { NumericFormat, type NumberFormatValues } from 'react-number-format';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { fractionDigitsForCurrency, localeSeparators } from '@rinciku/core';
import type { CurrencyCode } from '@rinciku/core';

type CurrencyAmountInputProps = {
  /** Currency code shown in the addon and used to decide decimal places. */
  currency: CurrencyCode;
  /** Numeric value, or `undefined` when the field is empty. */
  value: number | undefined;
  /** Called with the parsed number, or `undefined` when cleared. */
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  /** react-hook-form passes a callback ref here; forwarded to the real input. */
  inputRef?: React.Ref<HTMLInputElement>;
  id?: string;
  name?: string;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  /** Locale that drives grouping/decimal separators. Defaults to id-ID. */
  locale?: string;
};

/**
 * Money input with live thousands grouping (e.g. `1.500.000`) so large IDR
 * amounts are readable as they are typed. Decimal places are driven by the
 * currency: 0 for IDR/JPY/KRW/VND, 2 for USD/EUR/etc. Renders inside the shared
 * InputGroup with the currency code as a prefix addon.
 */
export function CurrencyAmountInput({
  currency,
  value,
  onChange,
  onBlur,
  inputRef,
  id,
  name,
  placeholder,
  autoFocus,
  disabled,
  invalid,
  locale = 'id-ID',
}: CurrencyAmountInputProps) {
  const decimals = fractionDigitsForCurrency(currency, locale);
  const { group, decimal } = localeSeparators(locale);

  return (
    <InputGroup>
      <InputGroupAddon>
        <span className='text-sm font-medium text-muted-foreground'>
          {currency}
        </span>
      </InputGroupAddon>
      <NumericFormat
        customInput={InputGroupInput}
        getInputRef={inputRef}
        id={id}
        name={name}
        // Empty string keeps the field controlled while showing no value.
        value={value ?? ''}
        onValueChange={(values: NumberFormatValues) =>
          onChange(values.floatValue)
        }
        onBlur={onBlur}
        thousandSeparator={group}
        decimalSeparator={decimal}
        decimalScale={decimals}
        allowNegative={false}
        inputMode={decimals === 0 ? 'numeric' : 'decimal'}
        placeholder={placeholder ?? (decimals === 0 ? '0' : '0.00')}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-invalid={invalid || undefined}
      />
    </InputGroup>
  );
}
