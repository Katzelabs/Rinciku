// One-shot receipt/document extraction for the scan-to-prefill flow.
//
// Unlike the conversational agent loop, a scan is a single forced tool call:
// the image plus a tight system prompt go up once, the model MUST answer with
// the matching propose_* tool, and the parsed result prefills the add form.
// Everything here is pure; the bound `extractTransactionFromImage` lives in
// createAiChatApi (it closes over sendChat).

import type { Json } from '@rinciku/db';
import type { CurrencyCode } from '@rinciku/core';

// Extraction metadata carried alongside the prefilled form so the confirm step
// can write it onto the attachment row (ai_raw_extraction / ai_confidence /
// doc_type), mirroring the ai-chat proposal confirm flow.
export type ScanExtractionMeta = {
  raw: Json;
  confidence: number | null;
  docType: string;
};

// English-only by design, like buildSystemPrompt: the AI reasons in one
// language while the surrounding UI is translated.
export function buildScanSystemPrompt(baseCurrency: CurrencyCode): string {
  return [
    'You extract transaction data from a financial document image (receipt, transfer proof, invoice, e-wallet screenshot) for a personal-finance app.',
    'Rules:',
    '- amount: the final total actually paid/received, as a plain number (Indonesian formats use dot thousands separators: "45.000" = 45000).',
    `- currency: the code printed on the document; if none is visible, assume ${baseCurrency}.`,
    '- occurred_at: the date printed on the document as YYYY-MM-DD; OMIT it when no date is visible — never invent one.',
    '- note: the merchant or counterparty name, short.',
    '- category_hint: your best-guess spending category name.',
    '- confidence: 0 to 1 for the extraction overall.',
    '- If the image is unreadable or is not a financial document, respond with amount 0 and confidence 0.',
  ].join('\n');
}

export const SCAN_USER_INSTRUCTION =
  'Extract the transaction from the attached image.';

// The extracted YYYY-MM-DD as a local Date, clamped to today — the forms'
// schemas and date pickers cap at today, so a model-invented future date must
// not make the prefilled form unsubmittable.
export function clampScanDate(isoDay: string): Date {
  const parsed = new Date(`${isoDay}T00:00:00`);
  const now = new Date();
  if (Number.isNaN(parsed.getTime()) || parsed > now) return now;
  return parsed;
}

type NamedRow = { id: string; name: string };

// Best-effort map of the AI's free-text category hint onto a real category id:
// exact name match first, then substring either way. Returns null when nothing
// matches so the user picks manually. (Promoted from the app-level
// proposal-utils so scan + chat share one matcher.)
export function matchCategoryId(
  hint: string | null,
  options: NamedRow[] | undefined
): string | null {
  if (!hint || !options || options.length === 0) return null;
  const needle = hint.trim().toLowerCase();
  if (!needle) return null;
  const exact = options.find((o) => o.name.trim().toLowerCase() === needle);
  if (exact) return exact.id;
  const partial = options.find((o) => {
    const name = o.name.trim().toLowerCase();
    return name.includes(needle) || needle.includes(name);
  });
  return partial?.id ?? null;
}
