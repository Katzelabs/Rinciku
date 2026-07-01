// Zod schema factory lives in @rinciku/domain (shared with mobile, i18n-aware);
// re-export so existing web call sites keep importing from `../schemas`.
export { makeEssentialSchema, type EssentialInput } from '@rinciku/domain/essentials';
