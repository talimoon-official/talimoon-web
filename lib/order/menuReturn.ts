/**
 * One-shot, in-memory signal: "the customer just came back to the order menu
 * from the saved-order screen" ("Keyinroq to‘lash" or Back). The menu uses it to
 * put keyboard / screen-reader focus on its heading, so the user lands at a
 * sensible start instead of wherever focus happened to fall.
 */

let pending = false;

export function markReturnedToMenu(): void {
  pending = true;
}

/** Reads AND clears the signal. */
export function consumeReturnedToMenu(): boolean {
  const was = pending;
  pending = false;
  return was;
}

/**
 * The opposite direction: "the resume screen was opened from the order menu
 * by a client navigation", so the menu is right behind it in history and its
 * Back can simply step back (no duplicate menu entry). Peeked, not consumed,
 * so a StrictMode double render reads the same answer.
 */
let openedFromMenu = false;

export function markOpenedFromMenu(): void {
  openedFromMenu = true;
}

export function peekOpenedFromMenu(): boolean {
  return openedFromMenu;
}

export function clearOpenedFromMenu(): void {
  openedFromMenu = false;
}
