import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import EmotionalBridge from "../EmotionalBridge";
import type { ChildProfile } from "@/lib/order/types";

function makeChild(patch: Partial<ChildProfile> = {}): ChildProfile {
  return { id: "c1", name: "Nodira", age: 7, ...patch };
}

/** Renders EmotionalBridge with real per-child patch state so screens react. */
function Harness({
  onComplete = () => {},
  onBack = () => {},
  children = [makeChild()],
}: {
  onComplete?: () => void;
  onBack?: () => void;
  children?: ChildProfile[];
}) {
  const [kids, setKids] = useState(children);
  return (
    <LanguageProvider>
      <EmotionalBridge
        childrenIn={kids}
        onPatchChild={(id, p) => setKids((ks) => ks.map((k) => (k.id === id ? { ...k, ...p } : k)))}
        onComplete={onComplete}
        onBack={onBack}
      />
    </LanguageProvider>
  );
}

const next = (u: ReturnType<typeof userEvent.setup>) =>
  u.click(screen.getByRole("button", { name: /Davom etish|Continue|Продолжить/ }));

describe("EmotionalBridge — KO'NGIL SO'ZLARI flow", () => {
  it("intro shows the flow name and the non-judgmental opening, then four distinct question screens", async () => {
    const u = userEvent.setup();
    render(<Harness />);

    // eyebrow / flow name (UZ default)
    expect(screen.getByText("KO‘NGIL SO‘ZLARI")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Bolangizga kechinmalaringizni tushuntira olmayapsizmi/ }),
    ).toBeInTheDocument();

    // Step 1 — VAZIYAT
    await next(u);
    expect(
      screen.getByRole("heading", { name: /biz bilishimiz foydali bo‘lgan qanday vaziyat bor/ }),
    ).toBeInTheDocument();

    // Step 2 — parent OBSERVATION of the child's possible experience
    await next(u);
    expect(
      screen.getByRole("heading", { name: /Sizningcha, bu vaziyatda .* nimalarni his qilayotgan bo‘lishi mumkin/ }),
    ).toBeInTheDocument();
    // never asserts certainty about the child's thoughts
    expect(screen.queryByText(/nima deb o‘ylaydi/)).not.toBeInTheDocument();

    // Step 3 — desired emotional direction
    await next(u);
    expect(
      screen.getByRole("heading", { name: /qanday tuyg‘uni ko‘proq his qildirsin/ }),
    ).toBeInTheDocument();

    // Step 4 — sensitivity / boundaries
    await next(u);
    expect(
      screen.getByRole("heading", { name: /nimaga ehtiyotkor yondashishimizni istardingiz/ }),
    ).toBeInTheDocument();

    // done — the full privacy explanation appears once here
    await next(u);
    expect(screen.getByText(/hikoyada ochiq aytilmaydi va kitobga aynan ko‘chirilmaydi/)).toBeInTheDocument();
  });

  it("has NO retired 'one sentence from your heart' step and no direct-quote examples to the child", async () => {
    const u = userEvent.setup();
    render(<Harness />);
    for (let i = 0; i < 6; i++) {
      // walk the whole flow
      expect(screen.queryByText(/yuragingizdan faqat bitta gap/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Seni har kuni sog‘inaman/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Sen bilan faxrlanaman/)).not.toBeInTheDocument();
      const cta = screen.queryByRole("button", { name: /Davom etish|Continue/ });
      if (!cta) break;
      await u.click(cta);
    }
  });

  it("is fully skippable and guilt-free: every step reaches completion without input", async () => {
    const u = userEvent.setup();
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);

    await next(u); // intro -> situation
    await u.click(screen.getByRole("button", { name: "Alohida vaziyat yo‘q" }));
    // experience
    await u.click(screen.getByRole("button", { name: "Bilmayman yoki aniq ayta olmayman" }));
    // feeling (no skip button — Continue with empty textarea)
    await next(u);
    // sensitivity
    await u.click(screen.getByRole("button", { name: "Alohida cheklov yo‘q" }));
    // done
    expect(screen.getByText(/Rahmat\./)).toBeInTheDocument();
    await next(u);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("captures the four separate answers on the child (distance / abroad path)", async () => {
    const u = userEvent.setup();
    const seen: ChildProfile[][] = [];
    function Capture() {
      const [k, setK] = useState<ChildProfile[]>([makeChild({ name: "Fayzbek" })]);
      seen.push(k);
      return (
        <LanguageProvider>
          <EmotionalBridge
            childrenIn={k}
            onPatchChild={(id, p) =>
              setK((ks) => ks.map((c) => (c.id === id ? { ...c, ...p } : c)))
            }
            onComplete={() => {}}
            onBack={() => {}}
          />
        </LanguageProvider>
      );
    }
    render(<Capture />);

    await next(u); // -> situation
    const t1 = screen.getByRole("textbox");
    await u.type(t1, "Men chet elda ishlayman");
    expect(t1).toHaveValue("Men chet elda ishlayman");

    await next(u); // -> experience
    const t2 = screen.getByRole("textbox");
    await u.type(t2, "Menimcha, u meni sog'inadi");
    expect(t2).toHaveValue("Menimcha, u meni sog'inadi");

    await next(u); // -> feeling
    const t3 = screen.getByRole("textbox");
    await u.type(t3, "Mehrim kamaymaganini his qilsin");
    expect(t3).toHaveValue("Mehrim kamaymaganini his qilsin");

    await next(u); // -> sensitivity
    const t4 = screen.getByRole("textbox");
    await u.type(t4, "Uzoqda yashashim dramatik korsatilmasin");
    expect(t4).toHaveValue("Uzoqda yashashim dramatik korsatilmasin");

    await next(u); // -> done

    const eb = seen[seen.length - 1][0].emotionalBridge!;
    // the four answers are captured as four SEPARATE fields
    expect(eb.privateContext).toBe("Men chet elda ishlayman");
    expect(eb.childExperience).toBe("Menimcha, u meni sog'inadi");
    expect(eb.intendedFeeling).toBe("Mehrim kamaymaganini his qilsin");
    expect(eb.sensitivities).toBe("Uzoqda yashashim dramatik korsatilmasin");
    // the retired "one sentence from your heart" field is gone
    expect(eb).not.toHaveProperty("heartMessage");
    expect(eb.done).toBe(true);
  });

  it("Back walks the four steps in reverse without looping", async () => {
    const u = userEvent.setup();
    const onBack = vi.fn();
    render(<Harness onBack={onBack} />);
    await next(u); // situation
    await next(u); // experience
    const backBtn = () => screen.getByRole("button", { name: /Orqaga|Back|Назад/ });
    await u.click(backBtn()); // -> situation
    expect(
      screen.getByRole("heading", { name: /qanday vaziyat bor/ }),
    ).toBeInTheDocument();
    await u.click(backBtn()); // -> intro
    expect(screen.getByRole("heading", { name: /tushuntira olmayapsizmi/ })).toBeInTheDocument();
    await u.click(backBtn()); // -> leaves the section
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
