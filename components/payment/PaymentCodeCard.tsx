"use client";

/**
 * TALIMOON — the customer's PAYMENT CODE, shown prominently but calmly:
 *
 *   TO‘LOV KODI
 *   K7M 4P2          [ Nusxalash ]
 *   Keyinroq to‘lov qilish uchun shu kod kerak bo‘ladi.
 *
 * The grouping space is visual only — the copy button copies the bare code.
 * Held in props/memory only: never stored, never sent to analytics.
 */

import { useEffect, useRef, useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";
import { formatPaymentCode } from "@/lib/payment/code";

export function PaymentCodeCard({
  code,
  label,
  hint,
  copyLabel,
  copiedLabel,
}: {
  code: string;
  label: string;
  hint: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked (in-app browser): the code stays visible and selectable.
    }
  }

  return (
    <div
      data-testid="payment-code-card"
      className="rounded-lg border border-accent-primary/35 bg-accent-primary/[0.05] px-5 py-4 text-left"
    >
      <p className="flex items-center gap-1.5 font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-primary">
        <KeyRound size={13} strokeWidth={1.9} aria-hidden="true" />
        {label}
      </p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span
          aria-label={`${label}: ${code.split("").join(" ")}`}
          className="select-all font-mono text-[28px] font-semibold tracking-[0.14em] text-text-primary"
        >
          {formatPaymentCode(code)}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-md border border-border-strong px-3.5 font-sans text-[13px] font-medium text-text-primary outline-none transition-colors hover:border-accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          {copied ? (
            <Check size={14} strokeWidth={2} className="text-accent-primary" />
          ) : (
            <Copy size={14} strokeWidth={1.75} />
          )}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <p className="mt-1.5 font-sans text-[12px] leading-[1.55] text-text-secondary">{hint}</p>
    </div>
  );
}

export default PaymentCodeCard;
