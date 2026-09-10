/**
 * §14 / §15 / §16 / §44 — the order-consent signing UI wiring.
 *
 * jsdom has no 2-D canvas, so the drawn ink itself is covered by
 * lib/order/__tests__/signaturePad.test.ts. Here we lock the component
 * contract: the checkbox gates signing, the modal exposes a large signing
 * surface with clear + confirm actions, Confirm is disabled until there is
 * real ink, Clear wipes the parent state, and un-ticking consent drops any
 * signature.
 */

import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderConsent, type OrderConsentCopy } from "../OrderConsent";

const COPY: OrderConsentCopy = {
  heading: "Buyurtma roziligi",
  summary: "Bitta tasdiq va qo‘lda elektron imzo.",
  details: "Batafsil shartnomani o‘qish",
  documentTitle: "TALIMOON buyurtma va maxfiylik shartnomasi",
  documentBody: ["Birinchi banddagi matn.", "Ikkinchi banddagi matn."],
  close: "Tushundim",
  accept: "Shartnomani o‘qidim, tushundim va barcha shartlarga roziman.",
  sign: "Elektron imzo qo‘yish",
  signatureTitle: "Elektron imzo",
  signatureHelp: "Quyidagi maydonga barmoq, sichqoncha yoki stilus yordamida imzo qo‘ying.",
  clear: "Tozalash",
  save: "Imzoni tasdiqlash",
  signed: "Imzo qo‘yildi — o‘zgartirish",
  links: "Maxfiylik siyosati · Foydalanish shartlari",
};

function Harness() {
  const [accepted, setAccepted] = useState(false);
  const [signature, setSignature] = useState("");
  return (
    <>
      <OrderConsent
        copy={COPY}
        accepted={accepted}
        signature={signature}
        onAccepted={setAccepted}
        onSignature={setSignature}
      />
      <output data-testid="sig">{signature || "(empty)"}</output>
    </>
  );
}

describe("OrderConsent", () => {
  it("hides the signing action until the agreement checkbox is ticked (§44)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByRole("button", { name: COPY.sign })).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: COPY.sign })).toBeInTheDocument();
  });

  it("opens a signing dialog with a labelled surface, Clear and Confirm (§14)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: COPY.sign }));

    const dialog = screen.getByRole("dialog", { name: COPY.signatureTitle });
    expect(within(dialog).getByText(COPY.signatureHelp)).toBeInTheDocument();
    expect(within(dialog).getByRole("img", { name: COPY.signatureTitle })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: COPY.clear })).toBeEnabled();
    // no ink yet -> confirmation is blocked (empty-canvas rejection, §15)
    expect(within(dialog).getByRole("button", { name: COPY.save })).toBeDisabled();
  });

  it("Clear resets the parent signature state (§16)", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: COPY.sign }));
    const dialog = screen.getByRole("dialog", { name: COPY.signatureTitle });
    await user.click(within(dialog).getByRole("button", { name: COPY.clear }));
    expect(screen.getByTestId("sig")).toHaveTextContent("(empty)");
  });

  it("un-ticking the agreement discards any signature", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const box = screen.getByRole("checkbox");
    await user.click(box); // on
    await user.click(box); // off -> onSignature('')
    expect(screen.getByTestId("sig")).toHaveTextContent("(empty)");
    expect(screen.queryByRole("button", { name: COPY.sign })).not.toBeInTheDocument();
  });
});
