import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AttachmentDropzone } from '@/components/shared/attachment-dropzone';
import { parseCsv, parseCsvDate } from '@rinciku/core';
import { formatDate } from '@rinciku/core';
import { useAuth } from '@/features/auth';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { bulkCreateExpenses, type CreateExpenseInput } from '../api';
import { makeExpenseCsvRowSchema } from '../schemas';

// Browsers report CSV MIME inconsistently; accept the common variants plus an
// empty type, and let the schema reject anything that isn't real CSV content.
const CSV_ACCEPT = '.csv,text/csv';
const CSV_MIME = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'text/plain',
  '',
]);
const REQUIRED_HEADERS = ['date', 'amount', 'currency'] as const;
const PREVIEW_LIMIT = 50;

type Phase = 'pick' | 'preview' | 'importing';
type RowIssue = { line: number; message: string };
type PreparedRow = {
  line: number;
  categoryLabel: string;
  input: CreateExpenseInput;
};
type ParseResult = {
  valid: PreparedRow[];
  errors: RowIssue[];
  warnings: RowIssue[];
};

const EMPTY: ParseResult = { valid: [], errors: [], warnings: [] };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
};

export function ExpenseImportDialog({ open, onOpenChange, onImported }: Props) {
  const { t } = useTranslation('expenses');
  const { user } = useAuth();
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const csvRowSchema = useMemo(() => makeExpenseCsvRowSchema(t), [t]);

  const [phase, setPhase] = useState<Phase>('pick');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ParseResult>(EMPTY);

  function reset() {
    setPhase('pick');
    setFile(null);
    setResult(EMPTY);
  }

  function handleOpenChange(next: boolean) {
    if (phase === 'importing') return; // don't close mid-import
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleFile(next: File | null) {
    setFile(next);
    if (!next) return;
    if (!user) {
      toast.error(t('toast.signInImport'));
      return;
    }
    const text = await next.text();
    setResult(
      parseExpenseCsv(text, user.id, categories ?? [], csvRowSchema, t)
    );
    setPhase('preview');
  }

  async function handleImport() {
    if (result.valid.length === 0) return;
    const inputs = result.valid.map((row) => row.input);
    setPhase('importing');
    const { error } = await bulkCreateExpenses(inputs);
    if (error) {
      toast.error(error.message || t('toast.importError'));
      setPhase('preview');
      return;
    }
    toast.success(t('toast.imported', { count: inputs.length }));
    onImported();
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('import.title')}</DialogTitle>
          <DialogDescription>
            {t('import.descriptionBefore')}
            <code className='text-xs'>
              date, amount, currency, category, note
            </code>
            {t('import.descriptionAfter')}
          </DialogDescription>
        </DialogHeader>

        {phase === 'pick' && (
          <div className='space-y-2'>
            {categoriesError && (
              <p className='text-sm text-muted-foreground'>
                {t('import.categoriesLoadError')}
              </p>
            )}
            <AttachmentDropzone
              value={file}
              onChange={handleFile}
              disabled={categoriesLoading}
              accept={CSV_ACCEPT}
              allowedMime={CSV_MIME}
              hintLabel={
                categoriesLoading ? t('import.hintLoading') : t('import.hint')
              }
              hintFormats={t('import.hintFormats')}
              invalidTypeMessage={t('import.invalidType')}
            />
          </div>
        )}

        {phase === 'preview' && <ImportPreview result={result} />}

        {phase === 'importing' && (
          <div className='flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground'>
            <Spinner />{' '}
            {t('import.importingCount', { count: result.valid.length })}
          </div>
        )}

        <DialogFooter>
          {phase === 'preview' && (
            <Button variant='outline' onClick={reset}>
              {t('import.chooseAnother')}
            </Button>
          )}
          {phase !== 'preview' && (
            <Button
              variant='outline'
              onClick={() => handleOpenChange(false)}
              disabled={phase === 'importing'}
            >
              {t('common:actions.cancel')}
            </Button>
          )}
          {phase === 'preview' && (
            <Button onClick={handleImport} disabled={result.valid.length === 0}>
              <Upload className='size-4' />
              {t('import.importRows', { count: result.valid.length })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportPreview({ result }: { result: ParseResult }) {
  const { t } = useTranslation('expenses');
  const { valid, errors, warnings } = result;
  const shown = valid.slice(0, PREVIEW_LIMIT);
  return (
    <div className='space-y-3'>
      <p className='text-sm'>
        <span className='font-medium'>{valid.length}</span>{' '}
        {t('import.preview.valid')},{' '}
        <span className='font-medium'>{errors.length}</span>{' '}
        {t('import.preview.skipped')}
        {warnings.length > 0 &&
          t('import.preview.warningsSuffix', { count: warnings.length })}
        .
      </p>

      {errors.length > 0 && (
        <IssueList
          tone='error'
          title={t('import.preview.skippedRows')}
          issues={errors}
        />
      )}
      {warnings.length > 0 && (
        <IssueList
          tone='warning'
          title={t('import.preview.warnings')}
          issues={warnings}
        />
      )}

      {valid.length > 0 && (
        <div className='max-h-72 overflow-y-auto rounded-md border'>
          <Table>
            <TableHeader className='sticky top-0 bg-background'>
              <TableRow>
                <TableHead>{t('import.preview.date')}</TableHead>
                <TableHead className='text-right'>
                  {t('import.preview.amount')}
                </TableHead>
                <TableHead>{t('import.preview.currency')}</TableHead>
                <TableHead>{t('import.preview.category')}</TableHead>
                <TableHead>{t('import.preview.note')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((row) => (
                <TableRow key={row.line}>
                  <TableCell>
                    {formatDate(new Date(row.input.occurred_at), 'yyyy-MM-dd')}
                  </TableCell>
                  <TableCell className='text-right tabular-nums'>
                    {row.input.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>{row.input.currency}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {row.categoryLabel}
                  </TableCell>
                  <TableCell className='max-w-[16rem] truncate text-muted-foreground'>
                    {row.input.note ?? ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {valid.length > PREVIEW_LIMIT && (
        <p className='text-xs text-muted-foreground'>
          {t('import.preview.more', {
            limit: PREVIEW_LIMIT,
            total: valid.length,
          })}
        </p>
      )}
    </div>
  );
}

function IssueList({
  tone,
  title,
  issues,
}: {
  tone: 'error' | 'warning';
  title: string;
  issues: RowIssue[];
}) {
  const { t } = useTranslation('expenses');
  const cls =
    tone === 'error'
      ? 'border-destructive/50 bg-destructive/5 text-destructive'
      : 'border-amber-500/50 bg-amber-500/5 text-amber-700 dark:text-amber-400';
  return (
    <div
      className={`max-h-32 overflow-y-auto rounded-md border p-3 text-sm ${cls}`}
    >
      <p className='mb-1 font-medium'>{title}</p>
      <ul className='space-y-0.5'>
        {issues.map((issue, i) => (
          <li key={i}>
            {issue.line > 0
              ? t('import.preview.rowPrefix', { line: issue.line })
              : ''}
            {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Pure parse + validate + category resolution. Header is line 1, so data rows
// start at line 2.
function parseExpenseCsv(
  text: string,
  userId: string,
  categories: { id: string; name: string }[],
  schema: ReturnType<typeof makeExpenseCsvRowSchema>,
  t: TFunction
): ParseResult {
  const { rows, headerError } = parseCsv(text, REQUIRED_HEADERS);
  if (headerError) {
    return {
      valid: [],
      errors: [{ line: 1, message: headerError }],
      warnings: [],
    };
  }

  const byName = new Map(
    categories.map((c) => [c.name.trim().toLowerCase(), c.id])
  );
  const valid: PreparedRow[] = [];
  const errors: RowIssue[] = [];
  const warnings: RowIssue[] = [];

  rows.forEach((raw, index) => {
    const line = index + 2;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      errors.push({
        line,
        message: parsed.error.issues[0]?.message ?? t('import.invalidRow'),
      });
      return;
    }
    const row = parsed.data;
    let categoryId: string | null = null;
    let categoryLabel = '—';
    if (row.category) {
      const hit = byName.get(row.category.toLowerCase());
      if (hit) {
        categoryId = hit;
        categoryLabel = row.category;
      } else {
        categoryLabel = t('import.categoryUncategorized', {
          name: row.category,
        });
        warnings.push({
          line,
          message: t('import.categoryNotFound', { name: row.category }),
        });
      }
    }
    valid.push({
      line,
      categoryLabel,
      input: {
        user_id: userId,
        amount: row.amount,
        currency: row.currency,
        category_id: categoryId,
        occurred_at: parseCsvDate(row.date)!.toISOString(),
        note: row.note ? row.note : null,
        source: 'manual',
      },
    });
  });

  return { valid, errors, warnings };
}
