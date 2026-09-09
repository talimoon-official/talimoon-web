import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EsdalikSection, type EsdalikCopy } from "../EsdalikSection";
import { keepsakeRelationshipOptions } from "@/lib/order/keepsakeRelationship";

const COPY: EsdalikCopy = {
  heading: "Esdalik sahifasi",
  intro: "Farzandingiz uchun kitobda alohida esdalik sahifasi yaratamiz.",
  explain: "Esdalik sizning nomingizdan yoki boshqa yaqin inson nomidan bo‘lishi mumkin.",
  fromWhoQ: "Esdalik kimning nomidan?",
  fromSelf: "O‘zimning nomimdan",
  fromOther: "Boshqa yaqin inson nomidan",
  relationshipQ: "Bolaga kim bo‘ladi?",
  relationshipPlaceholder: "Tanlang…",
  customLabelLabel: "Qarindoshlikni yozing",
  customLabelPlaceholder: "masalan: amakivachchamning farzandi",
  nameLabel: "Ismi",
  namePlaceholder: "Masalan: Sherzodbek",
  voiceQ: "Bu so‘zlarni o‘z ovozida ham saqlab qolishni xohlaysizmi?",
  voiceYes: "Ha, ovozli esdalik qoldiramiz",
  voiceNo: "Yo‘q, faqat matn",
  photoLabel: "Esdalik uchun surat",
  photoNotIllustration:
    "Bu surat illyustratsiyaga aylantirilmaydi. U kitobning esdalik sahifasida asl holatida joylashtiriladi.",
  removePhoto: "Suratni o‘chirish",
  atLeastPhotos: (n) => `Kamida ${n} ta surat kerak`,
  photoTooLarge: "Juda katta",
  photoNotImage: "Rasm tanlang",
  photoBroken: "O‘qib bo‘lmadi",
  relationshipOptions: keepsakeRelationshipOptions("uz"),
};

function Harness(props: {
  presentedAs?: "self" | "other_person";
  keepsakeRelationship?: Parameters<typeof keepsakeRelationshipOptions>[0] extends never
    ? never
    : "" | "father" | "mother" | "other";
  displayName?: string;
  wantsVoice?: boolean | null;
  childNames?: string[];
  onSetWantsVoice?: (v: boolean) => void;
}) {
  const [state, setState] = useState({
    presentedAs: props.presentedAs ?? ("self" as "self" | "other_person"),
    keepsakeRelationship: (props.keepsakeRelationship ?? "") as
      | ""
      | "father"
      | "mother"
      | "other",
    customLabel: "",
    displayName: props.displayName ?? "",
    personalMessage: "",
    wantsVoice: props.wantsVoice ?? null,
  });
  return (
    <EsdalikSection
      copy={COPY}
      locale="uz"
      childNames={props.childNames ?? ["Fayzbek"]}
      presentedAs={state.presentedAs}
      keepsakeRelationship={state.keepsakeRelationship}
      customLabel={state.customLabel}
      displayName={state.displayName}
      personalMessage={state.personalMessage}
      wantsVoice={state.wantsVoice}
      specialPhoto={null}
      onPatch={(patch) =>
        setState((s) => ({
          ...s,
          ...(patch.storyGiverPresentedAs !== undefined
            ? { presentedAs: patch.storyGiverPresentedAs }
            : {}),
          ...(patch.keepsakeRelationship !== undefined
            ? { keepsakeRelationship: patch.keepsakeRelationship as typeof s.keepsakeRelationship }
            : {}),
          ...(patch.storyGiverCustomLabel !== undefined
            ? { customLabel: patch.storyGiverCustomLabel }
            : {}),
          ...(patch.storyGiverDisplayName !== undefined
            ? { displayName: patch.storyGiverDisplayName }
            : {}),
          ...(patch.personalMessage !== undefined
            ? { personalMessage: patch.personalMessage }
            : {}),
        }))
      }
      onSetWantsVoice={(v) => {
        props.onSetWantsVoice?.(v);
        setState((s) => ({ ...s, wantsVoice: v }));
      }}
      onSpecialPhotoChange={() => {}}
      renderVoice={() => <div data-testid="voice-ui">voice recorder</div>}
    />
  );
}

describe("EsdalikSection", () => {
  it("renders the keepsake heading and the correct from-who options", () => {
    render(<Harness />);
    expect(screen.getByText("Esdalik sahifasi")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "O‘zimning nomimdan" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Boshqa yaqin inson nomidan" })).toBeInTheDocument();
    // the retired wording must not appear
    expect(screen.queryByText("Meniki")).not.toBeInTheDocument();
    expect(screen.queryByText("Boshqa insonniki")).not.toBeInTheDocument();
  });

  it("has no legacy 'Bu sovg'a kimdan?' / 'Bola ko'radigan ism' wording", () => {
    render(<Harness />);
    expect(screen.queryByText(/sovg.a kimdan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bola ko.radigan ism/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dada, Buvi, Aziza/i)).not.toBeInTheDocument();
  });

  it("the name field is simply 'Ismi' with a name example placeholder", () => {
    render(<Harness />);
    expect(screen.getByText("Ismi")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Masalan: Sherzodbek")).toBeInTheDocument();
  });

  it("self-author prefill: an explicit buyer name renders in the name field, editable", async () => {
    const user = userEvent.setup();
    render(<Harness presentedAs="self" displayName="Sherzodbek" />);
    const input = screen.getByPlaceholderText("Masalan: Sherzodbek") as HTMLInputElement;
    expect(input.value).toBe("Sherzodbek");
    await user.clear(input);
    await user.type(input, "Sherzodbek Yunusov");
    expect(input.value).toBe("Sherzodbek Yunusov");
  });

  it("relationship 'Boshqa' reveals the custom-label field", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByText("Qarindoshlikni yozing")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox"), "other");
    expect(screen.getByText("Qarindoshlikni yozing")).toBeInTheDocument();
  });

  it("keepsake message textarea carries a meaningful, name-aware example", () => {
    render(<Harness childNames={["Fayzbek"]} />);
    const ta = screen.getByRole("textbox", { name: "" }) as HTMLTextAreaElement | null;
    // the textarea is the only <textarea>; assert via placeholder
    const example = screen.getByPlaceholderText(/Masalan: "Fayzbek,/);
    expect(example).toBeInTheDocument();
    expect(example.getAttribute("placeholder") ?? "").not.toContain("—");
    void ta;
  });

  it("the dynamic photo instruction reflects the selected relationship + author name", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    // before a relationship is chosen -> safe generic line
    expect(
      screen.getByText(/Bola\(lar\) bilan esdalik so.zlari egasi birga tushgan/),
    ).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox"), "father");
    await user.type(screen.getByPlaceholderText("Masalan: Sherzodbek"), "Sherzodbek");
    expect(
      screen.getByText("Fayzbek bilan dadasi Sherzodbek birga tushgan haqiqiy suratni yuklang."),
    ).toBeInTheDocument();
  });

  it("multi-child photo instruction joins the names naturally", async () => {
    const user = userEvent.setup();
    render(<Harness childNames={["Fayzbek", "Madinabonu"]} displayName="Sherzodbek" />);
    await user.selectOptions(screen.getByRole("combobox"), "father");
    expect(
      screen.getByText(
        "Fayzbek va Madinabonu bilan dadasi Sherzodbek birga tushgan haqiqiy suratni yuklang.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the illustration distinction line", () => {
    render(<Harness />);
    expect(
      screen.getByText(/Bu surat illyustratsiyaga aylantirilmaydi/),
    ).toBeInTheDocument();
  });

  it("voice UI is hidden until 'Ha', then shown", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByTestId("voice-ui")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ha, ovozli esdalik qoldiramiz" }));
    expect(screen.getByTestId("voice-ui")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Yo‘q, faqat matn" }));
    expect(screen.queryByTestId("voice-ui")).not.toBeInTheDocument();
  });

  it("choosing 'Yo'q' calls onSetWantsVoice(false) so the parent can drop a stale take", async () => {
    const user = userEvent.setup();
    const onSet = vi.fn();
    render(<Harness onSetWantsVoice={onSet} />);
    await user.click(screen.getByRole("button", { name: "Ha, ovozli esdalik qoldiramiz" }));
    await user.click(screen.getByRole("button", { name: "Yo‘q, faqat matn" }));
    expect(onSet).toHaveBeenCalledWith(true);
    expect(onSet).toHaveBeenLastCalledWith(false);
  });

  it("renders exactly one keepsake photo file input", () => {
    const { container } = render(<Harness />);
    expect(container.querySelectorAll('input[type="file"]')).toHaveLength(1);
  });
});
