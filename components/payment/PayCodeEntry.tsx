"use client";

/**
 * TALIMOON — `/pay` — "To‘lov kodini kiriting".
 * ----------------------------------------------------------------
 * A customer who submitted the form earlier types (or pastes) the short
 * payment code they were given (e.g. K7M4P2). The backend exchanges it for
 * the SAME HttpOnly payment session a resume link gives; the existing payment
 * page then opens for that saved order. The long form is never involved.
 *
 * Input: shown uppercase, spaces/hyphens dropped, impossible characters
 * ignored, capped at 6 — while the caret stays where the customer is typing.
 * The code lives only in component state: never stored, never in a URL,
 * never logged or sent to analytics. Every failure gets one generic message.
 */

import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle, Send } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { IntakeApiError } from "@/lib/order/api";
import { exchangePaymentCode } from "@/lib/payment/api";
import { PAYMENT_COPY } from "@/lib/payment/copy";
import {
  PAYMENT_CODE_ALPHABET,
  PAYMENT_CODE_LENGTH,
  isCompletePaymentCode,
  normalizePaymentCodeInput,
} from "@/lib/payment/code";
import { PAYMENT_PATH } from "@/lib/payment/link";
import type { PaymentLocale } from "@/lib/payment/status";
import { CONTACT } from "@/lib/site/social";

export function PayCodeEntry({ onOpened }: { onOpened?: () => void }) {
  const { language } = useLanguage();
  const locale: PaymentLocale = language === "UZ" ? "uz" : language === "RU" ? "ru" : "en";
  const c = PAYMENT_COPY[locale];
  const router = useRouter();

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  /** caret position to restore after normalization re-renders the value */
  const caret = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (el && caret.current !== null && document.activeElement === el) {
      el.setSelectionRange(caret.current, caret.current);
      caret.current = null;
    }
  }, [value]);

  function onChange(raw: string, selectionStart: number | null) {
    const next = normalizePaymentCodeInput(raw);
    // keep the caret after the same number of VALID characters it followed
    const before = normalizePaymentCodeInput(raw.slice(0, selectionStart ?? raw.length));
    caret.current = Math.min(before.length, next.length);
    setValue(next);
    if (error) setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!isCompletePaymentCode(value)) {
      setError(c.payInvalid);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await exchangePaymentCode(value);
      if (onOpened) onOpened();
      else router.replace(PAYMENT_PATH);
    } catch (err) {
      setBusy(false);
      if (err instanceof IntakeApiError) {
        setError(err.status === 429 ? c.payRateLimited : c.payInvalid);
      } else {
        setError(c.payNetwork);
      }
    }
  }

  const complete = isCompletePaymentCode(value);

  return (
    <section className="mx-auto flex min-h-[560px] w-full max-w-container-content flex-col items-center bg-surface-base px-6 py-16 md:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-md">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary/[0.14]">
          <KeyRound size={24} strokeWidth={1.75} className="text-accent-primary" />
        </span>
        <h1 className="text-center font-display text-[28px] font-medium leading-tight text-text-primary">
          {c.payTitle}
        </h1>
        <p className="mt-4 text-center font-sans text-[14px] leading-[1.65] text-text-secondary">
          {c.payDescription}
        </p>

        <form onSubmit={submit} noValidate className="mt-8">
          <label htmlFor="payment-code" className="block font-sans text-[13px] font-medium text-text-primary">
            {c.payInputLabel}
          </label>
          <input
            ref={inputRef}
            id="payment-code"
            name="payment-code"
            value={value}
            onChange={(e) => onChange(e.target.value, e.target.selectionStart)}
            placeholder="K7M4P2"
            // hyphens/spaces are accepted while typing and stripped at once
            maxLength={PAYMENT_CODE_LENGTH * 3}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "payment-code-error" : undefined}
            pattern={`[${PAYMENT_CODE_ALPHABET}]{${PAYMENT_CODE_LENGTH}}`}
            className="mt-2 block h-16 w-full rounded-lg border border-border-strong bg-surface-base px-4 text-center font-mono text-[30px] font-semibold uppercase tracking-[0.42em] text-text-primary outline-none transition-colors placeholder:text-text-muted/45 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/25"
          />
          {error && (
            <p id="payment-code-error" role="alert" className="mt-3 font-sans text-[13px] leading-[1.55] text-state-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            aria-disabled={!complete || busy || undefined}
            className={[
              "mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-md bg-accent-primary px-5 font-sans text-[15px] font-medium text-white outline-none transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
              complete && !busy ? "opacity-100 hover:opacity-90" : "opacity-50",
            ].join(" ")}
          >
            {busy && <LoaderCircle size={16} strokeWidth={2} className="animate-spin" aria-hidden="true" />}
            {busy ? c.payOpening : c.payOpen}
          </button>
        </form>

        <p className="mt-8 text-center font-sans text-[12.5px] leading-[1.6] text-text-muted">
          {c.paySupport}{" "}
          <a
            href={CONTACT.telegram.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-text-primary underline underline-offset-4"
          >
            <Send size={12} strokeWidth={1.75} />
            {c.contactTelegram}
          </a>
        </p>
      </div>
    </section>
  );
}

export default PayCodeEntry;
