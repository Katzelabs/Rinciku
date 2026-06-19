// Single source of truth for attachment upload limits, shared by the income and
// expense forms. The MIME allow-list and size limit here must stay in sync with
// the Supabase Storage bucket config in `supabase/seed.sql`
// (allowed_mime_types + file_size_limit), which enforces the same rules
// server-side.

export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export type AttachmentConfig = {
  /** MIME allow-list, both as a Set (for validation) and joined string. */
  allowedMime: ReadonlySet<string>;
  /** Value for an <input type="file" accept> attribute. */
  accept: string;
  /** Max file size in bytes. */
  maxBytes: number;
};

/**
 * Builds an AttachmentConfig from one MIME list so the `accept` string and the
 * validation Set can never drift apart.
 */
export function defineAttachmentConfig(
  mimeTypes: readonly string[],
  maxBytes: number = ATTACHMENT_MAX_BYTES
): AttachmentConfig {
  return {
    allowedMime: new Set(mimeTypes),
    accept: mimeTypes.join(','),
    maxBytes,
  };
}
