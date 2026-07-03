import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

import { createExpensesApi } from '@rinciku/domain/expenses';
import { createIncomesApi } from '@rinciku/domain/incomes';

import { supabase } from '@/lib/supabase';
import type { PendingAttachment, ProposalKind } from '../types';

// App-local, platform-specific image helpers — the RN counterpart of the web
// File/FileReader helpers in apps/web/src/features/ai-chat/api.ts. The portable
// domain uploadAttachment takes a browser File and pushes it straight to
// storage; on native there is no File and Supabase storage wants an ArrayBuffer,
// so we do our own upload here and reuse only the portable DB inserts
// (createAttachment / createIncomeAttachment).
const { createAttachment } = createExpensesApi(supabase);
const { createIncomeAttachment } = createIncomesApi(supabase);

const EXPENSE_BUCKET = 'expense-attachments';
const INCOME_BUCKET = 'income-attachments';

const MAX_BYTES = 10 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
};

type Result<T> = { data: T | null; error: Error | null };

// A validated, base64-loaded image ready to send to the model and upload.
export type PickedImage = {
  uri: string;
  base64: string;
  mimeType: string;
  fileSize: number;
};

// Discriminated outcome so the composer can react (toast an i18n error, prompt
// for permission, or silently ignore a cancel).
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
// base64 enabled (one read serves both the Vision content block and the storage
// upload), then validates mime + size.
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

  return {
    ok: true,
    asset: { uri: asset.uri, base64: asset.base64, mimeType, fileSize },
  };
}

function buildStoragePath(userId: string, mimeType: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const ext = MIME_TO_EXT[mimeType] ?? 'jpg';
  return `${userId}/${year}-${month}/${Crypto.randomUUID()}.${ext}`;
}

async function uploadToBucket(
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

// Stores the chat image up front — before the model decides expense vs income —
// so the sent message can render it immediately and reload it later. Lives in
// the expense-attachments bucket because messages.attachment_id references
// expense_attachments; it stays unconfirmed (no expense_id).
export async function uploadChatImage(
  asset: PickedImage,
  userId: string
): Promise<Result<{ attachmentId: string; storagePath: string }>> {
  const up = await uploadToBucket(EXPENSE_BUCKET, asset, userId);
  if (up.error || !up.data) return { data: null, error: up.error };
  const row = await createAttachment({
    user_id: userId,
    storage_path: up.data.storage_path,
    mime_type: asset.mimeType,
    file_size_bytes: asset.fileSize,
  });
  if (row.error || !row.data) return { data: null, error: row.error };
  return {
    data: { attachmentId: row.data.id, storagePath: up.data.storage_path },
    error: null,
  };
}

// Uploads to the bucket matching the resolved kind and records the attachment
// row. Called after extraction so we know whether it's an expense or income
// document (the two live in separate tables/buckets), and the confirm step can
// link it to the created record.
export async function createImageAttachment(
  asset: PickedImage,
  kind: ProposalKind,
  userId: string
): Promise<Result<PendingAttachment>> {
  if (kind === 'expense') {
    const up = await uploadToBucket(EXPENSE_BUCKET, asset, userId);
    if (up.error || !up.data) return { data: null, error: up.error };
    const row = await createAttachment({
      user_id: userId,
      storage_path: up.data.storage_path,
      mime_type: asset.mimeType,
      file_size_bytes: asset.fileSize,
    });
    if (row.error || !row.data) return { data: null, error: row.error };
    return { data: { id: row.data.id, kind }, error: null };
  }
  const up = await uploadToBucket(INCOME_BUCKET, asset, userId);
  if (up.error || !up.data) return { data: null, error: up.error };
  const row = await createIncomeAttachment({
    user_id: userId,
    storage_path: up.data.storage_path,
    mime_type: asset.mimeType,
    file_size_bytes: asset.fileSize,
  });
  if (row.error || !row.data) return { data: null, error: row.error };
  return { data: { id: row.data.id, kind }, error: null };
}
