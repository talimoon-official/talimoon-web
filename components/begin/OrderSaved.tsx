"use client";

/**
 * TALIMOON — ORDER — the screen after a successful submit.
 * ----------------------------------------------------------------
 * The form is done and the order is SAVED (lifecycle AWAITING_PAYMENT).
 * Payment is a separate stage, so this screen only offers the choice:
 *
 *   "Hozir to‘lash"   → the separate payment page, opened through the
 *                       order-bound resume capability (URL fragment only —
 *                       see lib/payment/link.ts)
 *   "Keyinroq to‘lash" → a calm confirmation that nothing is lost, with the
 *                       customer's PAYMENT CODE and talimoon.com/pay — the way
 *                       back to payment only, never to the form
 *
 * The screen does not stay forever: it counts down AUTO_RETURN_SECONDS (10) seconds
 * and then returns to the order menu (ENTRY_PATH — "Yangi buyurtma" /
 * "Mavjud buyurtma uchun to‘lov"). ANY action on the screen (a button, a
 * link, copying the code) cancels the countdown for good; leaving the screen
 * cancels it through unmount. It pauses while the app is in the background,
 * so a PWA brought back to the front never fires a stale redirect. The order
 * is already saved: returning to the menu creates nothing and resubmits
 * nothing — the payment code and /pay remain the way back to payment.
 *
 * Nothing here says the book is being prepared: production starts only
 * after the payment is confirmed AND an admin starts it.
 *
 * The raw resume token and payment code live only in props (memory). They
 * are never written to storage; the token only leaves memory as the fragment
 * of the payment link.
 */

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { Check, Clock, Copy, Send, ShieldCheck } from "lucide-react";
import type { PaymentCopy } from "@/lib/payment/copy";
import { lifecycleStatusLabel, type PaymentLocale } from "@/lib/payment/status";
import { paymentPath, paymentUrl } from "@/lib/payment/link";
import { CONTACT } from "@/lib/site/social";
import { PaymentCodeCard } from "@/components/payment/PaymentCodeCard";
import { ENTRY_PATH } from "@/lib/order/paths";
import { useFlowBackHandler } from "./FlowBack";

export const PAY_ENTRY_PATH = "/pay";
const PAY_ENTRY_DISPLAY = "talimoon.com/pay";
/** how long the saved screen waits before returning to the order menu */
export const AUTO_RETURN_SECONDS = 10;

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
  /** returns to the order menu (auto-return, "back to menu", system Back);
   *  defaults to `navigate(ENTRY_PATH)` */
  onReturnToMenu?: () => void;
}

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

  // ── the countdown: one timeout at a time, keyed on the remaining seconds;
  //    stops for good on any action, pauses while the page is hidden.
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RETURN_SECONDS);
  const [autoReturn, setAutoReturn] = useState(true);
  const [pageVisible, setPageVisible] = useState(
    () => typeof document === "undefined" || document.visibilityState !== "hidden",
  );
  useEffect(() => {
    const sync = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);
  const counting = autoReturn && mode === "decide" && pageVisible;
  useEffect(() => {
    if (!counting) return;
    if (secondsLeft <= 0) {
      if (!returnedRef.current) {
        returnedRef.current = true;
        returnRef.current();
      }
      return;
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [counting, secondsLeft]);

  /** Any button or link on the screen (Pay now, Pay later, copy code, the
   *  /pay link, Telegram…) means the customer is acting: stop the timer. */
  function cancelOnAction(e: MouseEvent) {
    if ((e.target as Element).closest?.("button, a")) setAutoReturn(false);
  }

  // Focus the title when the screen opens and when it switches to "later".
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [mode]);

  function payNow() {
    // the resume link opens the payment page directly; without one, the
    // payment code on /pay is the way in
    if (resume) go(paymentPath(resume.token));
    else if (paymentCode) go(PAY_ENTRY_PATH);
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
      onClickCapture={cancelOnAction}
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
                <button type="button" onClick={payNow} className={primaryBtn}>
                  {c.payNow}
                </button>
                <button type="button" onClick={() => setMode("later")} className={secondaryBtn}>
                  {c.payLater}
                </button>
              </>
            ) : (
              <p className="font-sans text-[13px] leading-[1.6] text-text-secondary">{c.savedNoLink}</p>
            )}
          </div>
        ) : (
          <PayLaterDetails copy={c} resume={resume} hasCode={paymentCode != null} onPayNow={payNow} />
        )}

        {/* Quiet by design: no progress bar, no live-region announcement per
            tick (screen readers read it when they reach it). Once the timer
            is stopped, the same spot offers the way back to the menu. */}
        <div className="mt-6 flex min-h-[44px] items-center justify-center">
          {autoReturn && mode === "decide" ? (
            <p data-auto-return="" className="font-sans text-[12.5px] leading-[1.6] text-text-muted tabular-nums">
              {c.autoReturn(Math.max(secondsLeft, 1))}
            </p>
          ) : (
            <button
              type="button"
              onClick={leaveToMenu}
              className="inline-flex min-h-[44px] items-center px-2 font-sans text-[13px] font-medium text-text-secondary underline-offset-4 outline-none hover:text-text-primary hover:underline focus-visible:underline"
            >
              {c.returnToMenu}
            </button>
          )}
        </div>
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
