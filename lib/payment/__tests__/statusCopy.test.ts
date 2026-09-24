import { describe, it, expect } from "vitest";
import {
  LIFECYCLE_STATUSES,
  LIFECYCLE_STATUS_COPY,
  lifecycleStatusLabel,
  productionStarted,
} from "../status";
import { PAYMENT_COPY } from "../copy";

describe("lifecycle status copy", () => {
  it("uses the canonical Uzbek mapping", () => {
    expect(LIFECYCLE_STATUS_COPY.uz).toEqual({
      DRAFT: "Ma’lumotlar saqlanmoqda",
      AWAITING_PAYMENT: "To‘lov kutilmoqda",
      PAYMENT_SUBMITTED: "To‘lov tekshirilmoqda",
      PAID: "To‘lov tasdiqlandi",
      IN_PRODUCTION: "Tayyorlanmoqda",
      READY: "Buyurtma tayyor",
      DELIVERED: "Yetkazildi",
      CANCELLED: "Buyurtma bekor qilindi",
    });
  });

  it("every status has a distinct label in every locale", () => {
    for (const locale of ["uz", "en", "ru"] as const) {
      const labels = LIFECYCLE_STATUSES.map((s) => lifecycleStatusLabel(s, locale));
      expect(new Set(labels).size).toBe(LIFECYCLE_STATUSES.length);
    }
  });

  it("PAID and IN_PRODUCTION are never merged", () => {
    for (const locale of ["uz", "en", "ru"] as const) {
      expect(lifecycleStatusLabel("PAID", locale)).not.toBe(lifecycleStatusLabel("IN_PRODUCTION", locale));
    }
    expect(productionStarted("PAID")).toBe(false);
    expect(productionStarted("IN_PRODUCTION")).toBe(true);
  });
});

/** Phrases that claim production has started — forbidden before IN_PRODUCTION. */
const PRODUCTION_CLAIMS = [
  /tayyorlanmoqda/i,
  /ishlab chiqarish boshlandi/i,
  /7[–-]10 kun/i,
  /5[–-]7 kun/i,
  /being prepared/i,
  /in production/i,
  /готовится/i,
];

describe("post-submit customer copy never claims production", () => {
  for (const locale of ["uz", "en", "ru"] as const) {
    it(`${locale}: no saved / pay-later / payment string says the order is being prepared`, () => {
      const c = PAYMENT_COPY[locale];
      const strings: string[] = Object.values(c).flatMap((v) =>
        typeof v === "function" ? [(v as (x: string) => string | string[])("X")].flat() : [v],
      );
      expect(strings.length).toBeGreaterThan(30);
      for (const s of strings) {
        for (const re of PRODUCTION_CLAIMS) expect(s).not.toMatch(re);
      }
    });
  }

  it("carries the approved Uzbek wording", () => {
    const c = PAYMENT_COPY.uz;
    expect(c.savedTitle).toBe("Buyurtmangiz saqlandi");
    expect(c.savedBody).toBe(
      "Ma’lumotlaringiz va buyurtma raqamingiz saqlandi. Formani qayta to‘ldirishingiz shart emas.",
    );
    expect(c.productionNotice).toBe(
      "Buyurtmangizni tayyorlash jarayoni to‘lov tasdiqlangandan keyin boshlanadi.",
    );
    expect(c.payNow).toBe("Hozir to‘lash");
    expect(c.payLater).toBe("Keyinroq to‘lash");
    expect(c.laterTitle).toBe("To‘lov kutilmoqda");
    expect(c.laterBody).toBe("Buyurtmangiz saqlangan. Uni qayta to‘ldirishingiz shart emas.");
    expect(c.laterNotice).toBe("Tayyorlash jarayoni to‘lov tasdiqlangandan keyin boshlanadi.");
    expect(c.submittedTitle).toBe("To‘lov tekshirilmoqda");
    expect(c.submittedBody).toBe(
      "To‘lov ma’lumotingiz qabul qilindi. Tasdiqlangach, buyurtmangiz keyingi bosqichga o‘tadi.",
    );
  });
});
