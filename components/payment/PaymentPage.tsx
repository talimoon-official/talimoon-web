"use client";

/**
 * TALIMOON — `/begin/personalized-book/payment` — the separate payment stage.
 * ----------------------------------------------------------------
 * Opens ONE already-saved order, never the form. Boot:
 *
 *   #p_<token> present → take it AND strip it from the address bar at once
 *                        (lib/payment/link.ts), then exchange it exactly once
 *                        (POST /v1/payment/session) for the HttpOnly session
 *                        cookie. The token then only lives in a ref, for a
 *                        retry after a network failure.
 *   no fragment        → reuse an existing session cookie (GET /v1/payment),
 *                        e.g. after a reload.
 *
 * Invalid / expired / revoked links get one neutral recovery state that never
 * reveals whether an order exists. The amount and currency shown are the
 * server's immutable snapshot; nothing here computes or sends a price.
 */

import { useEffect, useRef, useState } from "react";
import { Check, FileText, LoaderCircle, RefreshCw, Send, ShieldCheck, Upload } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { IntakeApiError } from "@/lib/order/api";
import {
  exchangePaymentSession,
  getPaymentView,
  openPaymentAttempt,
  uploadPaymentReceipt,
  type PaymentView,
} from "@/lib/payment/api";
import { PAYMENT_COPY, type PaymentCopy } from "@/lib/payment/copy";
import { takePaymentFragment } from "@/lib/payment/link";
import { lifecycleStatusLabel, type PaymentLocale } from "@/lib/payment/status";
import { formatMoney, PAYMENT_ACCOUNTS } from "@/components/begin/orderFormData";
import { PaymentAccount } from "@/components/begin/PaymentAccount";
import { CONTACT } from "@/lib/site/social";

/** Mirrors talimoon-intake MAX_UPLOAD_FILE_BYTES (25 MiB). */
export const MAX_RECEIPT_BYTES = 25 * 1024 * 1024;
const RECEIPT_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf";

type Phase =
  | { kind: "loading" }
  | { kind: "ready"; view: PaymentView }
  | { kind: "invalid" }
  | { kind: "notPayable" }
  | { kind: "network" };

function newKey(): string {
  return crypto.randomUUID();
}

function phaseForError(err: unknown): Phase {
  if (err instanceof IntakeApiError) {
    if (err.status === 409) return { kind: "notPayable" };
    if (err.status === 401 || err.status === 403 || err.status === 400 || err.status === 404) {
      return { kind: "invalid" };
    }
  }
  return { kind: "network" };
}

function isReceiptType(file: File): boolean {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

export function PaymentPage() {
  const { language } = useLanguage();
  const locale: PaymentLocale = language === "UZ" ? "uz" : language === "RU" ? "ru" : "en";
  const c = PAYMENT_COPY[locale];

  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  /** the resume token, memory-only, kept solely to retry a failed exchange */
  const tokenRef = useRef<string | null>(null);
  const bootedRef = useRef(false);

  /** Resolve the page state. Every state change happens after an await, so
   *  the boot effect never sets state synchronously. */
  async function resolve(): Promise<Phase> {
    try {
      const view = tokenRef.current
        ? await exchangePaymentSession(tokenRef.current)
        : await getPaymentView();
      // exchanged: the session cookie now carries the order — drop the token
      tokenRef.current = null;
      return { kind: "ready", view };
    } catch (err) {
      const next = phaseForError(err);
      if (next.kind !== "network") tokenRef.current = null;
      return next;
    }
  }

  function retry() {
    setPhase({ kind: "loading" });
    void resolve().then(setPhase);
  }

  useEffect(() => {
    // Exactly one boot per page load (StrictMode re-runs effects in dev).
    if (bootedRef.current) return;
    bootedRef.current = true;
    const read = takePaymentFragment();
    if (read.kind === "token") tokenRef.current = read.token;
    const boot: Promise<Phase> =
      read.kind === "malformed" ? Promise.resolve({ kind: "invalid" }) : resolve();
    void boot.then(setPhase);
  }, []);

  return (
    <section
      data-order-flow=""
      className="mx-auto flex min-h-[560px] w-full max-w-container-content flex-col items-center bg-surface-base px-6 py-16 md:py-20 lg:py-24"
    >
      <div className="mx-auto w-full max-w-md">
        <p className="text-center font-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-accent-primary">
          {c.brand}
        </p>
        {phase.kind === "loading" && <Loading copy={c} />}
        {phase.kind === "invalid" && (
          <SafeState title={c.invalidTitle} body={c.invalidBody} note={c.invalidReassurance} copy={c} />
        )}
        {phase.kind === "notPayable" && (
          <SafeState title={c.notPayableTitle} body={c.notPayableBody} copy={c} />
        )}
        {phase.kind === "network" && (
          <SafeState title={c.networkTitle} body={c.networkBody} copy={c} onRetry={retry} />
        )}
        {phase.kind === "ready" && (
          <OrderPayment
            view={phase.view}
            copy={c}
            locale={locale}
            onView={(view) => setPhase({ kind: "ready", view })}
            onFatal={(next) => setPhase(next)}
          />
        )}
      </div>
    </section>
  );
}

function Loading({ copy: c }: { copy: PaymentCopy }) {
  return (
    <div role="status" aria-live="polite" className="mt-16 flex flex-col items-center gap-4 text-center">
      <LoaderCircle size={26} strokeWidth={1.8} className="animate-spin text-accent-primary" />
      <p className="font-sans text-[14px] text-text-secondary">{c.loading}</p>
    </div>
  );
}

function SafeState({
  title,
  body,
  note,
  copy: c,
  onRetry,
}: {
  title: string;
  body: string;
  note?: string;
  copy: PaymentCopy;
  onRetry?: () => void;
}) {
  return (
    <div role="alert" className="mt-10 text-center">
      <h1 className="font-display text-[26px] font-medium leading-tight text-text-primary">{title}</h1>
      <p className="mt-4 font-sans text-[14px] leading-[1.65] text-text-secondary">{body}</p>
      {note && <p className="mt-3 font-sans text-[13px] leading-[1.6] text-text-secondary">{note}</p>}
      <div className="mt-8 flex flex-col gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md bg-accent-primary px-5 font-sans text-[14px] font-medium text-white outline-none hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
          >
            <RefreshCw size={15} strokeWidth={1.75} />
            {c.retry}
          </button>
        )}
        <a
          href={CONTACT.telegram.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-md border border-border-strong px-5 font-sans text-[14px] font-medium text-text-primary outline-none hover:border-accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary"
        >
          <Send size={15} strokeWidth={1.75} />
          {c.contactTelegram}
        </a>
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="note"
      className="mt-5 flex items-start gap-2.5 rounded-lg bg-accent-primary/[0.07] px-4 py-3 text-left font-sans text-[13px] leading-[1.6] text-text-primary"
    >
      <ShieldCheck size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent-primary" />
      <span>{children}</span>
    </p>
  );
}

function OrderPayment({
  view,
  copy: c,
  locale,
  onView,
  onFatal,
}: {
  view: PaymentView;
  copy: PaymentCopy;
  locale: PaymentLocale;
  onView: (view: PaymentView) => void;
  onFatal: (phase: Phase) => void;
}) {
  const status = view.lifecycleStatus;
  const amountText =
    view.amount != null && view.currency ? formatMoney(view.amount, view.currency) : null;

  const title =
    status === "AWAITING_PAYMENT"
      ? c.awaitingTitle
      : status === "PAYMENT_SUBMITTED"
        ? c.submittedTitle
        : lifecycleStatusLabel(status, locale);

  return (
    <div className="mt-6">
      <h1 className="text-center font-display text-[28px] font-medium leading-tight text-text-primary">
        {title}
      </h1>
      {status === "PAYMENT_SUBMITTED" && (
        <p className="mt-4 text-center font-sans text-[14px] leading-[1.65] text-text-secondary">
          {c.submittedBody}
        </p>
      )}
      {status === "PAID" && (
        <p className="mt-4 text-center font-sans text-[14px] leading-[1.65] text-text-secondary">
          {c.paidBody}
        </p>
      )}
      {status === "CANCELLED" && (
        <p className="mt-4 text-center font-sans text-[14px] leading-[1.65] text-text-secondary">
          {c.cancelledBody}
        </p>
      )}

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 rounded-lg border border-border-default px-5 py-4 font-sans text-[13px]">
        <dt className="text-text-muted">{c.orderCodeLabel}</dt>
        <dd className="text-right font-medium tracking-[0.04em] text-text-primary">{view.orderCode}</dd>
        <dt className="text-text-muted">{c.statusLabel}</dt>
        <dd className="text-right text-text-primary">{lifecycleStatusLabel(status, locale)}</dd>
        {amountText && (
          <>
            <dt className="text-text-muted">{c.amountLabel}</dt>
            <dd className="text-right font-display text-[18px] font-medium text-text-primary">{amountText}</dd>
            <dt className="text-text-muted">{c.currencyLabel}</dt>
            <dd className="text-right text-text-primary">{view.currency}</dd>
          </>
        )}
      </dl>

      {(status === "AWAITING_PAYMENT" || status === "PAYMENT_SUBMITTED") && (
        <Notice>{c.productionNotice}</Notice>
      )}

      {status === "AWAITING_PAYMENT" && view.acceptsPayment && (
        <PayForm view={view} amountText={amountText} copy={c} onView={onView} onFatal={onFatal} />
      )}
    </div>
  );
}

function PayForm({
  view,
  amountText,
  copy: c,
  onView,
  onFatal,
}: {
  view: PaymentView;
  amountText: string | null;
  copy: PaymentCopy;
  onView: (view: PaymentView) => void;
  onFatal: (phase: Phase) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  /** one attempt key per page — a retry resumes the SAME attempt */
  const attemptKeyRef = useRef<string | null>(null);
  /** one receipt key per chosen file — a retry of it is a replay, not a 2nd receipt */
  const receiptKeyRef = useRef<string | null>(null);

  const accounts = PAYMENT_ACCOUNTS[view.currency === "USD" ? "INTERNATIONAL" : "UZ"];
  const steps = c.howToPaySteps(amountText ?? "");

  function choose(incoming: File | undefined) {
    setError(null);
    if (!incoming) return;
    if (!isReceiptType(incoming)) return setError(c.receiptNotAllowed);
    if (incoming.size > MAX_RECEIPT_BYTES) return setError(c.receiptTooLarge);
    setFile(incoming);
    receiptKeyRef.current = newKey();
  }

  async function submit() {
    if (!file || sending) return;
    setSending(true);
    setError(null);
    try {
      attemptKeyRef.current ??= newKey();
      receiptKeyRef.current ??= newKey();
      await openPaymentAttempt(attemptKeyRef.current);
      const next = await uploadPaymentReceipt(receiptKeyRef.current, file);
      onView(next);
    } catch (err) {
      setSending(false);
      if (err instanceof IntakeApiError) {
        if (err.status === 401) return onFatal({ kind: "invalid" });
        if (err.status === 409) {
          // the order moved on (e.g. already submitted elsewhere) — show it
          try {
            return onView(await getPaymentView());
          } catch {
            return onFatal({ kind: "notPayable" });
          }
        }
        if (err.status === 413) return setError(c.receiptTooLarge);
        if (err.status === 415) return setError(c.receiptNotAllowed);
      }
      setError(c.submitFailed);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <div>
        <p className="font-sans text-[14px] font-medium text-text-primary">{c.howToPayHeading}</p>
        <ol className="mt-3 space-y-2">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 font-sans text-[13px] leading-[1.6] text-text-secondary">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-primary/[0.12] text-[11px] font-semibold text-accent-primary">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <PaymentAccount
            key={account.id}
            account={account}
            numberLabel={c.cardNumberLabel}
            holderLabel={c.cardHolderLabel}
            copyLabel={c.copyAction}
            copiedLabel={c.copiedAction}
          />
        ))}
      </div>

      <div>
        <p className="font-sans text-[14px] font-medium text-text-primary">{c.receiptLabel}</p>
        <p className="mt-1 font-sans text-[12px] text-text-muted">{c.receiptHint}</p>
        {file ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-border-default px-3.5 py-2.5">
            <span className="inline-flex min-w-0 items-center gap-2 font-sans text-[13px] text-text-primary">
              {file.type === "application/pdf" ? (
                <FileText size={15} strokeWidth={1.75} className="shrink-0 text-accent-primary" />
              ) : (
                <Check size={15} strokeWidth={2.25} className="shrink-0 text-accent-primary" />
              )}
              <span className="truncate" data-testid="receipt-name">{file.name}</span>
            </span>
            <label className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center font-sans text-[12.5px] font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary">
              {c.receiptReplace}
              <input
                type="file"
                accept={RECEIPT_ACCEPT}
                className="hidden"
                disabled={sending}
                onChange={(e) => {
                  choose(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
        ) : (
          <label className="mt-3 flex min-h-[52px] cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border-strong px-4 font-sans text-[13.5px] font-medium text-text-primary transition-colors hover:border-solid hover:border-accent-primary">
            <Upload size={15} strokeWidth={1.5} className="text-text-secondary" />
            {c.receiptChoose}
            <input
              type="file"
              accept={RECEIPT_ACCEPT}
              className="hidden"
              aria-label={c.receiptChoose}
              onChange={(e) => {
                choose(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {error && (
          <p role="alert" className="mt-2 font-sans text-[12.5px] text-state-error">
            {error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={() => void submit()}
        aria-disabled={!file || sending || undefined}
        className={[
          "inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-md bg-accent-primary px-5 font-sans text-[14px] font-medium text-white outline-none transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary",
          file && !sending ? "opacity-100 hover:opacity-90" : "opacity-40",
        ].join(" ")}
      >
        {sending && <LoaderCircle size={15} strokeWidth={2} className="animate-spin" />}
        {sending ? c.submittingPayment : c.submitPayment}
      </button>
    </div>
  );
}

export default PaymentPage;
