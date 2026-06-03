/**
 * Presentational project-type model for the design system.
 *
 * Mirrors `@groundbreak/core`'s `ProjectType` union (no import from core — the
 * design system stays independent). There are ~18 categories, so rather than
 * minting a Tailwind color token per type, each carries a `hex` (badge text /
 * map marker) and a precomputed `soft` tint (badge background). Badges and pins
 * apply these via inline style. Hues are chosen to read distinctly on warm paper
 * while staying within the calm, trustworthy palette.
 */
export type ProjectType =
  | "new_construction"
  | "addition"
  | "alteration"
  | "adu"
  | "roofing"
  | "solar"
  | "hvac"
  | "electrical"
  | "plumbing"
  | "mechanical"
  | "demolition"
  | "pool"
  | "deck"
  | "fence"
  | "grading"
  | "sign"
  | "fire"
  | "other";

export interface ProjectTypeMeta {
  type: ProjectType;
  label: string;
  /** Saturated hue — badge text + map marker fill. */
  hex: string;
  /** Light tint — badge background. */
  soft: string;
}

export const PROJECT_TYPE_META: Record<ProjectType, ProjectTypeMeta> = {
  new_construction: { type: "new_construction", label: "New construction", hex: "#2b6ca3", soft: "#e4eef6" },
  addition: { type: "addition", label: "Addition", hex: "#2f8f8a", soft: "#e2f0ef" },
  alteration: { type: "alteration", label: "Alteration / remodel", hex: "#5b6b86", soft: "#e9ebf1" },
  adu: { type: "adu", label: "ADU", hex: "#7a5ea6", soft: "#eee7f4" },
  roofing: { type: "roofing", label: "Roofing", hex: "#b4543e", soft: "#f6e3dd" },
  solar: { type: "solar", label: "Solar", hex: "#caa023", soft: "#f8f0d4" },
  hvac: { type: "hvac", label: "HVAC", hex: "#2f86a6", soft: "#e1eff5" },
  electrical: { type: "electrical", label: "Electrical", hex: "#b07d1d", soft: "#f6ecd4" },
  plumbing: { type: "plumbing", label: "Plumbing", hex: "#3f78b5", soft: "#e5edf7" },
  mechanical: { type: "mechanical", label: "Mechanical", hex: "#6b7b8c", soft: "#ebeef1" },
  demolition: { type: "demolition", label: "Demolition", hex: "#9c4633", soft: "#f3e0da" },
  pool: { type: "pool", label: "Pool / spa", hex: "#2aa1ab", soft: "#def2f3" },
  deck: { type: "deck", label: "Deck / patio", hex: "#9c7b4f", soft: "#f1eadd" },
  fence: { type: "fence", label: "Fence / wall", hex: "#7f8a3f", soft: "#eef0dd" },
  grading: { type: "grading", label: "Grading / site work", hex: "#8a6d4b", soft: "#efe7dc" },
  sign: { type: "sign", label: "Sign", hex: "#8857a0", soft: "#efe6f3" },
  fire: { type: "fire", label: "Fire / sprinkler", hex: "#b8453f", soft: "#f6dedc" },
  other: { type: "other", label: "Other", hex: "#747a83", soft: "#eceef0" },
};

export function projectTypeMeta(type: ProjectType): ProjectTypeMeta {
  return PROJECT_TYPE_META[type];
}

/** The taxonomy in display order — handy for legends and filters. */
export const PROJECT_TYPE_ORDER = Object.keys(PROJECT_TYPE_META) as ProjectType[];
