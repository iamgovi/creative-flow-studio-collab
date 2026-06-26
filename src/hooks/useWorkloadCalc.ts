import { useMemo } from "react";
import type { SetupTask, Teammate } from "@/data/mockSetup";

export interface WorkloadInfo {
  base: number; // hours from other projects
  thisProject: number; // hours assigned in this setup
  total: number;
  capacity: number;
  pct: number; // 0..>1
  zone: "green" | "amber" | "red";
}

export function useWorkloadCalc(team: Teammate[], tasks: SetupTask[]) {
  return useMemo(() => {
    const map = new Map<string, WorkloadInfo>();
    for (const tm of team) {
      const thisProject = tasks
        .filter((t) => t.assigneeId === tm.id)
        .reduce((sum, t) => sum + t.hours, 0);
      const total = tm.allocated + thisProject;
      const pct = total / tm.capacity;
      const zone: WorkloadInfo["zone"] = pct >= 0.95 ? "red" : pct >= 0.7 ? "amber" : "green";
      map.set(tm.id, { base: tm.allocated, thisProject, total, capacity: tm.capacity, pct, zone });
    }
    return map;
  }, [team, tasks]);
}

export function countAssignedInProject(tasks: SetupTask[], teammateId: string) {
  return tasks.filter((t) => t.assigneeId === teammateId).length;
}
