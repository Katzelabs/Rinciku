# incomes — tasks

Manual income logging — parallel structure to expenses. Each income row carries `amount + currency + occurred_at + note + source + optional attachment` (bank transfer proof, payslip, invoice). The dashboard sums received-this-cycle alongside the profile's `expected_monthly_income` baseline so the AI consultation can reason about both planned and actual income.

Depends on `foundation/05-base-currency-and-cleanup.md` for the schema/FX/currency-select groundwork.

| # | Task | Status |
|---|---|---|
| 01 | [schema](01-schema.md) | done |
| 02 | [api-and-attachments](02-api-and-attachments.md) | done |
| 03 | [pages-and-forms](03-pages-and-forms.md) | done |
