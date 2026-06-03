import type { ProjectType } from "./types";

/**
 * Ordered keyword rules — first match wins, so more specific categories
 * (ADU, solar, demolition) are checked before broad ones (alteration, other).
 * Classifies from the permit type + description text; a native ADU flag wins.
 */
const RULES: Array<[RegExp, ProjectType]> = [
  [/\badu\b|accessory dwelling|granny flat|second unit|in-law|ohana|casita/, "adu"],
  [/solar|photovolt|\bpv\b|rooftop pv/, "solar"],
  [/demol|\bdemo\b|raze|tear ?down/, "demolition"],
  [/re-?roof|roofing|\broof\b/, "roofing"],
  [/swimming pool|\bpool\b|\bspa\b|hot tub/, "pool"],
  [/hvac|furnace|air condition|heat pump|\ba\/?c\b|rooftop unit|\brtu\b|boiler/, "hvac"],
  [/sprinkler|fire alarm|fire suppress|\bfire\b/, "fire"],
  [/\bsign\b|signage|billboard|awning/, "sign"],
  [/\bfence\b|retaining wall|\bwall\b/, "fence"],
  [/\bdeck\b|patio|porch|pergola|gazebo/, "deck"],
  [/\bgrad(?:e|ing)\b|excavat|site work|earthwork|drainage/, "grading"],
  [/plumb|sewer|water heater|re-?pipe|gas line|backflow/, "plumbing"],
  [/electric|\bservice upgrade\b|panel upgrade|ev charger|wiring/, "electrical"],
  [/mechanical/, "mechanical"],
  [/new (single|residential|commercial|building|construction|sfd|sfr|duplex|dwelling)|ground ?up|\bnsfr\b|new construction/, "new_construction"],
  [/addition|\badd\b|expand|expansion|new room|second story|2nd story/, "addition"],
  [/alter|remodel|renovat|repair|tenant (improv|finish)|\bt\.?i\.?\b|interior|kitchen|bath(room)?|reconfig|convert/, "alteration"],
];

export interface ClassifyInput {
  permitTypeRaw?: string;
  description?: string;
  isAdu?: boolean;
}

export function classifyProjectType({ permitTypeRaw, description, isAdu }: ClassifyInput): ProjectType {
  if (isAdu) return "adu";
  const text = `${permitTypeRaw ?? ""} ${description ?? ""}`.toLowerCase();
  for (const [re, type] of RULES) {
    if (re.test(text)) return type;
  }
  return "other";
}
