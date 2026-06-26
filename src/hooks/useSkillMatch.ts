import { SKILL_MATRIX, type Teammate } from "@/data/mockSetup";

export type MatchLevel = "perfect" | "possible" | "unlikely";

export function getSkillMatch(role: Teammate["role"], stage: string): MatchLevel {
  return SKILL_MATRIX[role]?.[stage] ?? "unlikely";
}

export const MATCH_LABEL: Record<MatchLevel, string> = {
  perfect: "Perfect match",
  possible: "Possible",
  unlikely: "Unlikely",
};

export const MATCH_CLASS: Record<MatchLevel, string> = {
  perfect: "bg-status-done/15 text-status-done border-status-done/30",
  possible: "bg-status-progress/15 text-status-progress border-status-progress/30",
  unlikely: "bg-muted text-muted-foreground border-border",
};
