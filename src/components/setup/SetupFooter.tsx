import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SetupTask, Teammate } from "@/data/mockSetup";
import type { WorkloadInfo } from "@/hooks/useWorkloadCalc";
import { TeamStrip } from "./TeamStrip";

export function SetupFooter({
  tasks,
  team,
  workload,
  projectDeadline,
  onSaveDraft,
  onLaunch,
}: {
  tasks: SetupTask[];
  team: Teammate[];
  workload: Map<string, WorkloadInfo>;
  projectDeadline: Date;
  onSaveDraft: () => void;
  onLaunch: () => void;
}) {
  const assigned = tasks.filter((t) => t.assigneeId).length;
  const involved = new Set(tasks.map((t) => t.assigneeId).filter(Boolean)).size;
  const allocated = tasks.reduce((sum, t) => sum + t.hours, 0);

  const issues: string[] = [];
  const unassigned = tasks.length - assigned;
  if (unassigned > 0) issues.push(`${unassigned} task${unassigned > 1 ? "s" : ""} unassigned`);
  const badDeadlines = tasks.filter((t) => new Date(t.deadline) > projectDeadline).length;
  if (badDeadlines > 0) issues.push(`${badDeadlines} task${badDeadlines > 1 ? "s" : ""} past project deadline`);
  if (tasks.length === 0) issues.push("No tasks");

  const canLaunch = issues.length === 0;

  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 -mx-4 md:-mx-6 mt-4 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="px-4 md:px-6 py-3 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <TeamStrip team={team} tasks={tasks} workload={workload} />
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-xs text-muted-foreground text-right hidden md:block">
            <span className="tabular">
              <span className="text-foreground font-medium">{assigned}/{tasks.length}</span> assigned ·{" "}
              <span className="text-foreground font-medium">{involved}</span> teammates ·{" "}
              <span className="text-foreground font-medium">{allocated}h</span> allocated
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={onSaveDraft}>
            Save as Draft
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="lg"
                    onClick={onLaunch}
                    disabled={!canLaunch}
                  >
                    Launch Project
                  </Button>
                </span>
              </TooltipTrigger>
              {!canLaunch && (
                <TooltipContent side="top">
                  <div className="text-xs">
                    {issues.map((i) => (
                      <div key={i}>• {i}</div>
                    ))}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
