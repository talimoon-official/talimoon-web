/**
 * One-shot, in-memory signal: "the customer just came back to the order menu
 * from the saved-order screen" (auto-return or Back). The menu uses it to
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
