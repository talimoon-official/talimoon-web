"use client";

// "Qo‘shimcha qahramonlar" — real people the customer wants to APPEAR
// INSIDE the personalized story alongside the child(ren). Lives in the
// same photo stage as "Farzandingiz suratlari", directly after it — NOT
// in the Esdalik keepsake section.
//
// Each person is ONE self-contained card: Kimligi (role) + Ismi (name) +
// that person's OWN reference photos, so it is always unambiguous which
// photos belong to whom. The card list derives entirely from
// `characters`, each bound to its stable `id`, so a reorder or a removal
// earlier in the list never reattributes a photo to a different person.
//
// Copy is passed in (no LanguageContext) so the component stays trivially
// testable.

import { Plus, X } from "lucide-react";
import {
  MAX_ADDITIONAL_CHARACTERS,
  MAX_CHARACTER_PHOTOS,
  MIN_CHARACTER_PHOTOS,
  type AdditionalCharacter,
} from "@/lib/order/types";
import { Field, PhotoUpload, TextInput } from "./formPrimitives";
import { PhotoGuideReminder } from "./PhotoGuide";

export interface AdditionalCharacterCopy {
  relationLabel: string;
  relationPlaceholder: string;
  nameLabel: string;
  namePlaceholder: string;
  /** label above each card's own photo upload — e.g. "Suratlari". */
  photosLabel: string;
  /** why photos are needed + the minimum count, in one short line. */
  photoHint: string;
  addLabel: string;
  removeLabel: string;
  removePhotoLabel: string;
  atLeastPhotos: (min: number) => string;
  photosEnough: (n: number) => string;
  photosMoreNeeded: (n: number) => string;
  photoTooLarge: string;
  photoNotImage: string;
  photoBroken: string;
  /** One-line photo reminder shown once per card — never the full guide. */
  compactGuide: string;
  /** Alt text for the small guide thumbnail in that reminder. */
  compactGuideThumbAlt: string;
}

/**
 * The repeatable "Kimligi / Ismi / Suratlari" card list. One card per
 * person; role, name and that person's photos are grouped together.
 */
export function AdditionalCharacterCards({
  characters,
  copy,
  onPatch,
  onAdd,
  onRemove,
}: {
  characters: AdditionalCharacter[];
  copy: AdditionalCharacterCopy;
  onPatch: (id: string, patch: Partial<AdditionalCharacter>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-4" data-testid="additional-character-cards">
      {characters.map((c, i) => (
        <div
          key={c.id}
          data-testid="additional-character-card"
          className="space-y-3.5 rounded-md border border-border-subtle p-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
              {i + 1}
            </span>
            <button
              type="button"
              onClick={() => onRemove(c.id)}
              className="inline-flex min-h-[32px] items-center gap-1 font-sans text-[12.5px] font-medium text-text-secondary underline underline-offset-4 hover:text-text-primary"
            >
              <X size={13} strokeWidth={2} />
              {copy.removeLabel}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={copy.relationLabel}>
              <TextInput
                value={c.relation}
                onChange={(e) => onPatch(c.id, { relation: e.target.value })}
                placeholder={copy.relationPlaceholder}
              />
            </Field>
            <Field label={copy.nameLabel}>
              <TextInput
                value={c.name}
                onChange={(e) => onPatch(c.id, { name: e.target.value })}
                placeholder={copy.namePlaceholder}
              />
            </Field>
          </div>

          {/* This person's own reference photos — inside their card, never
              a shared bucket below all characters. The compact reminder
              (not the full guide plate) keeps a multi-character form from
              repeating the same large image over and over. */}
          <PhotoGuideReminder text={copy.compactGuide} thumbAlt={copy.compactGuideThumbAlt} />
          <PhotoUpload
            label={copy.photosLabel}
            hint={copy.photoHint}
            removeLabel={copy.removePhotoLabel}
            atLeastLabel={copy.atLeastPhotos}
            enoughLabel={copy.photosEnough}
            moreNeededLabel={copy.photosMoreNeeded}
            tooLargeLabel={copy.photoTooLarge}
            notImageLabel={copy.photoNotImage}
            brokenLabel={copy.photoBroken}
            files={c.photos}
            min={MIN_CHARACTER_PHOTOS}
            max={MAX_CHARACTER_PHOTOS}
            onChange={(files) => onPatch(c.id, { photos: files })}
          />
        </div>
      ))}

      {characters.length < MAX_ADDITIONAL_CHARACTERS && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-dashed border-border-strong px-4 py-2.5 font-sans text-[13px] font-medium text-text-primary transition-colors hover:border-solid hover:border-accent-primary"
        >
          <Plus size={15} strokeWidth={1.75} className="text-accent-primary" />
          {copy.addLabel}
        </button>
      )}
    </div>
  );
}
