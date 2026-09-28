"use client";

/**
 * The order flow's ONE Back control + the system-Back registry.
 *
 * Every screen of the form renders exactly one `<FlowBackButton>`; the same
 * handler is registered as the screen's system-Back action, so the browser /
 * Android / installed-PWA Back does precisely what the visible "Orqaga" does
 * (see lib/order/formHistoryGuard.ts). Screens without a visible Back (the
 * saved screen) register their action with `useFlowBackHandler`.
 *
 * Outside a <FlowBackProvider> (tests, embedded use) the button still works;
 * it simply registers nothing.
 */

import { createContext, useContext, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

export type FlowBackRegistry = { current: (() => void) | null };

const FlowBackContext = createContext<FlowBackRegistry | null>(null);

export function FlowBackProvider({
  registry,
  children,
}: {
  registry: FlowBackRegistry;
  children: ReactNode;
}) {
  return <FlowBackContext.Provider value={registry}>{children}</FlowBackContext.Provider>;
}

/** Registers `handler` as the current system-Back action while mounted.
 *  The latest handler is always used (no stale closure); `enabled: false`
 *  swallows system Back (e.g. while the order is being sent). */
export function useFlowBackHandler(handler: () => void, enabled = true) {
  const registryRef = useContext(FlowBackContext);
  const latest = useRef(handler);
  const on = useRef(enabled);
  useLayoutEffect(() => {
    latest.current = handler;
    on.current = enabled;
  });
  useEffect(() => {
    if (!registryRef) return;
    const fn = () => {
      if (on.current) latest.current();
    };
    registryRef.current = fn;
    return () => {
      if (registryRef.current === fn) registryRef.current = null;
    };
  }, [registryRef]);
}

/**
 * The visible Back. 44px touch target (the text stays small and quiet; the
 * hit area is padded out, with a negative inline margin so the label still
 * aligns with the content edge).
 */
export function FlowBackButton({
  onBack,
  label,
  disabled = false,
}: {
  onBack: () => void;
  label: string;
  disabled?: boolean;
}) {
  useFlowBackHandler(onBack, !disabled);
  return (
    <button
      type="button"
      onClick={onBack}
      disabled={disabled}
      data-flow-back=""
      className="-mx-2.5 -my-3 inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-md px-2.5 font-sans text-[13px] font-medium text-text-secondary outline-none transition-opacity hover:opacity-70 focus-visible:underline disabled:pointer-events-none disabled:opacity-40"
    >
      <ArrowLeft size={14} strokeWidth={1.75} className="rtl:-scale-x-100" aria-hidden="true" />
      {label}
    </button>
  );
}
