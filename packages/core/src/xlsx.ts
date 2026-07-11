// Framework-free .xlsx workbook mechanics, mirroring csv.ts. Deliberately NOT
// re-exported from the package root: SheetJS is heavy (~800 KB) and CommonJS
// (tree-shaking can't drop it), so consumers import '@rinciku/core/xlsx'
// lazily — `await import(...)` — only when an export is actually built.
// SheetJS is installed from the official CDN tarball (cdn.sheetjs.com); the
// npm registry copy is stale (0.18.5) and carries known vulnerabilities.

import * as XLSX from 'xlsx';

export type XlsxCell = string | number;

export type XlsxSheet = {
  /** Sheet tab name — Excel limit is 31 chars, no []:*?/\ characters. */
  name: string;
  rows: Record<string, XlsxCell>[];
  /** Fixes header/column order, like toCsv's `columns`. */
  columns: readonly string[];
};

// Multi-sheet workbook → base64. Base64 is the shared contract: web decodes
// to a Blob for download, native writes it straight to a cache file for the
// share sheet. No formula-injection escaping needed here — unlike CSV, the
// xlsx format stores string cells as literal strings, never live formulas.
export function toXlsxBase64(sheets: XlsxSheet[]): string {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.rows, {
      header: [...sheet.columns],
    });
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  return XLSX.write(wb, { type: 'base64', bookType: 'xlsx' }) as string;
}

export const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Native Blob + anchor download, the downloadCsv precedent. Browser-only.
export function downloadXlsx(filename: string, base64: string): void {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: XLSX_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
