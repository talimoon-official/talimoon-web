/**
 * Story Library category: "Words Left for a Child".
 *
 * A locale-independent internal id, plus the customer-facing working names.
 * NOT "Parents' Messages" — the words may come from a grandparent, aunt,
 * uncle, sibling or family friend, never assumed to be a parent.
 *
 * Unlike the rest of the Story Library (static, compile-time content), this
 * category is DYNAMIC: its entries are published Voice Memories, added and
 * revoked by post-delivery customer consent. It is served from
 * talimoon-intake at request time and is deliberately absent from the
 * sitemap so a since-revoked memory never lingers in a public index.
 */

export const WORDS_CATEGORY_ID = "words-left-for-a-child" as const;

export const WORDS_CATEGORY_LABEL = {
  uz: "Farzandga qoldirilgan so'zlar",
  en: "Words Left for a Child",
  ru: "Слова, оставленные ребёнку",
} as const;

export const WORDS_CATEGORY_PATH = "/story-library/words";

export {
  listPublicMemories,
  getPublicMemory,
  type PublicMemory,
} from "@/lib/memory/api";
