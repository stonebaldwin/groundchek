import { ACTIVITY_ORDER, type ActivityLevel } from "./types";

/** Rank of an activity level (0 = quiet … 4 = hot). */
export function activityRank(level: ActivityLevel): number {
  return ACTIVITY_ORDER.indexOf(level);
}

/** The highest activity level among a set. Returns "quiet" for an empty set. */
export function maxActivity(levels: ReadonlyArray<ActivityLevel>): ActivityLevel {
  let max = 0;
  for (const level of levels) {
    const rank = ACTIVITY_ORDER.indexOf(level);
    if (rank > max) max = rank;
  }
  return ACTIVITY_ORDER[max]!;
}
