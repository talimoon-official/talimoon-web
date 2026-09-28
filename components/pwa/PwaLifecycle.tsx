"use client";

/**
 * Mounted once in the root layout: starts the service-worker lifecycle and
 * the chunk-load / runtime-error watch (lib/pwa/lifecycle.ts), exposes the
 * privacy-safe diagnostics, and reports route changes so a pending app
 * update is applied at a navigation boundary. Renders nothing.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { onRouteChange, startServiceWorker, watchRuntimeErrors } from "@/lib/pwa/lifecycle";
import { exposeDiagnostics, recordDiag } from "@/lib/pwa/diagnostics";

export function PwaLifecycle() {
  const pathname = usePathname();
  const firstPath = useRef<string | null>(null);

  useEffect(() => {
    exposeDiagnostics();
    recordDiag("boot");
    watchRuntimeErrors();
    startServiceWorker();
  }, []);

  useEffect(() => {
    if (firstPath.current === null) {
      firstPath.current = pathname;
      return;
    }
    onRouteChange();
  }, [pathname]);

  return null;
}
