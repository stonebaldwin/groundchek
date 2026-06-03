"use client";
import { PermitMap, type PermitPin } from "@groundbreak/ui";

const CENTER = { lat: 30.2672, lng: -97.7431 };

const PERMITS: PermitPin[] = [
  { id: "1", lat: 30.2685, lng: -97.744, projectType: "new_construction", label: "New 4-unit building" },
  { id: "2", lat: 30.266, lng: -97.7415, projectType: "adu", label: "Detached ADU" },
  { id: "3", lat: 30.269, lng: -97.742, projectType: "roofing", label: "Reroof" },
  { id: "4", lat: 30.265, lng: -97.745, projectType: "solar", label: "Rooftop solar, 8.2kW" },
  { id: "5", lat: 30.2675, lng: -97.746, projectType: "addition", label: "Second-story addition" },
  { id: "6", lat: 30.264, lng: -97.743, projectType: "demolition", label: "Demolition" },
];

export function MapDemo() {
  return (
    <PermitMap
      center={CENTER}
      marker={{ ...CENTER, label: "1100 E 5th St" }}
      permits={PERMITS}
      height={340}
    />
  );
}
