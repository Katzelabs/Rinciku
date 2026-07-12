import { useCallback, useEffect, useState } from 'react';

import type { CurrencyCode } from '@rinciku/core';
import {
  matchCategoryId,
  type ProposalKind,
  type ProposedTransaction,
} from '@rinciku/domain/ai-chat';

import { extractTransactionFromImage } from '@/features/ai-chat/api';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { listCategories } from '@/features/categories/api';
import { listIncomeCategories } from '@/features/incomes/api';
import type { PickedImage } from '@/lib/attachments';
import { takePendingScan } from '@/lib/pending-scan';

export type ScanStatus = 'idle' | 'analyzing' | 'done' | 'failed';

// Drives the scan-to-prefill flow on the new-transaction screens: consumes the
// image stashed by the list screen's Scan button, runs the one-shot extraction,
// and maps the AI's category hint onto a real category/source id. `enabled`
// comes from the `scan=1` route param; without it (or with a dead holder, e.g.
// after a process restart) the hook stays idle and the plain empty form renders.
export function useScanExtraction(kind: ProposalKind, enabled: boolean) {
  const { profile } = useAuth();
  const base = (profile?.base_currency ?? 'IDR') as CurrencyCode;

  const [asset] = useState<PickedImage | null>(() =>
    enabled ? takePendingScan() : null
  );
  const [status, setStatus] = useState<ScanStatus>(
    asset ? 'analyzing' : 'idle'
  );
  const [proposal, setProposal] = useState<ProposedTransaction | null>(null);
  const [matchedId, setMatchedId] = useState<string | null>(null);

  // All state updates happen after the first await, so the kickoff effect
  // never sets state synchronously; the analyzing state is the initial one.
  const extract = useCallback(async () => {
    if (!asset) return;
    const { data } = await extractTransactionFromImage({
      kind,
      image: { media_type: asset.mimeType, data: asset.base64 },
      baseCurrency: base,
    });
    if (!data) {
      setStatus('failed');
      return;
    }

    // Category match is best-effort — a miss just leaves the field empty.
    let match: string | null = null;
    if (data.category_hint) {
      const list =
        kind === 'income'
          ? await listIncomeCategories()
          : await listCategories();
      match = matchCategoryId(data.category_hint, list.data ?? undefined);
    }
    setProposal(data);
    setMatchedId(match);
    setStatus('done');
  }, [asset, base, kind]);

  useEffect(() => {
    // Kick off the one-shot extraction for the consumed asset; every setState
    // inside extract happens after an await (never synchronously in the
    // effect), and retry re-triggers explicitly.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (asset) void extract();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = useCallback(() => {
    setStatus('analyzing');
    setProposal(null);
    setMatchedId(null);
    void extract();
  }, [extract]);

  return { asset, status, proposal, matchedId, retry };
}
