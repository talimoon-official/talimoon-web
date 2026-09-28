/**
 * Where a per-child conversation (Phase 02 / Phase 03 / the heart section)
 * currently is: which child, which screen. Reported up so the persistent
 * draft can reopen the exact screen after a reload, and validated on the
 * way back in so a stale or foreign position can only fall back to the
 * normal start, never break the phase.
 */

import { useEffect, useRef } from "react";

export interface SubPosition {
  idx: number;
  screen: string;
}

export function startPosition<S extends string>(
  resume: SubPosition | undefined,
  screens: readonly S[],
  childCount: number,
  fallback: { idx: number; screen: S },
): { idx: number; screen: S } {
  if (
    resume &&
    screens.includes(resume.screen as S) &&
    Number.isInteger(resume.idx) &&
    resume.idx >= 0 &&
    resume.idx < childCount
  ) {
    return { idx: resume.idx, screen: resume.screen as S };
  }
  return fallback;
}

/** Calls `onPosition` whenever the child / screen changes (latest callback). */
export function usePositionReport(
  idx: number,
  screen: string,
  onPosition: ((p: SubPosition) => void) | undefined,
) {
  const ref = useRef(onPosition);
  useEffect(() => {
    ref.current = onPosition;
  });
  useEffect(() => {
    ref.current?.({ idx, screen });
  }, [idx, screen]);
}
