/**
 * The unfinished order, kept while the customer steps outside the form.
 *
 * Going Back past the form's first screen (to the book-type choice), or
 * following a navbar link mid-order, unmounts the form. Without this the
 * next visit would start from zero. The form writes its progress here on
 * every change and restores it on the next mount.
 *
 * Deliberately IN MEMORY ONLY, like `planIntent`: no storage, no URL. It
 * survives client-side navigation in this tab and nothing else — a reload or
 * a closed tab starts clean, and nothing personal (names, phone, photos,
 * voice) is ever written to disk. Never holds the order capability token or
 * the resume/payment token; those stay in the form's component memory.
 *
 * Cleared the moment an order is SAVED, so the completed form can never be
 * reopened (and never resubmitted) from here.
 */

/** an order untouched for this long was abandoned; never resurrect it */
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

let draft: { value: unknown; at: number } | null = null;

export function saveFormDraft<T>(value: T): void {
  draft = { value, at: Date.now() };
}

export function peekFormDraft<T>(): T | undefined {
  if (!draft) return undefined;
  if (Date.now() - draft.at > MAX_AGE_MS) {
    draft = null;
    return undefined;
  }
  return draft.value as T;
}

export function clearFormDraft(): void {
  draft = null;
}
