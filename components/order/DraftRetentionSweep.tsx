"use client";

/**
 * Enforces the order-draft retention windows on every app start (answers 7
 * days, photos + voice 48 hours after the last activity) — so the files of
 * an abandoned order leave the device even if the form is never reopened.
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
