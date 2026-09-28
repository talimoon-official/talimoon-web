/**
 * Browser / system Back inside the order form.
 *
 * The whole form lives on ONE route (`/begin/personalized-book/form`); its
 * phases and steps are component state, not URLs. Without a guard, the
 * browser (or Android / installed-PWA system) Back would leave the route at
 * once and throw away everything the customer typed.
 *
 * The guard keeps exactly ONE extra history entry — a marked copy of the
 * form URL — on top of the form's own entry:
 *
 *   [..., previous page, form, form★]      ★ = guard entry (current)
 *
 * System Back pops ★ → a `popstate` on the plain form entry. The guard runs
 * the screen's own Back action (the same one the visible "Orqaga" button
 * runs) and pushes ★ again, so the stack never grows: no duplicate entries,
 * no loops. When the form is at its true root, the Back action instead calls
 * `leave()`, which steps past the form to the previous page.
 *
 * No URL is ever changed (the entries share the form URL), so Next.js only
 * restores its own tree for the same route — the form stays mounted.
 */

export const GUARD_MARKER = "__tmOrderFormGuard";

export interface GuardHistory {
  readonly state: unknown;
  pushState(data: unknown, unused: string): void;
  back(): void;
  go(delta: number): void;
}

export interface GuardTarget {
  addEventListener(type: "popstate", fn: (e: PopStateEvent) => void): void;
  removeEventListener(type: "popstate", fn: (e: PopStateEvent) => void): void;
}

function isGuardState(state: unknown): boolean {
  return typeof state === "object" && state !== null && GUARD_MARKER in state;
}

export interface FormHistoryGuard {
  /** Leave the form for the previous page. `true` while handling a system
   *  Back (we are already on the plain form entry, one step back suffices). */
  leave(): void;
  /** Mark the guard as done (a navigation away is under way) — no re-push. */
  release(): void;
  /** True while a system Back is being handled. */
  readonly handlingSystemBack: boolean;
  dispose(): void;
}

export function createFormHistoryGuard({
  history,
  target,
  onSystemBack,
  fallbackLeave,
}: {
  history: GuardHistory;
  target: GuardTarget;
  /** Runs the current screen's Back action. */
  onSystemBack: () => void;
  /** Visible-button leave when there is no in-app page behind the form
   *  (direct landing / reload): e.g. `router.replace(PRICE_PATH)`. `null`
   *  → step back through history. */
  fallbackLeave: (() => void) | null;
}): FormHistoryGuard {
  let released = false;
  let inPop = false;

  // A reload on ★, or coming Back onto ★ from another page, already has the
  // guard entry — never stack a second one.
  if (!isGuardState(history.state)) history.pushState({ [GUARD_MARKER]: true }, "");

  function onPop(e: PopStateEvent) {
    if (released) return;
    // Forward onto ★ again: nothing to do, the stack is already guarded.
    if (isGuardState(e.state)) return;
    inPop = true;
    try {
      onSystemBack();
    } finally {
      inPop = false;
    }
    if (!released) history.pushState({ [GUARD_MARKER]: true }, "");
  }
  target.addEventListener("popstate", onPop);

  return {
    get handlingSystemBack() {
      return inPop;
    },
    leave() {
      if (released) return;
      released = true;
      if (inPop) history.back();
      else if (fallbackLeave) fallbackLeave();
      else history.go(-2);
    },
    release() {
      released = true;
    },
    dispose() {
      target.removeEventListener("popstate", onPop);
    },
  };
}
