import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { supabase } from '@/lib/supabase';

// Portable-ish native attachment helpers shared by the AI chat and the manual
// expense/income forms. The web File/FileReader path lives in each web feature's
// api.ts; on native there is no File and Supabase storage wants an ArrayBuffer,
// so we pick with expo-image-picker (base64) and upload the decoded bytes here.
// The portable @rinciku/domain DB inserts (createAttachment / …) are reused as-is.

// Storage buckets — declared in supabase/config.toml, per-user RLS in
// supabase/schemas/90_storage_policies.sql (path namespaced by auth.uid()).
export const EXPENSE_BUCKET = 'expense-attachments';
export const INCOME_BUCKET = 'income-attachments';

export const MAX_BYTES = 10 * 1024 * 1024;

// Accepted attachment types. Images can be captured/picked; PDFs come through
// the document picker. Kept in sync with the storage buckets' allowed_mime_types
// (supabase/config.toml).
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  pdf: 'application/pdf',
};

// The `type` filter passed to the document picker.
const DOCUMENT_TYPES = Object.keys(MIME_TO_EXT);

type Result<T> = { data: T | null; error: Error | null };

// A validated, base64-loaded image ready to preview and upload.
export type PickedImage = {
  uri: string;
  base64: string;
  mimeType: string;
  fileSize: number;
  fileName: string;
};

// Discriminated outcome so callers can react (toast an i18n error, prompt for
// permission, or silently ignore a cancel).
export type PickOutcome =
  | { ok: true; asset: PickedImage }
  | { ok: false; reason: 'cancelled' | 'permission' | 'invalid' | 'tooLarge' };

export type PickSource = 'camera' | 'library';

function inferMime(uri: string, assetMime?: string | null): string {
  if (assetMime && EXT_TO_MIME[MIME_TO_EXT[assetMime] ?? '']) return assetMime;
  const ext = uri.split('.').pop()?.toLowerCase();
  return (ext && EXT_TO_MIME[ext]) || 'image/jpeg';
}

// Prompts for the right permission, launches the camera or library picker with
// base64 enabled (one read serves both preview and the storage upload), then
// validates mime + size.
export async function pickImage(source: PickSource): Promise<PickOutcome> {
  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { ok: false, reason: 'permission' };

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    base64: true,
    quality: 0.8,
  };
  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled) return { ok: false, reason: 'cancelled' };

  const asset = result.assets[0];
  if (!asset?.base64) return { ok: false, reason: 'invalid' };

  const mimeType = inferMime(asset.uri, asset.mimeType);
  if (!MIME_TO_EXT[mimeType]) return { ok: false, reason: 'invalid' };

  // base64 length → byte size fallback when the picker omits fileSize.
  const fileSize = asset.fileSize ?? Math.floor((asset.base64.length * 3) / 4);
  if (fileSize > MAX_BYTES) return { ok: false, reason: 'tooLarge' };

  const fileName =
    asset.fileName?.trim() ||
    asset.uri.split('/').pop() ||
    `receipt.${MIME_TO_EXT[mimeType] ?? 'jpg'}`;

  return {
    ok: true,
    asset: { uri: asset.uri, base64: asset.base64, mimeType, fileSize, fileName },
  };
}

// Picks a document (PDF or image) from the Files app / provider, validates
// mime + size, and reads it as base64 so it can go through the same
// `uploadAttachmentObject` path as a captured image.
export async function pickDocument(): Promise<PickOutcome> {
  const result = await DocumentPicker.getDocumentAsync({
    type: DOCUMENT_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return { ok: false, reason: 'cancelled' };

  const asset = result.assets?.[0];
  if (!asset) return { ok: false, reason: 'invalid' };

  const mimeType = inferMime(asset.uri, asset.mimeType);
  if (!MIME_TO_EXT[mimeType]) return { ok: false, reason: 'invalid' };

  // Reject early on the reported size before reading the whole file.
  if (asset.size && asset.size > MAX_BYTES) return { ok: false, reason: 'tooLarge' };

  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  const fileSize = asset.size ?? Math.floor((base64.length * 3) / 4);
  if (fileSize > MAX_BYTES) return { ok: false, reason: 'tooLarge' };

  const fileName =
    asset.name?.trim() ||
    asset.uri.split('/').pop() ||
    `receipt.${MIME_TO_EXT[mimeType] ?? 'pdf'}`;

  return {
    ok: true,
    asset: { uri: asset.uri, base64, mimeType, fileSize, fileName },
  };
}

// The last path segment of a stored object — used to label existing attachments
// (e.g. `userId/2026-07/uuid.jpg` → `uuid.jpg`).
export function fileNameFromPath(path: string): string {
  return path.split('/').pop() || path;
}

function buildStoragePath(userId: string, mimeType: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const ext = MIME_TO_EXT[mimeType] ?? 'jpg';
  return `${userId}/${year}-${month}/${Crypto.randomUUID()}.${ext}`;
}

// Uploads the decoded image bytes to `bucket` under `${userId}/YYYY-MM/uuid.ext`
// (the path the storage RLS policies expect) and returns the stored path.
export async function uploadAttachmentObject(
  bucket: string,
  asset: PickedImage,
  userId: string
): Promise<Result<{ storage_path: string }>> {
  const storage_path = buildStoragePath(userId, asset.mimeType);
  const { error } = await supabase.storage
    .from(bucket)
    .upload(storage_path, decode(asset.base64), {
      cacheControl: '3600',
      upsert: false,
      contentType: asset.mimeType,
    });
  if (error) return { data: null, error };
  return { data: { storage_path }, error: null };
}
