// The category-hint matcher now lives in the portable domain slice so the
// scan-to-prefill flow and the chat proposal cards share one implementation.
export { matchCategoryId } from '@rinciku/domain/ai-chat';

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
