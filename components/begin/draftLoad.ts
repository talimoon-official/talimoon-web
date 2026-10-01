import { emptyForm } from "./PersonalizedBookOrderForm";
import { STEPS, type BookType } from "./orderFormData";
import { restoreOrderDraft, type LoadedOrderDraft, type RestoredOrderDraft } from "./orderDraft";

/**
 * Turns what storage returned into a decision for the order routes:
 *
 *  - `restored`: the draft rebuilt over a fresh form, or null (none / junk)
 *  - `discard`:  a record exists but cannot be trusted — delete it
 *  - `ask`:      the customer is STARTING an order (a plan was just chosen)
 *                while a valid unfinished one exists — never drop them into
 *                it silently, never start over silently: show ResumeChoice.
 *                Without a fresh plan choice (reload, "Davom ettirish",
 *                the PWA reopening the form) the draft simply reopens.
 */
export function resolveDraftLoad(
  loaded: LoadedOrderDraft | undefined,
  chosenBookType: BookType | undefined,
): { restored: RestoredOrderDraft | null; ask: boolean; discard: boolean } {
  const restored = loaded
    ? restoreOrderDraft(loaded.payload, emptyForm(), STEPS.length, loaded.media)
    : null;
  if (!restored) return { restored: null, ask: false, discard: loaded != null };
  return { restored, ask: chosenBookType != null, discard: false };
}
