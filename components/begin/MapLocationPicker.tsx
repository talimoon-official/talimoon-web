/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * Interactive delivery-point picker (Google Maps + Places).
 *
 * The customer searches for a place, drops / drags a pin, and explicitly
 * confirms — the point may be anywhere, not just where they are now. On
 * confirm it returns the SAME normalized `DeliveryLocation` shape that the
 * "current location" button produces, with `source: "map"`.
 *
 * Provider: Google Maps JavaScript API + Places Autocomplete, loaded from a
 * PUBLIC, HTTP-referrer-restricted browser key
 * (`NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`). No server secret is used here.
 * When the key is absent or the script fails to load, the picker shows a
 * short "map unavailable" note and closes cleanly — checkout is never
 * blocked, and the current-location button + written address still work.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { DeliveryLocation } from "@/lib/order/types";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;
// A sensible default view (Tashkent) until the customer searches or drags.
const DEFAULT_CENTER = { lat: 41.311081, lng: 69.279737 };

let mapsLoader: Promise<void> | null = null;

/** Load the Maps JS + Places library once. Rejects if no key or on error. */
function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if ((window as any).google?.maps?.places) return Promise.resolve();
  if (!MAPS_KEY) return Promise.reject(new Error("no maps key"));
  if (mapsLoader) return mapsLoader;

  mapsLoader = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("gmaps-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("maps script error")));
      return;
    }
    const s = document.createElement("script");
    s.id = "gmaps-js";
    s.async = true;
    s.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY!)}` +
      `&libraries=places&language=uz&region=UZ&loading=async`;
    s.onload = () => resolve();
    s.onerror = () => {
      mapsLoader = null;
      reject(new Error("maps script error"));
    };
    document.head.appendChild(s);
  });
  return mapsLoader;
}

export interface MapPickerLabels {
  title: string;
  search: string;
  confirm: string;
  close: string;
  unavailable: string;
}

export function MapLocationPicker({
  initial,
  labels,
  onConfirm,
  onClose,
}: {
  initial: DeliveryLocation | null;
  labels: MapPickerLabels;
  onConfirm: (loc: DeliveryLocation) => void;
  onClose: () => void;
}) {
  const mapEl = useRef<HTMLDivElement | null>(null);
  const searchEl = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [picked, setPicked] = useState<{
    lat: number;
    lng: number;
    formattedAddress?: string;
  } | null>(
    initial
      ? { lat: initial.latitude, lng: initial.longitude, formattedAddress: initial.formattedAddress }
      : null,
  );

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    const g = (window as any).google;
    if (!geocoderRef.current && g?.maps) geocoderRef.current = new g.maps.Geocoder();
    geocoderRef.current?.geocode(
      { location: { lat, lng } },
      (results: any[], gStatus: string) => {
        const formatted =
          gStatus === "OK" && results?.[0]?.formatted_address
            ? String(results[0].formatted_address)
            : undefined;
        setPicked({ lat, lng, formattedAddress: formatted });
      },
    );
  }, []);

  const setPoint = useCallback(
    (lat: number, lng: number, formattedAddress?: string) => {
      markerRef.current?.setPosition({ lat, lng });
      mapRef.current?.panTo({ lat, lng });
      if (formattedAddress) setPicked({ lat, lng, formattedAddress });
      else reverseGeocode(lat, lng);
    },
    [reverseGeocode],
  );

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapEl.current) return;
        const g = (window as any).google;
        const start =
          picked ?? (initial ? { lat: initial.latitude, lng: initial.longitude } : DEFAULT_CENTER);

        const map = new g.maps.Map(mapEl.current, {
          center: start,
          zoom: picked || initial ? 16 : 12,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        });
        mapRef.current = map;

        const marker = new g.maps.Marker({
          map,
          position: start,
          draggable: true,
        });
        markerRef.current = marker;

        marker.addListener("dragend", () => {
          const p = marker.getPosition();
          reverseGeocode(p.lat(), p.lng());
        });
        map.addListener("click", (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          marker.setPosition({ lat, lng });
          reverseGeocode(lat, lng);
        });

        if (searchEl.current && g.maps.places) {
          const ac = new g.maps.places.Autocomplete(searchEl.current, {
            fields: ["geometry", "formatted_address"],
          });
          ac.bindTo("bounds", map);
          ac.addListener("place_changed", () => {
            const place = ac.getPlace();
            if (!place?.geometry?.location) return;
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            map.setZoom(16);
            setPoint(lat, lng, place.formatted_address);
          });
        }

        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={labels.title}
    >
      <div className="flex h-[85vh] w-full max-w-[560px] flex-col overflow-hidden rounded-t-xl bg-surface-base sm:h-[80vh] sm:rounded-xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <span className="font-sans text-[14px] font-semibold text-text-primary">
            {labels.title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="rounded-full p-1 text-text-secondary hover:text-text-primary"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {status === "error" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="font-sans text-[13px] leading-[1.6] text-text-secondary">
              {labels.unavailable}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border-strong px-4 py-2 font-sans text-[13px] font-medium text-text-primary hover:border-accent-primary"
            >
              {labels.close}
            </button>
          </div>
        ) : (
          <>
            <div className="border-b border-border-subtle p-3">
              <input
                ref={searchEl}
                type="text"
                placeholder={labels.search}
                className="w-full rounded-md border border-border-default px-3 py-2 font-sans text-[13px] text-text-primary outline-none focus:border-accent-primary"
              />
            </div>
            <div ref={mapEl} className="min-h-0 flex-1 bg-surface-muted" />
            <div className="flex flex-col gap-2 border-t border-border-subtle p-3">
              <p className="min-h-[18px] font-sans text-[12px] leading-[1.5] text-text-secondary">
                {picked?.formattedAddress ?? ""}
              </p>
              <button
                type="button"
                disabled={!picked || status !== "ready"}
                onClick={() =>
                  picked &&
                  onConfirm({
                    latitude: picked.lat,
                    longitude: picked.lng,
                    source: "map",
                    formattedAddress: picked.formattedAddress,
                    confirmedByCustomer: true,
                  })
                }
                className="rounded-md bg-accent-primary px-4 py-2.5 font-sans text-[13px] font-semibold text-white transition-opacity disabled:opacity-50"
              >
                {labels.confirm}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MapLocationPicker;
