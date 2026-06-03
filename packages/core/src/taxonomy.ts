import type { ProjectType } from "./types";

/**
 * Human labels for the normalized project-type taxonomy. The *classification*
 * that maps a messy source permit-type + description onto these (keyword rules,
 * native flags like SF's ADU boolean) is built in Phase 1.4; this file owns the
 * labels so the UI and reports read consistently.
 */
export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  new_construction: "New construction",
  addition: "Addition",
  alteration: "Alteration / remodel",
  adu: "ADU",
  roofing: "Roofing",
  solar: "Solar",
  hvac: "HVAC",
  electrical: "Electrical",
  plumbing: "Plumbing",
  mechanical: "Mechanical",
  demolition: "Demolition",
  pool: "Pool / spa",
  deck: "Deck / patio",
  fence: "Fence / wall",
  grading: "Grading / site work",
  sign: "Sign",
  fire: "Fire / sprinkler",
  other: "Other",
};

export function projectTypeLabel(type: ProjectType): string {
  return PROJECT_TYPE_LABELS[type];
}
