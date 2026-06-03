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

// `hex` darkened across the board so the badge label (rendered in `hex` on the
// light `soft` tint) clears WCAG AA contrast; `soft` backgrounds are unchanged,
// and the matching dot / map marker only reads more clearly when darker on light.
export const PROJECT_TYPE_META: Record<ProjectType, ProjectTypeMeta> = {
  new_construction: { type: "new_construction", label: "New construction", hex: "#1f547f", soft: "#e4eef6" },
  addition: { type: "addition", label: "Addition", hex: "#1f6b67", soft: "#e2f0ef" },
  alteration: { type: "alteration", label: "Alteration / remodel", hex: "#46546b", soft: "#e9ebf1" },
  adu: { type: "adu", label: "ADU", hex: "#5f4885", soft: "#eee7f4" },
  roofing: { type: "roofing", label: "Roofing", hex: "#8f4030", soft: "#f6e3dd" },
  solar: { type: "solar", label: "Solar", hex: "#806208", soft: "#f8f0d4" },
  hvac: { type: "hvac", label: "HVAC", hex: "#226880", soft: "#e1eff5" },
  electrical: { type: "electrical", label: "Electrical", hex: "#80570c", soft: "#f6ecd4" },
  plumbing: { type: "plumbing", label: "Plumbing", hex: "#2d5e94", soft: "#e5edf7" },
  mechanical: { type: "mechanical", label: "Mechanical", hex: "#515e6c", soft: "#ebeef1" },
  demolition: { type: "demolition", label: "Demolition", hex: "#7c3526", soft: "#f3e0da" },
  pool: { type: "pool", label: "Pool / spa", hex: "#1c7880", soft: "#def2f3" },
  deck: { type: "deck", label: "Deck / patio", hex: "#735738", soft: "#f1eadd" },
  fence: { type: "fence", label: "Fence / wall", hex: "#5d6529", soft: "#eef0dd" },
  grading: { type: "grading", label: "Grading / site work", hex: "#685036", soft: "#efe7dc" },
  sign: { type: "sign", label: "Sign", hex: "#6b4080", soft: "#efe6f3" },
  fire: { type: "fire", label: "Fire / sprinkler", hex: "#8f332e", soft: "#f6dedc" },
  other: { type: "other", label: "Other", hex: "#585e66", soft: "#eceef0" },
};

export function projectTypeMeta(type: ProjectType): ProjectTypeMeta {
  return PROJECT_TYPE_META[type];
}

/** The taxonomy in display order — handy for legends and filters. */
export const PROJECT_TYPE_ORDER = Object.keys(PROJECT_TYPE_META) as ProjectType[];
