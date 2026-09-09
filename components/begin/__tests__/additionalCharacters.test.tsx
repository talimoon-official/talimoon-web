import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  additionalCharacterComplete,
  additionalCharacterLabel,
  additionalCharacterNamed,
  emptyAdditionalCharacter,
  MIN_CHARACTER_PHOTOS,
  type AdditionalCharacter,
} from "@/lib/order/types";
import {
  AdditionalCharacterCards,
  type AdditionalCharacterCopy,
} from "../AdditionalCharacters";

const COPY: AdditionalCharacterCopy = {
  relationLabel: "Kimligi",
  relationPlaceholder: "Masalan: Otasi",
  nameLabel: "Ismi",
  namePlaceholder: "Masalan: Sherzodbek",
  photosLabel: "Suratlari",
  photoHint: "Ushbu inson hikoyada tasvirlanishi uchun kamida 2 ta aniq va sifatli surat yuklang.",
  addLabel: "+ Qo‘shimcha qahramon qo‘shish",
  removeLabel: "O‘chirish",
  removePhotoLabel: "Suratni o‘chirish",
  atLeastPhotos: (n) => `Kamida ${n} ta surat kerak`,
  photosEnough: (n) => `${n} ta surat — yetarli`,
  photosMoreNeeded: (n) => `Yana ${n} ta rasm yuklang`,
  photoTooLarge: "Juda katta",
  photoNotImage: "Rasm tanlang",
  photoBroken: "O‘qib bo‘lmadi",
};

function char(id: string, relation: string, name: string, photos: File[] = []): AdditionalCharacter {
  return { id, relation, name, photos };
}
function img(n = 1): File {
  return new File(["x".repeat(64)], `p${n}.png`, { type: "image/png" });
}
function cards(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>('[data-testid="additional-character-card"]')];
}

describe("additional-character model helpers", () => {
  it("named / complete gates (min 2 photos per person)", () => {
    expect(additionalCharacterNamed(char("a", "", ""))).toBe(false);
    expect(additionalCharacterNamed(char("a", "Otasi", ""))).toBe(false);
    expect(additionalCharacterNamed(char("a", "Otasi", "Sherzodbek"))).toBe(true);
    expect(additionalCharacterComplete(char("a", "Otasi", "Sherzodbek", [img(1)]))).toBe(false);
    expect(additionalCharacterComplete(char("a", "Otasi", "Sherzodbek", [img(1), img(2)]))).toBe(true);
    expect(MIN_CHARACTER_PHOTOS).toBe(2);
  });

  it("label is relation — name, never the id", () => {
    expect(additionalCharacterLabel(char("char_xyz", " Otasi ", " Sherzodbek "))).toBe(
      "Otasi — Sherzodbek",
    );
  });

  it("emptyAdditionalCharacter: stable non-index id, no photos", () => {
    const a = emptyAdditionalCharacter();
    const b = emptyAdditionalCharacter();
    expect(a.id).toMatch(/^char_/);
    expect(a.id).not.toBe(b.id);
    expect(a.photos).toEqual([]);
  });
});

describe("AdditionalCharacterCards — one card per person (role + name + own photos)", () => {
  it("each card groups Kimligi + Ismi + that person's OWN photo upload (no shared bucket)", () => {
    const { container } = render(
      <AdditionalCharacterCards
        characters={[char("a", "Otasi", "Sherzodbek"), char("b", "Buvisi", "Nilufar")]}
        copy={COPY}
        onPatch={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const list = cards(container);
    expect(list).toHaveLength(2);
    for (const cardEl of list) {
      expect(within(cardEl).getByText("Kimligi")).toBeInTheDocument();
      expect(within(cardEl).getByText("Ismi")).toBeInTheDocument();
      // exactly ONE photo input, inside this person's card
      expect(cardEl.querySelectorAll('input[type="file"]')).toHaveLength(1);
    }
    // no generic photo bucket outside the cards
    const outside = [
      ...container.querySelectorAll('input[type="file"]'),
    ].filter((el) => !el.closest('[data-testid="additional-character-card"]'));
    expect(outside).toHaveLength(0);
  });

  it("multiple people: add button present; each click adds one person", async () => {
    const u = userEvent.setup();
    function Harness() {
      const [list, setList] = useState<AdditionalCharacter[]>([char("a", "", "")]);
      return (
        <AdditionalCharacterCards
          characters={list}
          copy={COPY}
          onPatch={(id, p) => setList((l) => l.map((c) => (c.id === id ? { ...c, ...p } : c)))}
          onAdd={() => setList((l) => [...l, char(`x${l.length}`, "", "")])}
          onRemove={(id) => setList((l) => l.filter((c) => c.id !== id))}
        />
      );
    }
    const { container } = render(<Harness />);
    expect(cards(container)).toHaveLength(1);
    await u.click(screen.getByRole("button", { name: COPY.addLabel }));
    await u.click(screen.getByRole("button", { name: COPY.addLabel }));
    expect(cards(container)).toHaveLength(3);
  });

  it("role and name fields write back to the right person by id", async () => {
    const u = userEvent.setup();
    const onPatch = vi.fn();
    render(
      <AdditionalCharacterCards
        characters={[char("a", "", ""), char("b", "", "")]}
        copy={COPY}
        onPatch={onPatch}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    const inputs = screen.getAllByRole("textbox");
    await u.type(inputs[2]!, "B"); // 2nd card's relation field (0,1 = card a; 2,3 = card b)
    expect(onPatch).toHaveBeenLastCalledWith("b", { relation: "B" });
  });

  it("a photo upload is bound to the person's id, not its list position (reorder-safe)", async () => {
    const u = userEvent.setup();
    const onPatch = vi.fn();
    const a = char("a", "Otasi", "Sherzodbek");
    const b = char("b", "Buvisi", "Nilufar");
    const { container, rerender } = render(
      <AdditionalCharacterCards characters={[a, b]} copy={COPY} onPatch={onPatch} onAdd={vi.fn()} onRemove={vi.fn()} />,
    );
    const fileInput = (i: number) => cards(container)[i]!.querySelector<HTMLInputElement>('input[type="file"]')!;
    await u.upload(fileInput(1), img(9)); // second card = "b"
    expect(onPatch).toHaveBeenCalledWith("b", { photos: [expect.any(File)] });

    onPatch.mockClear();
    rerender(
      <AdditionalCharacterCards characters={[b, a]} copy={COPY} onPatch={onPatch} onAdd={vi.fn()} onRemove={vi.fn()} />,
    );
    await u.upload(fileInput(0), img(10)); // "b" is now first
    expect(onPatch).toHaveBeenCalledWith("b", { photos: [expect.any(File)] });
  });

  it("CASE D/E: removing one person never corrupts another's identity or photos", async () => {
    const u = userEvent.setup();
    function Harness() {
      const [list, setList] = useState<AdditionalCharacter[]>([
        char("a", "Otasi", "Sherzodbek", [img(1), img(2)]),
        char("b", "Buvisi", "Nilufar", [img(3)]),
      ]);
      return (
        <>
          <AdditionalCharacterCards
            characters={list}
            copy={COPY}
            onPatch={(id, p) => setList((l) => l.map((c) => (c.id === id ? { ...c, ...p } : c)))}
            onAdd={vi.fn()}
            onRemove={(id) => setList((l) => l.filter((c) => c.id !== id))}
          />
          <output data-testid="state">{JSON.stringify(list.map((c) => [c.id, c.relation, c.name, c.photos.length]))}</output>
        </>
      );
    }
    const { container } = render(<Harness />);
    // remove the FIRST person
    await u.click(within(cards(container)[0]!).getByRole("button", { name: COPY.removeLabel }));
    expect(screen.getByTestId("state")).toHaveTextContent('[["b","Buvisi","Nilufar",1]]');
    // Nilufar's own photo count is intact, identity unchanged
    expect(within(cards(container)[0]!).getByDisplayValue("Nilufar")).toBeInTheDocument();
  });

  it("CASE E-detail: a person below the minimum shows 'need more', never 'enough'", () => {
    render(
      <AdditionalCharacterCards
        characters={[char("a", "Otasi", "Sherzodbek", [img(1)])]}
        copy={COPY}
        onPatch={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("Yana 1 ta rasm yuklang")).toBeInTheDocument();
    expect(screen.queryByText(/yetarli/)).not.toBeInTheDocument();
  });

  it("photos already held stay with their own person (isolation)", () => {
    render(
      <AdditionalCharacterCards
        characters={[
          char("a", "Otasi", "Sherzodbek", [img(1), img(2)]),
          char("b", "Buvisi", "Nilufar", [img(3)]),
        ]}
        copy={COPY}
        onPatch={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("2 ta surat — yetarli")).toBeInTheDocument();
    expect(screen.getByText("Yana 1 ta rasm yuklang")).toBeInTheDocument();
  });

  it("the illustration-reference hint is shown (NOT the Esdalik 'not an illustration' line)", () => {
    render(
      <AdditionalCharacterCards
        characters={[char("a", "Otasi", "Sherzodbek")]}
        copy={COPY}
        onPatch={vi.fn()}
        onAdd={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText(/hikoyada tasvirlanishi uchun/)).toBeInTheDocument();
    expect(screen.queryByText(/illyustratsiyaga aylantirilmaydi/)).not.toBeInTheDocument();
  });
});
