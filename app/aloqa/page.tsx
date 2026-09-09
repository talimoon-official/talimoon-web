"use client";

/**
 * TALIMOON staff — "message the customer" launcher.
 *
 * Opened from the Telegram admin order workflow after an admin action. All
 * data (customer phone, prepared message, routed channel) arrives in the
 * URL FRAGMENT (`#…`), which browsers never send to a server and no proxy
 * logs. This page renders nothing on the server and stores nothing.
 *
 * The channel is ALREADY decided upstream (talimoon-intake `chooseChannel`
 * from the order's canonical phone): `+998` -> SMS, otherwise WhatsApp.
 * This page shows that ONE channel's "open the app" action plus copy
 * helpers. It NEVER sends anything — the employee opens the app, reviews
 * the (editable) text and presses Send by hand.
 */

import { useEffect, useMemo, useState } from "react";

type Channel = "sms" | "whatsapp";

interface Payload {
  v: number;
  action?: string;
  code?: string;
  name?: string;
  phone?: string; // digits only, international
  msg?: string;
  tg?: string; // t.me handle or ""
  channel?: Channel; // routed upstream; falls back to a phone-based guess
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

/** Same rule as the backend router, for a payload minted before it carried
 *  an explicit `channel`: a 12-digit `998…` number is SMS, anything else
 *  WhatsApp. */
function channelFor(payload: Payload): Channel {
  if (payload.channel === "sms" || payload.channel === "whatsapp") return payload.channel;
  const d = (payload.phone ?? "").replace(/\D/g, "");
  return d.length === 12 && d.startsWith("998") ? "sms" : "whatsapp";
}

export default function AloqaPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState("");
  const [isIOS, setIsIOS] = useState(false);
  const [copied, setCopied] = useState<"phone" | "msg" | null>(null);

  // The payload lives ONLY in the URL fragment, which is unavailable during
  // SSR — so it must be read after mount. This is a genuine external-source
  // read, not derivable state.
  useEffect(() => {
    const p = decode(window.location.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPayload(p);
    setMsg(p?.msg ?? "");
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setReady(true);
  }, []);

  const phone = payload?.phone ?? "";
  const channel = payload ? channelFor(payload) : "whatsapp";
  const enc = useMemo(() => encodeURIComponent(msg), [msg]);

  const smsHref = phone ? `sms:${phone}${isIOS ? "&" : "?"}body=${enc}` : null;
  const waHref = phone ? `https://wa.me/${phone}?text=${enc}` : null;
  const tgHref = payload?.tg ? `https://t.me/${payload.tg.replace(/^@/, "")}` : null;

  const primaryHref = channel === "sms" ? smsHref : waHref;
  const primaryLabel =
    channel === "sms" ? "📱 SMS ilovasida ochish" : "🟢 WhatsApp'da ochish";
  const altHref = channel === "sms" ? waHref : smsHref;
  const altLabel =
    channel === "sms" ? "🟢 WhatsApp'da ochish" : "📱 SMS ilovasida ochish";

  async function copy(what: "phone" | "msg") {
    const text = what === "phone" ? (phone ? `+${phone}` : "") : msg;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      // Clipboard API blocked (insecure context / permissions) — select the
      // textarea so the employee can copy by hand.
      if (what === "msg") {
        const el = document.getElementById("tm-msg") as HTMLTextAreaElement | null;
        el?.focus();
        el?.select();
      }
    }
  }

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

      {!ready ? null : !payload ? (
        <div
          style={{
            fontSize: 14,
            color: "#5b6b7c",
            lineHeight: 1.55,
            border: "1px solid #e2e6ec",
            borderRadius: 10,
            padding: 16,
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#1c2a3a" }}>
            Ma&apos;lumot topilmadi
          </p>
          <p style={{ margin: 0 }}>
            Bu sahifa Telegramdagi buyurtma xabaridagi tugma orqali ochiladi.
            Iltimos, o&apos;sha xabarga qaytib, tegishli tugmani bosing.
          </p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "#5b6b7c", margin: "0 0 12px" }}>
            {channel === "sms"
              ? "Bu mijozga SMS orqali yuboriladi (O‘zbekiston raqami)."
              : "Bu mijozga WhatsApp orqali yuboriladi (xalqaro raqam)."}
          </p>

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
            Tugmani bosing → ilova ochiladi → xabarni tekshiring → &laquo;Yuborish&raquo;ni
            o&apos;zingiz bosing. Bu sahifa hech narsa yubormaydi.
          </p>

          <div style={{ display: "grid", gap: 10, marginTop: 8 }}>
            <ChannelLink href={primaryHref} label={primaryLabel} primary />
            <button type="button" onClick={() => copy("phone")} style={btnStyle(false)}>
              {copied === "phone" ? "✓ Nusxalandi" : "Telefon raqamini nusxalash"}
            </button>
            <button type="button" onClick={() => copy("msg")} style={btnStyle(false)}>
              {copied === "msg" ? "✓ Nusxalandi" : "Xabarni nusxalash"}
            </button>
          </div>

          {/* Desktop / app-not-installed fallback: the other channel and the
              customer's Telegram, if one was ever collected. Never a blank
              or broken state. */}
          <details style={{ marginTop: 18 }}>
            <summary style={{ fontSize: 12.5, color: "#5b6b7c", cursor: "pointer" }}>
              Ilova ochilmadimi? Boshqa usullar
            </summary>
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              <ChannelLink href={altHref} label={altLabel} />
              <ChannelLink
                href={tgHref}
                label={
                  tgHref
                    ? "✈️ Telegram orqali ochish"
                    : "✈️ Telegram — mijoz username kiritmagan"
                }
              />
              <p style={{ fontSize: 12, color: "#8a94a0", margin: "4px 0 0" }}>
                Kompyuterda ilova ochilmasa, yuqoridagi &laquo;nusxalash&raquo; tugmalari
                bilan raqam va xabarni telefoningizga ko&apos;chiring.
              </p>
            </div>
          </details>

          {phone ? (
            <p style={{ fontSize: 12, color: "#8a94a0", marginTop: 16 }}>Raqam: +{phone}</p>
          ) : null}
        </>
      )}
    </main>
  );
}

function btnStyle(primary: boolean): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    textAlign: "center",
    padding: "12px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    border: "1px solid #d5dbe2",
    background: primary ? "#1c2a3a" : "#fff",
    color: primary ? "#fff" : "#1c2a3a",
  };
}

function ChannelLink({
  href,
  label,
  primary = false,
}: {
  href: string | null;
  label: string;
  primary?: boolean;
}) {
  if (!href) {
    return (
      <span
        style={{ ...btnStyle(false), color: "#a7b0ba", background: "#f4f6f8", cursor: "default" }}
        aria-disabled="true"
      >
        {label}
      </span>
    );
  }
  return (
    <a href={href} style={btnStyle(primary)}>
      {label}
    </a>
  );
}
