"use client";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { Map as MlMap, Marker as MlMarker, StyleSpecification } from "maplibre-gl";
import { cn } from "../lib/cn";
import { projectTypeMeta, type ProjectType } from "../lib/project-type";

export interface PermitPin {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  /** Drives the pin color via the categorical project-type palette. */
  projectType?: ProjectType;
}

/** A raster overlay — e.g. a zoning or parcel tile layer (optional). */
export interface TileOverlay {
  tiles: string[];
  tileSize?: number;
  opacity?: number;
  attribution?: string;
}

export interface PermitMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  /** The subject parcel/property marker, in the confident primary color. */
  marker?: { lat: number; lng: number; label?: string };
  /** Nearby permits, color-coded by project type. */
  permits?: PermitPin[];
  overlay?: TileOverlay;
  className?: string;
  height?: number | string;
}

// Key-less OpenStreetMap raster basemap. A vector/branded basemap can swap in later.
const BASEMAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

/**
 * SSR-safe interactive map. MapLibre is loaded dynamically inside an effect, so
 * nothing touches `window` during render and the heavy library never enters the
 * server/Worker bundle. Renders a calm placeholder until the map mounts.
 */
export function PermitMap({
  center,
  zoom = 14,
  marker,
  permits = [],
  overlay,
  className,
  height = 360,
}: PermitMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: MlMap | undefined;
    const markers: MlMarker[] = [];
    let cancelled = false;

    void (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      const el = containerRef.current;
      if (cancelled || !el) return;

      map = new maplibregl.Map({
        container: el,
        style: BASEMAP_STYLE,
        center: [center.lng, center.lat],
        zoom,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (!map) return;
        if (overlay && overlay.tiles.length > 0) {
          map.addSource("overlay", {
            type: "raster",
            tiles: overlay.tiles,
            tileSize: overlay.tileSize ?? 256,
            attribution: overlay.attribution,
          });
          map.addLayer({
            id: "overlay",
            type: "raster",
            source: "overlay",
            paint: { "raster-opacity": overlay.opacity ?? 0.5 },
          });
        }
      });

      const pin = marker ?? { lat: center.lat, lng: center.lng };
      const primary = new maplibregl.Marker({ color: "#1d5a8a" })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map);
      if (pin.label) primary.setPopup(new maplibregl.Popup({ offset: 24 }).setText(pin.label));
      markers.push(primary);

      for (const p of permits) {
        const dot = document.createElement("div");
        const hex = p.projectType ? projectTypeMeta(p.projectType).hex : "#747a83";
        dot.style.cssText = `width:14px;height:14px;border-radius:9999px;background:${hex};border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35);cursor:pointer`;
        const mk = new maplibregl.Marker({ element: dot }).setLngLat([p.lng, p.lat]).addTo(map);
        if (p.label) mk.setPopup(new maplibregl.Popup({ offset: 16 }).setText(p.label));
        markers.push(mk);
      }
    })();

    return () => {
      cancelled = true;
      for (const mk of markers) mk.remove();
      map?.remove();
    };
  }, [
    center.lat,
    center.lng,
    zoom,
    marker?.lat,
    marker?.lng,
    JSON.stringify(permits),
    JSON.stringify(overlay),
  ]);

  return (
    <div
      role="application"
      aria-label={
        marker?.label
          ? `Interactive map of permits near ${marker.label}`
          : "Interactive map of nearby building permits"
      }
      className={cn("relative w-full overflow-hidden bg-surface-sunken", className)}
      style={{ height }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-ink-muted"
      >
        Loading map…
      </div>
      <div ref={containerRef} className="absolute inset-0" />
      {/* Text alternative so the pin data isn't map-only for screen readers. */}
      {permits.length > 0 ? (
        <ul className="sr-only">
          {permits.map((p) => (
            <li key={p.id}>{p.label ?? `${p.projectType ?? "permit"} nearby`}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
