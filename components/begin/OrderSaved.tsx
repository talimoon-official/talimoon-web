"use client";

/**
 * TALIMOON — ORDER — the screen after a successful submit.
 * ----------------------------------------------------------------
 * The form is done and the order is SAVED (lifecycle AWAITING_PAYMENT).
 * Payment is a separate stage, so this screen asks the customer to CHOOSE —
 * and waits for that choice (no timer, no auto-return):
 *
 *   "Hozir to‘lash"    → the payment page of THIS order, opened through the
 *                        order-bound resume capability (URL fragment only —
 *                        see lib/payment/link.ts). No code re-entry.
 *   "Keyinroq to‘lash" → ONE tap: the TALIMOON payment-code card (PNG, see
 *                        lib/payment/receipt.ts) is drawn from the ORIGINAL
 *                        code finalize returned and its save starts from that
 *                        same tap (download; the share sheet on iPhone); a
 *                        short confirmation, then back to the order menu.
 *                        If the save could not start, the customer stays here
 *                        with "Chekni saqlash"; in an in-app browser (where
 *                        downloads are often dropped) the card is shown
 *                        inline for press-and-hold instead.
 *
 * Nothing here talks to the backend: no finalize, no new code, no new order,
 * no Telegram message. A choice, once made, cannot be made twice (double tap).
 *
 * Nothing here says the book is being prepared: production starts only
 * after the payment is confirmed AND an admin starts it.
 *
 * The raw resume token and payment code live only in props (memory). They
 * are never written to storage or a URL query; the token only leaves memory
 * as the fragment of the payment link, the code only inside the card.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, Clock, Copy, Download, Send, ShieldCheck } from "lucide-react";
import type { PaymentCopy } from "@/lib/payment/copy";
import { lifecycleStatusLabel, type PaymentLocale } from "@/lib/payment/status";
import { paymentPath, paymentUrl } from "@/lib/payment/link";
import { CONTACT } from "@/lib/site/social";
import { PaymentCodeCard } from "@/components/payment/PaymentCodeCard";
import { ENTRY_PATH } from "@/lib/order/paths";
import {
  renderReceiptPng,
  startReceiptSave,
  type ReceiptContent,
  type ReceiptSaveOutcome,
} from "@/lib/payment/receipt";
import { useFlowBackHandler } from "./FlowBack";

export const PAY_ENTRY_PATH = "/pay";
const PAY_ENTRY_DISPLAY = "talimoon.com/pay";
/** After the receipt save STARTED: a short technical pause so leaving the
 *  page can never cancel the download (not a countdown). */
export const LEAVE_AFTER_SAVE_MS = 1200;

export interface OrderSavedProps {
  orderCode: string;
  /** the backend's 30-day payment/resume capability; null on an older backend */
  resume: { token: string; expiresAt: string } | null;
  /** the short payment code (e.g. K7M4P2); null on an older backend */
  paymentCode?: { code: string; expiresAt: string } | null;
  /** what automated SMS/WhatsApp delivery did — only "accepted" is claimed */
  paymentCodeDelivery?: {
    channel: "sms" | "whatsapp" | null;
    status: "accepted" | "failed" | "provider_unavailable" | "not_configured";
  } | null;
  copy: PaymentCopy;
  locale: PaymentLocale;
  /** injectable for tests; defaults to a full-page replace() so "Back" from
   *  the payment page never lands on an empty form */
  navigate?: (path: string) => void;
  /** returns to the order menu (after "Keyinroq to‘lash", system Back);
   *  defaults to `navigate(ENTRY_PATH)` */
  onReturnToMenu?: () => void;
  /** injectable for tests: draws the card (sync) */
  renderReceipt?: (c: ReceiptContent) => File;
  /** injectable for tests: starts saving the card (called inside the tap) */
  saveReceipt?: (file: File) => Promise<ReceiptSaveOutcome>;
}

type LaterState = "idle" | "working" | "started" | "inline" | "failed";

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

const primaryBtn =
  "inline-flex min-h-[48px] items-center justify-center rounded-md bg-accent-primary px-5 font-sans text-[14px] font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary";
const secondaryBtn =
  "inline-flex min-h-[48px] items-center justify-center rounded-md border border-border-strong px-5 font-sans text-[14px] font-medium text-text-primary outline-none transition-colors hover:border-accent-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary";

export function OrderSaved({
  orderCode,
  resume,
  paymentCode = null,
  paymentCodeDelivery = null,
  copy: c,
  locale,
  navigate,
  onReturnToMenu,
  renderReceipt = renderReceiptPng,
  saveReceipt = startReceiptSave,
}: OrderSavedProps) {
  const [mode, setMode] = useState<"decide" | "later">("decide");
  const go = navigate ?? ((path: string) => window.location.replace(path));
  const canPayNow = resume != null || paymentCode != null;

  // ── return to the order menu — exactly once, from whichever trigger wins
  const returnToMenu = onReturnToMenu ?? (() => go(ENTRY_PATH));
  const returnRef = useRef(returnToMenu);
  useLayoutEffect(() => {
    returnRef.current = returnToMenu;
  });
  const returnedRef = useRef(false);
  function leaveToMenu() {
    if (returnedRef.current) return;
    returnedRef.current = true;
    returnRef.current();
  }
  // System / browser Back on this screen goes to the menu too — never back
  // into the completed form.
  useFlowBackHandler(leaveToMenu);

  // ── one choice only: a double tap can never navigate twice or start a
  //    second save (nothing here reaches the backend either way)
  const choiceRef = useRef<"now" | "later" | null>(null);
  const [choice, setChoice] = useState<"now" | "later" | null>(null);
  /** a save is in flight or has started (blocks a second one) */
  const savingRef = useRef(false);
  const [later, setLater] = useState<LaterState>("idle");
  const receiptRef = useRef<File | null>(null);
  const [inlineUrl, setInlineUrl] = useState<string | null>(null);
  const leaveTimer = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(leaveTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!inlineUrl) return;
    return () => URL.revokeObjectURL(inlineUrl);
  }, [inlineUrl]);

  // Focus the title when the screen opens and when it switches to "later".
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [mode]);

  function payNow() {
    if (choiceRef.current) return;
    choiceRef.current = "now";
    setChoice("now");
    // the resume link opens THIS order's payment page directly; only a
    // backend that issued no link falls back to the code on /pay
    if (resume) go(paymentPath(resume.token));
    else if (paymentCode) go(PAY_ENTRY_PATH);
  }

  /** The card, drawn ONCE from the original code (kept for a retry). */
  function receiptFile(): File {
    if (!receiptRef.current) {
      receiptRef.current = renderReceipt({
        orderCode,
        paymentCode: paymentCode!.code,
        labels: {
          order: c.receiptOrderLabel,
          code: c.receiptCodeLabel,
          status: lifecycleStatusLabel("AWAITING_PAYMENT", locale),
          instruction: c.receiptInstruction,
        },
      });
    }
    return receiptRef.current;
  }

  /** Runs INSIDE the tap: draw (sync) → start the save (sync call) → only
   *  once it started, confirm and leave. Any failure keeps the customer here
   *  with the code on screen and "Chekni saqlash". */
  function saveAndLeave() {
    if (savingRef.current) return;
    savingRef.current = true;
    /** not started: stay, code on screen, "Chekni saqlash" + "Hozir to‘lash" */
    const failed = () => {
      savingRef.current = false;
      choiceRef.current = null;
      setChoice(null);
      setLater("failed");
    };
    let pending: Promise<ReceiptSaveOutcome>;
    try {
      pending = saveReceipt(receiptFile());
    } catch {
      failed();
      return;
    }
    setLater("working");
    pending.then(
      (outcome) => {
        if (outcome === "download" || outcome === "shared") {
          setLater("started");
          leaveTimer.current = window.setTimeout(leaveToMenu, LEAVE_AFTER_SAVE_MS);
        } else if (outcome === "inline") {
          setInlineUrl(URL.createObjectURL(receiptFile()));
          setLater("inline");
        } else {
          failed(); // share sheet closed without saving
        }
      },
      failed,
    );
  }

  function payLater() {
    if (choiceRef.current) return;
    choiceRef.current = "later";
    setChoice("later");
    // an older backend without a payment code: the resume-link details
    // (not a final choice — "Hozir to‘lash" stays available there)
    if (!paymentCode) {
      choiceRef.current = null;
      setChoice(null);
      setMode("later");
      return;
    }
    saveAndLeave();
  }

  /** "Chekni saqlash" — a fresh tap, the same card (never a new code). */
  function retrySave() {
    if (choiceRef.current) return;
    choiceRef.current = "later";
    setChoice("later");
    saveAndLeave();
  }

  const delivered =
    paymentCodeDelivery?.status === "accepted"
      ? paymentCodeDelivery.channel === "sms"
        ? c.deliveredSms
        : c.deliveredWhatsapp
      : null;

  return (
    <section
      data-order-flow=""
      className="mx-auto flex min-h-[560px] w-full max-w-container-content flex-col items-center bg-surface-base px-6 py-16 md:py-20 lg:py-28"
    >
      <div className="mx-auto w-full max-w-md text-center">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary/[0.14]">
          {mode === "decide" ? (
            <Check size={24} strokeWidth={2} className="text-accent-primary" />
          ) : (
            <Clock size={24} strokeWidth={1.75} className="text-accent-primary" />
          )}
        </span>

        <h2 ref={titleRef} tabIndex={-1} className="font-display outline-none text-[26px] font-medium leading-tight text-text-primary">
          {mode === "decide" ? c.savedTitle : c.laterTitle}
        </h2>
        <p className="mt-4 font-sans text-[14px] leading-[1.65] text-text-secondary">
          {mode === "decide" ? c.savedBody : c.laterBody}
        </p>

        <dl className="mx-auto mt-6 grid max-w-xs grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-lg border border-border-default px-5 py-4 text-left font-sans text-[13px]">
          <dt className="text-text-muted">{c.orderCodeLabel}</dt>
          <dd className="text-right font-medium tracking-[0.04em] text-text-primary">{orderCode}</dd>
          {mode === "later" && (
            <>
              <dt className="text-text-muted">{c.statusLabel}</dt>
              <dd className="text-right text-text-primary">
                {lifecycleStatusLabel("AWAITING_PAYMENT", locale)}
              </dd>
            </>
          )}
        </dl>

        {paymentCode && (
          <div className="mt-5 space-y-2">
            <PaymentCodeCard
              code={paymentCode.code}
              label={c.paymentCodeLabel}
              hint={c.codeKeepHint}
              copyLabel={c.copyCode}
              copiedLabel={c.codeCopied}
            />
            {mode === "later" && (
              <p className="flex items-center justify-between rounded-lg border border-border-default px-5 py-3 text-left font-sans text-[13px]">
                <span className="text-text-muted">{c.payAccessLabel}</span>
                <a
                  href={PAY_ENTRY_PATH}
                  className="font-medium text-text-primary underline underline-offset-4"
                >
                  {PAY_ENTRY_DISPLAY}
                </a>
              </p>
            )}
            <p className="text-left font-sans text-[12.5px] leading-[1.6] text-text-secondary">
              {delivered ? (
                <>{delivered} </>
              ) : (
                <strong className="font-medium text-text-primary">{c.saveCodeNotice}. </strong>
              )}
              {mode === "decide" ? c.paymentCodeHelper : c.laterCodeHelper}
            </p>
          </div>
        )}

        <p
          role="note"
          className="mt-5 flex items-start gap-2.5 rounded-lg bg-accent-primary/[0.07] px-4 py-3 text-left font-sans text-[13px] leading-[1.6] text-text-primary"
        >
          <ShieldCheck size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-accent-primary" />
          <span>{mode === "decide" ? c.productionNotice : c.laterNotice}</span>
        </p>

        {mode === "decide" ? (
          <div className="mt-8 flex flex-col gap-3">
            {canPayNow ? (
              <>
                <button
                  type="button"
                  onClick={payNow}
                  disabled={choice !== null}
                  className={`${primaryBtn} disabled:opacity-50`}
                >
                  {c.payNow}
                </button>
                {later === "failed" ? (
                  <button type="button" onClick={retrySave} disabled={choice !== null} className={`${secondaryBtn} gap-2 disabled:opacity-50`}>
                    <Download size={15} strokeWidth={1.75} aria-hidden="true" />
                    {c.saveReceipt}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={payLater}
                    disabled={choice !== null}
                    aria-busy={later === "working" || undefined}
                    className={`${secondaryBtn} disabled:opacity-50`}
                  >
                    {later === "working" ? c.receiptWorking : c.payLater}
                  </button>
                )}
              </>
            ) : (
              <p className="font-sans text-[13px] leading-[1.6] text-text-secondary">{c.savedNoLink}</p>
            )}
          </div>
        ) : (
          <PayLaterDetails copy={c} resume={resume} hasCode={paymentCode != null} onPayNow={payNow} />
        )}

        {later === "started" && (
          <p
            role="status"
            data-receipt-confirm=""
            className="mt-6 flex items-start gap-2.5 rounded-lg border border-accent-primary/40 bg-accent-primary/[0.08] px-4 py-3 text-left font-sans text-[13px] leading-[1.6] text-text-primary"
          >
            <Check size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-accent-primary" aria-hidden="true" />
            <span>{c.laterConfirm}</span>
          </p>
        )}

        {later === "failed" && (
          <p role="alert" data-receipt-failed="" className="mt-6 text-left font-sans text-[13px] leading-[1.6] text-text-secondary">
            {c.receiptFailed}
          </p>
        )}

        {later === "inline" && inlineUrl && (
          <div data-receipt-inline="" className="mt-6 space-y-3 text-left">
            <p role="status" className="font-sans text-[13px] leading-[1.6] text-text-primary">
              {c.laterConfirm} {c.receiptInAppHint}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element -- a local blob: URL, not an optimisable asset */}
            <img src={inlineUrl} alt={c.receiptAlt} className="w-full rounded-lg border border-border-default" />
            <button type="button" onClick={leaveToMenu} className={`${secondaryBtn} w-full`}>
              {c.returnToMenu}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function PayLaterDetails({
  copy: c,
  resume,
  hasCode,
  onPayNow,
}: {
  copy: PaymentCopy;
  resume: OrderSavedProps["resume"];
  hasCode: boolean;
  onPayNow: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // With a payment code, the code + talimoon.com/pay IS the way back. The
  // personal link stays only as a fallback for a backend that issues no code.
  const link = !hasCode && resume ? paymentUrl(window.location.origin, resume.token) : null;
  const validUntil = link && resume ? formatDate(resume.expiresAt) : "";

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked (in-app browser): show the link for manual copy.
      setShowRaw(true);
    }
  }

  return (
    <div className="mt-8 space-y-5 text-left">
      {hasCode || resume ? (
        <button type="button" onClick={onPayNow} className={`${primaryBtn} w-full`}>
          {c.payNow}
        </button>
      ) : (
        <p className="font-sans text-[13px] leading-[1.6] text-text-secondary">{c.savedNoLink}</p>
      )}

      {link && (
        <div className="rounded-lg border border-border-default p-5">
          <p className="font-sans text-[14px] font-medium text-text-primary">{c.linkHeading}</p>
          <p className="mt-1.5 font-sans text-[12.5px] leading-[1.6] text-text-secondary">{c.linkBody}</p>
          {validUntil && (
            <p className="mt-1.5 font-sans text-[12px] text-text-muted">{c.linkValidUntil(validUntil)}</p>
          )}
          <button type="button" onClick={copyLink} className={`${secondaryBtn} mt-4 w-full gap-2`}>
            {copied ? (
              <Check size={15} strokeWidth={2} className="text-accent-primary" />
            ) : (
              <Copy size={15} strokeWidth={1.75} />
            )}
            {copied ? c.linkCopied : c.copyLink}
          </button>
          {showRaw && (
            <input
              readOnly
              value={link}
              aria-label={c.linkHeading}
              onFocus={(e) => e.currentTarget.select()}
              className="mt-3 w-full rounded-md border border-border-default bg-surface-base px-3 py-2 font-mono text-[11.5px] text-text-secondary"
            />
          )}
        </div>
      )}

      <p className="font-sans text-[12.5px] leading-[1.6] text-text-muted">
        {c.lostLink}{" "}
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
  );
}

export default OrderSaved;
