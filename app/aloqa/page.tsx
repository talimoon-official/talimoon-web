"use client";

/**
 * TALIMOON staff — "message the customer" launcher.
 *
 * Opened from the Telegram admin order workflow after an admin action. All
 * data (customer phone, prepared message) arrives in the URL FRAGMENT
 * (`#…`), which browsers never send to a server and no proxy logs. This
 * page renders nothing on the server and stores nothing.
 *
 * It offers the same three choices as the Telegram prompt — SMS, WhatsApp,
 * Telegram — each a plain link that opens the native app pre-filled with
 * the recipient and the (editable) prepared text. It NEVER sends anything:
 * the employee reviews in the app and presses Send by hand.
 */

import { useEffect, useMemo, useState } from "react";

interface Payload {
  v: number;
  action?: string;
  code?: string;
  name?: string;
  phone?: string; // digits only, international
  msg?: string;
  tg?: string; // t.me handle or ""
}

function decode(hash: string): Payload | null {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return null;
  try {
    const json =
      typeof atob === "function"
        ? decodeURIComponent(
            atob(raw.replace(/-/g, "+").replace(/_/g, "/"))
              .split("")
              .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
              .join(""),
          )
        : "";
    const p = JSON.parse(json) as Payload;
    return p && typeof p === "object" ? p : null;
  } catch {
    return null;
  }
}

export default function AloqaPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [msg, setMsg] = useState("");
  const [isIOS, setIsIOS] = useState(false);

  // The payload lives ONLY in the URL fragment, which is unavailable during
  // SSR — so it must be read after mount. This is a genuine external-source
  // read, not derivable state.
  useEffect(() => {
    const p = decode(window.location.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPayload(p);
    setMsg(p?.msg ?? "");
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  const phone = payload?.phone ?? "";
  const enc = useMemo(() => encodeURIComponent(msg), [msg]);

  const smsHref = phone ? `sms:${phone}${isIOS ? "&" : "?"}body=${enc}` : null;
  const waHref = phone ? `https://wa.me/${phone}?text=${enc}` : null;
  const tgHref = payload?.tg ? `https://t.me/${payload.tg.replace(/^@/, "")}` : null;

  return (
    <main
      style={{
        maxWidth: 520,
        margin: "0 auto",
        padding: "24px 18px 40px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#1c2a3a",
      }}
    >
      <h1 style={{ fontSize: 18, margin: "0 0 4px" }}>Mijozga xabar berish</h1>
      {payload?.code ? (
        <p style={{ fontSize: 13, color: "#5b6b7c", margin: "0 0 16px" }}>
          Buyurtma: {payload.code}
        </p>
      ) : null}

      {!payload ? (
        <p style={{ fontSize: 14, color: "#8a94a0" }}>
          Ma&apos;lumot topilmadi. Havolani Telegram xabaridan qayta oching.
        </p>
      ) : (
        <>
          <label
            htmlFor="tm-msg"
            style={{ display: "block", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}
          >
            Tayyor xabar (kerak bo&apos;lsa tahrirlang)
          </label>
          <textarea
            id="tm-msg"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            rows={8}
            style={{
              width: "100%",
              boxSizing: "border-box",
              fontSize: 14,
              lineHeight: 1.5,
              padding: 12,
              border: "1px solid #d5dbe2",
              borderRadius: 8,
              resize: "vertical",
            }}
          />

          <p style={{ fontSize: 12, color: "#8a94a0", margin: "12px 0 8px" }}>
            Havolani tanlang → ilova ochiladi → xabarni tekshiring → &laquo;Yuborish&raquo;ni
            o&apos;zingiz bosing. Bu sahifa hech narsa yubormaydi.
          </p>

          <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
            <ChannelLink href={smsHref} label="📱 SMS orqali ochish" />
            <ChannelLink href={waHref} label="🟢 WhatsApp orqali ochish" />
            <ChannelLink
              href={tgHref}
              label={
                tgHref
                  ? "✈️ Telegram orqali ochish"
                  : "✈️ Telegram — mijoz username kiritmagan"
              }
            />
          </div>

          {phone ? (
            <p style={{ fontSize: 12, color: "#8a94a0", marginTop: 16 }}>
              Raqam: +{phone}
            </p>
          ) : null}
        </>
      )}
    </main>
  );
}

function ChannelLink({ href, label }: { href: string | null; label: string }) {
  const base: React.CSSProperties = {
    display: "block",
    textAlign: "center",
    padding: "12px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    border: "1px solid #d5dbe2",
  };
  if (!href) {
    return (
      <span style={{ ...base, color: "#a7b0ba", background: "#f4f6f8" }} aria-disabled="true">
        {label}
      </span>
    );
  }
  return (
    <a href={href} style={{ ...base, color: "#1c2a3a", background: "#fff" }}>
      {label}
    </a>
  );
}
