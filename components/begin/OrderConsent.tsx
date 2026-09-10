'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, FileText, PenLine, X } from 'lucide-react';
import { SignaturePad, SignaturePreview } from './SignaturePad';
import { signatureHasInk } from '@/lib/order/signaturePad';

export type OrderConsentCopy = {
  heading: string; summary: string; details: string; documentTitle: string;
  documentBody: string[]; close: string; accept: string; sign: string;
  signatureTitle: string; signatureHelp: string; clear: string; save: string;
  signed: string; links: string;
};

export function OrderConsent({ copy, accepted, signature, onAccepted, onSignature }:{
  copy: OrderConsentCopy; accepted:boolean; signature:string;
  onAccepted:(v:boolean)=>void; onSignature:(v:string)=>void;
}) {
  const [privacyLabel, termsLabel] = copy.links.split('·').map((value)=>value.trim());
  const [documentOpen,setDocumentOpen]=useState(false);
  const [signatureOpen,setSignatureOpen]=useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const hasSignature = signatureHasInk(signature);

  // Lock body scroll + move focus into the signing dialog while it is open;
  // Escape closes it (the prior confirmed signature is kept — only
  // "Imzoni tasdiqlash" commits a change).
  useEffect(() => {
    if (!signatureOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    headingRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSignatureOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [signatureOpen]);

  return <>
    <section className="rounded-xl border border-accent-primary/35 bg-surface-raised/60 p-5 shadow-sm sm:p-6">
      <div className="flex gap-3"><FileText className="mt-0.5 shrink-0 text-accent-primary" size={21}/><div>
        <h3 className="font-display text-[23px] text-text-primary">{copy.heading}</h3>
        <p className="mt-1 font-sans text-[13.5px] leading-6 text-text-secondary">{copy.summary}</p>
        <button type="button" onClick={()=>setDocumentOpen(true)} className="mt-2 font-sans text-[13px] font-bold text-accent-primary underline underline-offset-4">{copy.details}</button>
      </div></div>
      <label className="mt-5 flex cursor-pointer items-start gap-3 border-t border-border-subtle pt-4 font-sans text-[14px] leading-6 text-text-primary">
        <input type="checkbox" checked={accepted} onChange={e=>{onAccepted(e.target.checked);if(!e.target.checked)onSignature('');}} className="sr-only peer"/>
        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border border-border-strong peer-checked:border-accent-primary peer-checked:bg-accent-primary peer-checked:text-white">{accepted&&<Check size={13}/>}</span>
        {copy.accept}
      </label>
      {accepted&&<div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={()=>setSignatureOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#162338] px-5 font-sans text-[13px] font-bold text-white">
          <PenLine size={16}/>{hasSignature?copy.signed:copy.sign}
        </button>
        {hasSignature&&<span className="inline-flex items-center gap-2 font-sans text-[13px] font-semibold text-accent-primary">
          <Check size={15}/>{copy.save}
          <SignaturePreview payload={signature} className="h-8 w-24 rounded-md border border-border-subtle bg-white" />
        </span>}
      </div>}
    </section>

    {documentOpen&&<div className="fixed inset-0 z-[1200] grid place-items-center bg-[#07101d]/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] bg-[#fbf8f2] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#b8935b]/25 px-5 py-4"><h2 className="font-display text-2xl text-[#162338]">{copy.documentTitle}</h2><button onClick={()=>setDocumentOpen(false)} aria-label={copy.close}><X/></button></header>
        <div className="overflow-y-auto px-6 py-6 font-sans text-[14px] leading-7 text-[#49433c] sm:px-10">{copy.documentBody.map((p,i)=><p key={i} className="mb-5">{p}</p>)}<p className="flex flex-wrap gap-x-5 gap-y-2"><a href="/privacy" target="_blank" className="font-bold text-[#9c7a47] underline">{privacyLabel}</a><a href="/terms" target="_blank" className="font-bold text-[#9c7a47] underline">{termsLabel}</a></p></div>
        <footer className="border-t border-[#b8935b]/25 p-4"><button onClick={()=>setDocumentOpen(false)} className="w-full rounded-full bg-[#162338] py-3 font-sans font-bold text-white">{copy.close}</button></footer>
      </div>
    </div>}

    {signatureOpen&&<div
      className="fixed inset-0 z-[1300] flex flex-col bg-[#07101d]/75 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={copy.signatureTitle}
    >
      <div className="flex h-full w-full flex-col bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:max-w-[780px] sm:rounded-[24px]"
           style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-7">
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl text-[#162338] outline-none">{copy.signatureTitle}</h2>
          <button type="button" onClick={()=>setSignatureOpen(false)} aria-label={copy.close} className="rounded-full p-1 text-[#162338]"><X/></button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-3 sm:px-7 sm:pb-7">
          <SignaturePad
            copy={{ help: copy.signatureHelp, clear: copy.clear, confirm: copy.save, ariaLabel: copy.signatureTitle }}
            initialPayload={signature || undefined}
            onConfirm={(payload)=>{ onSignature(payload); setSignatureOpen(false); }}
            onClear={()=>onSignature('')}
          />
        </div>
      </div>
    </div>}
  </>;
}
