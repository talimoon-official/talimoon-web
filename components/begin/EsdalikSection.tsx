"use client";

/**
 * "Esdalik sahifasi" — the keepsake page section of the order form
 * (on the "a personal touch" step). One calm, top-to-bottom flow:
 *
 *   who the keepsake is from  ->  their exact relationship to the child
 *   ->  their name  ->  the keepsake words  ->  voice yes/no  ->  the REAL
 *   keepsake photo.
 *
 * Copy is passed in (like AdditionalCharacters) so this component never
 * touches LanguageContext and stays trivially testable. The locale-aware
 * dynamic sentences (photo instruction, message heading/helper/example)
 * come from `lib/order/keepsakePhrase.ts`. The voice recorder is injected
 * via `renderVoice` so this file has no dependency on VoiceMemory.
 */

import { Field, PhotoUpload, TextArea, TextInput, inputClass } from "./formPrimitives";
import type { KeepsakeRelationship } from "@/lib/order/keepsakeRelationship";
import {
  buildKeepsakePhotoInstruction,
  keepsakeMessageExample,
  keepsakeWordsHeading,
  keepsakeWordsHelper,
  type KeepsakeLocale,
} from "@/lib/order/keepsakePhrase";

export interface EsdalikCopy {
  heading: string;
  intro: string;
  explain: string;
  fromWhoQ: string;
  fromSelf: string;
  fromOther: string;
  relationshipQ: string;
  relationshipPlaceholder: string;
  customLabelLabel: string;
  customLabelPlaceholder: string;
  /** "Ismi" — no "the name the child will see" wording, no nickname hint. */
  nameLabel: string;
  namePlaceholder: string;
  voiceQ: string;
  voiceYes: string;
  voiceNo: string;
  photoLabel: string;
  photoNotIllustration: string;
  // PhotoUpload strings
  removePhoto: string;
  atLeastPhotos: (n: number) => string;
  photoTooLarge: string;
  photoNotImage: string;
  photoBroken: string;
  /** relationship selector options, already localised, canonical order */
  relationshipOptions: { code: KeepsakeRelationship; label: string }[];
}

export interface EsdalikSectionProps {
  copy: EsdalikCopy;
  locale: KeepsakeLocale;
  /** trimmed, non-empty child first names, in order */
  childNames: string[];
  presentedAs: "self" | "other_person";
  keepsakeRelationship: KeepsakeRelationship | "";
  customLabel: string;
  displayName: string;
  personalMessage: string;
  wantsVoice: boolean | null;
  specialPhoto: File | null;
  onPatch: (patch: {
    storyGiverPresentedAs?: "self" | "other_person";
    keepsakeRelationship?: KeepsakeRelationship | "";
    storyGiverCustomLabel?: string;
    storyGiverDisplayName?: string;
    personalMessage?: string;
  }) => void;
  onSetWantsVoice: (v: boolean) => void;
  onSpecialPhotoChange: (file: File | null) => void;
  /** rendered only when wantsVoice === true */
  renderVoice: () => React.ReactNode;
}

const choiceBtn = (active: boolean) =>
  `rounded-md border px-3 py-1.5 text-[13px] transition-colors ${
    active
      ? "border-accent-primary bg-accent-primary/10 text-text-primary"
      : "border-black/15 text-text-secondary"
  }`;

export function EsdalikSection({
  copy,
  locale,
  childNames,
  presentedAs,
  keepsakeRelationship,
  customLabel,
  displayName,
  personalMessage,
  wantsVoice,
  specialPhoto,
  onPatch,
  onSetWantsVoice,
  onSpecialPhotoChange,
  renderVoice,
}: EsdalikSectionProps) {
  const photoInstruction = buildKeepsakePhotoInstruction({
    childNames,
    relationship: keepsakeRelationship,
    customLabel,
    authorName: displayName,
    locale,
  });

  return (
    <div className="rounded-lg border border-black/10 bg-white/50 px-4 py-3.5 space-y-3.5">
      <div className="space-y-1">
        <p className="font-sans text-[13px] font-semibold text-text-primary">{copy.heading}</p>
        <p className="font-sans text-[12px] leading-[1.5] text-text-secondary">{copy.intro}</p>
        <p className="font-sans text-[12px] leading-[1.5] text-text-secondary">{copy.explain}</p>
      </div>

      {/* 1 — Esdalik kimning nomidan? */}
      <div className="space-y-1.5">
        <p className="font-sans text-[13px] font-medium text-text-primary">{copy.fromWhoQ}</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["self", copy.fromSelf],
              ["other_person", copy.fromOther],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => onPatch({ storyGiverPresentedAs: val })}
              className={choiceBtn(presentedAs === val)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 2 — Bolaga kim bo'ladi? Always asked; never inferred. */}
      <Field label={copy.relationshipQ}>
        <select
          className={inputClass}
          value={keepsakeRelationship}
          onChange={(e) =>
            onPatch({ keepsakeRelationship: e.target.value as KeepsakeRelationship | "" })
          }
        >
          <option value="" disabled>
            {copy.relationshipPlaceholder}
          </option>
          {copy.relationshipOptions.map((o) => (
            <option key={o.code} value={o.code}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      {keepsakeRelationship === "other" && (
        <Field label={copy.customLabelLabel}>
          <TextInput
            value={customLabel}
            placeholder={copy.customLabelPlaceholder}
            onChange={(e) => onPatch({ storyGiverCustomLabel: e.target.value })}
          />
        </Field>
      )}

      {/* 3 — Ismi */}
      <Field label={copy.nameLabel}>
        <TextInput
          value={displayName}
          placeholder={copy.namePlaceholder}
          onChange={(e) => onPatch({ storyGiverDisplayName: e.target.value })}
        />
      </Field>

      {/* 4 — {childNames} uchun maxsus esdalik so'zlari */}
      <div className="space-y-1.5">
        <p className="font-sans text-[13px] font-medium leading-[1.5] text-text-primary">
          {keepsakeWordsHeading(childNames, locale)}
        </p>
        <p className="font-sans text-[12px] leading-[1.5] text-text-secondary">
          {keepsakeWordsHelper(childNames, locale)}
        </p>
        <TextArea
          rows={4}
          value={personalMessage}
          onChange={(e) => onPatch({ personalMessage: e.target.value })}
          placeholder={keepsakeMessageExample(childNames, locale)}
        />
      </div>

      {/* 5 — Ovozli esdalik? Only "Ha" reveals the recorder. */}
      <div className="space-y-1.5">
        <p className="font-sans text-[13px] font-medium leading-[1.5] text-text-primary">
          {copy.voiceQ}
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              [true, copy.voiceYes],
              [false, copy.voiceNo],
            ] as const
          ).map(([val, label]) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => onSetWantsVoice(val)}
              className={choiceBtn(wantsVoice === val)}
            >
              {label}
            </button>
          ))}
        </div>
        {wantsVoice === true && <div className="pt-1">{renderVoice()}</div>}
      </div>

      {/* 6 — Esdalik uchun surat */}
      <div className="space-y-1.5">
        <PhotoUpload
          label={copy.photoLabel}
          hint={photoInstruction}
          removeLabel={copy.removePhoto}
          atLeastLabel={copy.atLeastPhotos}
          tooLargeLabel={copy.photoTooLarge}
          notImageLabel={copy.photoNotImage}
          brokenLabel={copy.photoBroken}
          files={specialPhoto ? [specialPhoto] : []}
          max={1}
          onChange={(files) => onSpecialPhotoChange(files[0] ?? null)}
        />
        <p className="font-sans text-[12px] leading-[1.5] text-text-secondary">
          {copy.photoNotIllustration}
        </p>
      </div>
    </div>
  );
}

export default EsdalikSection;
