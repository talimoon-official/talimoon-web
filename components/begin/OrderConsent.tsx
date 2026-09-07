'use client';

import { useRef, useState, type PointerEvent } from 'react';
import { Check, FileText, PenLine, X } from 'lucide-react';

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
  const [documentOpen,setDocumentOpen]=useState(false);
  const [signatureOpen,setSignatureOpen]=useState(false);
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const drawing=useRef(false);
  const points=useRef<Array<[number,number]>>([]);

  const point=(e:PointerEvent<HTMLCanvasElement>)=>{
    const c=canvasRef.current!; const r=c.getBoundingClientRect();
    return [(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height] as [number,number];
  };
  const start=(e:PointerEvent<HTMLCanvasElement>)=>{ drawing.current=true; points.current=[point(e)]; e.currentTarget.setPointerCapture(e.pointerId); };
  const move=(e:PointerEvent<HTMLCanvasElement>)=>{
    if(!drawing.current)return; const c=canvasRef.current!; const p=point(e); const prev=points.current.at(-1)!;
    const ctx=c.getContext('2d')!; ctx.strokeStyle='#162338'; ctx.lineWidth=2.4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(prev[0]*c.width,prev[1]*c.height); ctx.lineTo(p[0]*c.width,p[1]*c.height); ctx.stroke();
    if(points.current.length<420) points.current.push([+p[0].toFixed(3),+p[1].toFixed(3)]);
  };
  const clear=()=>{ const c=canvasRef.current; if(c)c.getContext('2d')?.clearRect(0,0,c.width,c.height); points.current=[]; };
  const save=()=>{ if(points.current.length<8)return; onSignature(JSON.stringify(points.current)); setSignatureOpen(false); };

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
      {accepted&&<button type="button" onClick={()=>setSignatureOpen(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#162338] px-5 font-sans text-[13px] font-bold text-white"><PenLine size={16}/>{signature?copy.signed:copy.sign}</button>}
    </section>

    {documentOpen&&<div className="fixed inset-0 z-[1200] grid place-items-center bg-[#07101d]/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[24px] bg-[#fbf8f2] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#b8935b]/25 px-5 py-4"><h2 className="font-display text-2xl text-[#162338]">{copy.documentTitle}</h2><button onClick={()=>setDocumentOpen(false)} aria-label={copy.close}><X/></button></header>
        <div className="overflow-y-auto px-6 py-6 font-sans text-[14px] leading-7 text-[#49433c] sm:px-10">{copy.documentBody.map((p,i)=><p key={i} className="mb-5">{p}</p>)}<p><a href="/privacy" target="_blank" className="font-bold text-[#9c7a47] underline">{copy.links}</a></p></div>
        <footer className="border-t border-[#b8935b]/25 p-4"><button onClick={()=>setDocumentOpen(false)} className="w-full rounded-full bg-[#162338] py-3 font-sans font-bold text-white">{copy.close}</button></footer>
      </div>
    </div>}
    {signatureOpen&&<div className="fixed inset-0 z-[1300] grid place-items-center bg-[#07101d]/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-[24px] bg-white p-5 shadow-2xl sm:p-7"><div className="flex justify-between"><div><h2 className="font-display text-2xl text-[#162338]">{copy.signatureTitle}</h2><p className="mt-1 text-sm text-[#6d6860]">{copy.signatureHelp}</p></div><button onClick={()=>setSignatureOpen(false)}><X/></button></div>
        <canvas ref={canvasRef} width={900} height={300} onPointerDown={start} onPointerMove={move} onPointerUp={()=>drawing.current=false} className="mt-5 h-44 w-full touch-none rounded-xl border border-[#b8935b]/40 bg-[#fffdf9]"/>
        <div className="mt-4 flex gap-3"><button onClick={clear} className="flex-1 rounded-full border py-3 font-bold">{copy.clear}</button><button onClick={save} className="flex-1 rounded-full bg-[#162338] py-3 font-bold text-white">{copy.save}</button></div>
      </div>
    </div>}
  </>;
}
