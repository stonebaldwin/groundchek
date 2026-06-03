/**
 * Presentational activity model for the design system.
 *
 * The string union deliberately mirrors `@groundbreak/core`'s `ActivityLevel` so
 * apps map domain → view with the identity function, while keeping the design
 * system an independent sibling (no import from core). This file owns the
 * *colors and copy*; core owns the *grading logic*. The scale grades
 * neighborhood construction activity — a computed analysis, not an official
 * designation.
 */
export type ActivityLevel = "quiet" | "light" | "moderate" | "active" | "hot";

export interface ActivityMeta {
  level: ActivityLevel;
  label: string;
  /** Short, neutral phrase used in summaries. */
  blurb: string;
  dot: string; // background color utility for a status dot
  text: string; // foreground color utility
  soft: string; // soft background tint utility
  ring: string; // ring color utility
  /** Hex value, for non-Tailwind surfaces (e.g. MapLibre marker elements). */
  hex: string;
}

export const ACTIVITY_META: Record<ActivityLevel, ActivityMeta> = {
  quiet: {
    level: "quiet",
    label: "Quiet",
    blurb: "Little recent permit activity",
    dot: "bg-activity-quiet",
    text: "text-activity-quiet",
    soft: "bg-activity-quiet-soft",
    ring: "ring-activity-quiet",
    hex: "#4f7fa3",
  },
  light: {
    level: "light",
    label: "Light",
    blurb: "Some permits being pulled",
    dot: "bg-activity-light",
    text: "text-activity-light",
    soft: "bg-activity-light-soft",
    ring: "ring-activity-light",
    hex: "#3f8f8a",
  },
  moderate: {
    level: "moderate",
    label: "Moderate",
    blurb: "Steady construction activity",
    dot: "bg-activity-moderate",
    text: "text-activity-moderate",
    soft: "bg-activity-moderate-soft",
    ring: "ring-activity-moderate",
    hex: "#c2912f",
  },
  active: {
    level: "active",
    label: "Active",
    blurb: "Busy — above-average activity",
    dot: "bg-activity-active",
    text: "text-activity-active",
    soft: "bg-activity-active-soft",
    ring: "ring-activity-active",
    hex: "#c4733a",
  },
  hot: {
    level: "hot",
    label: "Hot",
    blurb: "A construction hotspot",
    dot: "bg-activity-hot",
    text: "text-activity-hot",
    soft: "bg-activity-hot-soft",
    ring: "ring-activity-hot",
    hex: "#b14a3e",
  },
};

export function activityMeta(level: ActivityLevel): ActivityMeta {
  return ACTIVITY_META[level];
}
