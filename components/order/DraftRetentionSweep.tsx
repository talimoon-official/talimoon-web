"use client";

/**
 * Enforces the order-draft retention on every app start (the text-only
 * draft, 7 days after the last activity) — so an abandoned order leaves the
 * device even if the form is never reopened. Also deletes any media record
 * left by builds that still stored photos / voice.
 *
 * Opens IndexedDB ONLY if our database already exists (never creates an
 * empty one for ordinary visitors). Renders nothing.
 */

import { useEffect } from "react";
import { DB_NAME, sweepExpiredDrafts } from "@/lib/order/formDraft";

export function DraftRetentionSweep() {
  useEffect(() => {
    if (typeof indexedDB === "undefined" || typeof indexedDB.databases !== "function") return;
    indexedDB
      .databases()
      .then((dbs) => {
        if (dbs.some((d) => d.name === DB_NAME)) void sweepExpiredDrafts();
      })
      .catch(() => {});
  }, []);
  return null;
}
