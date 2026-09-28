"use client";

/**
 * Last-resort boundary for errors in the root layout itself. Replaces the
 * whole document, so it renders its own <html>/<body>. Same one-time
 * stale-build recovery as app/error.tsx.
 */

import { AppErrorFallback } from "@/components/pwa/AppErrorFallback";

export default function GlobalError({
  error,
  retry,
  reset,
}: {
  error: Error & { digest?: string };
  retry?: () => void;
  reset?: () => void;
}) {
  return (
    <html lang="uz">
      <body style={{ margin: 0, background: "#101A29", color: "#F7F3EC" }}>
        <AppErrorFallback error={error} reset={retry ?? reset} />
      </body>
    </html>
  );
}
