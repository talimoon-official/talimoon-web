/**
 * One-shot handoff of the book type the customer just chose (a plan card on
 * the order-entry step or the product page) into the order form, which
 * already knows how to seed its child count from `initialBookType`.
 *
 * Deliberately in memory only: no URL parameter, no storage. It survives the
 * client-side navigation to the form and nothing else; on a hard reload the
 * form simply asks for the child count itself, exactly as before. Not
 * sensitive (a package type), but there is no reason to persist it.
 *
 * The form route PEEKS on render and CLEARS after mount, so React StrictMode's
 * double-invoked initializers cannot lose the value.
 */

import type { BookType } from "@/components/begin/orderFormData";

/** a choice older than this was abandoned; never apply it to a later visit */
const MAX_AGE_MS = 30 * 60 * 1000;

let pending: { bookType: BookType; at: number } | null = null;

export function setPlanIntent(bookType: BookType): void {
  pending = { bookType, at: Date.now() };
}

export function peekPlanIntent(): BookType | undefined {
  if (!pending) return undefined;
  if (Date.now() - pending.at > MAX_AGE_MS) {
    pending = null;
    return undefined;
  }
  return pending.bookType;
}

export function clearPlanIntent(): void {
  pending = null;
}
