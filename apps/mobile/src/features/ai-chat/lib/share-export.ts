import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { XLSX_MIME_TYPE } from '@rinciku/core/xlsx';
import type { ExportFile } from '../types';

// Writes a generated export file to the app cache and opens the system share
// sheet (AirDrop / Files / mail / etc). CSV data is plain text (a UTF-8 BOM
// keeps Excel from mojibake-ing non-ASCII notes); xlsx arrives as base64 —
// exactly what writeAsStringAsync's base64 encoding wants, no decode step.
// Uses the expo-file-system legacy API, matching src/lib/attachments.ts.

const CSV_MIME_TYPE = 'text/csv';
const CSV_UTI = 'public.comma-separated-values-text';
const XLSX_UTI = 'org.openxmlformats.spreadsheetml.sheet';

export async function shareExportFile(file: ExportFile): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this device.');
  }
  const uri = `${FileSystem.cacheDirectory}${file.filename}`;
  if (file.kind === 'csv') {
    await FileSystem.writeAsStringAsync(uri, '\uFEFF' + file.data, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } else {
    await FileSystem.writeAsStringAsync(uri, file.data, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }
  await Sharing.shareAsync(uri, {
    mimeType: file.kind === 'csv' ? CSV_MIME_TYPE : XLSX_MIME_TYPE,
    UTI: file.kind === 'csv' ? CSV_UTI : XLSX_UTI,
  });
}

// Shares each file in turn — one share sheet at a time (kind='both' CSV
// exports produce two files; the second sheet opens when the first closes).
export async function shareExportFiles(files: ExportFile[]): Promise<void> {
  for (const file of files) {
    await shareExportFile(file);
  }
}
