"use client";

/**
 * Route-level error boundary: a failed screen shows a calm fallback (with a
 * one-time automatic recovery for stale-build chunk failures) instead of
 * Next.js's bare "Application error" page. See components/pwa/AppErrorFallback.
 */

import { AppErrorFallback } from "@/components/pwa/AppErrorFallback";

export default function Error({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  return <AppErrorFallback error={error} reset={retry ?? reset} />;
}
