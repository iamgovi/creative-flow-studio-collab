import { useOpenMember } from "@/hooks/use-current-role";
import { AlertTriangle, ArrowRight, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useAnalytics } from "@/stores/analytics";
import { team } from "@/data/mockSetup";
import { flaggedTasks, workloadWeeks, OVERLOADED_ID, UNDERLOADED_ID } from "@/data/mockAnalytics";
import { balanceIndex, fmtPct, WEEKLY_CAPACITY } from "@/lib/analyticsMath";
import { cn } from "@/lib/utils";

function utilColor(u: number): string {
  if (u > 0.95) return "var(--color-status-overdue)";
  if (u >= 0.7) return "var(--color-status-progress)";
  return "var(--color-status-done)";
}

export function WorkloadTab() {
  const { members } = useAnalytics();
  const openMember = useOpenMember();
  const memberList = members.length ? team.filter((m) => members.includes(m.id)) : team;
  const balance = balanceIndex(members);

  const overloaded = team.find((m) => m.id === OVERLOADED_ID)!;
  const underloaded = team.find((m) => m.id === UNDERLOADED_ID)!;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="mb-1 font-medium">Team workload — upcoming weeks</div>
        <p className="mb-4 text-xs text-muted-foreground">Utilization (allocated ÷ capacity). Green &lt;70%, amber 70–95%, red &gt;95% — spot who's overloaded and who has headroom.</p>
        <div className="overflow-x-auto">
          <table className="border-separate border-spacing-1 text-sm">
            <thead>
              <tr>
                <th className="pr-3 pb-1 text-left text-xs font-normal text-muted-foreground">Member</th>
                {["This week", "Week +1", "Week +2", "Week +3"].map((w) => (
                  <th key={w} className="px-1 pb-1 text-center text-xs font-normal text-muted-foreground">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memberList.map((m) => {
                const wk = workloadWeeks.find((w) => w.memberId === m.id)!;
                return (
                  <tr key={m.id}>
                    <td className="pr-3 py-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6"><AvatarImage src={m.avatar} /><AvatarFallback>{m.name[0]}</AvatarFallback></Avatar>
                        <span className="max-w-[120px] truncate text-sm">{m.name}</span>
                      </div>
                    </td>
                    {wk.weeks.map((u, i) => (
                      <td key={i} className="p-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="flex h-9 min-w-[72px] items-center justify-center rounded font-mono text-xs"
                              style={{ background: `color-mix(in oklab, ${utilColor(u)} ${Math.min(85, u * 70)}%, var(--color-card))` }}
                            >
                              {Math.round(u * 100)}%
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">{m.name}: {Math.round(u * WEEKLY_CAPACITY)}h / {WEEKLY_CAPACITY}h</TooltipContent>
                        </Tooltip>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 font-medium">Capacity balance</div>
          <div className="space-y-3">
            {memberList.map((m) => {
              const pct = (m.allocated / WEEKLY_CAPACITY) * 100;
              const over = m.allocated > WEEKLY_CAPACITY;
              return (
                <div key={m.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate">{m.name}</span>
                    <span className={cn("font-mono", over ? "text-status-overdue" : "text-muted-foreground")}>{m.allocated}h / {WEEKLY_CAPACITY}h</span>
                  </div>
                  <div className="relative h-2.5 rounded-full bg-muted">
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: over ? "var(--color-status-overdue)" : "var(--color-primary)" }} />
                    {over && <div className="absolute inset-y-0 rounded-r-full bg-status-overdue/50" style={{ left: "100%", width: `${pct - 100}%` }} />}
                    <div className="absolute inset-y-0 w-px bg-foreground/40" style={{ left: "100%" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/40 p-3">
            <div>
              <div className="text-xs text-muted-foreground">Balance index</div>
              <div className="font-mono text-xl font-semibold">{balance.index}/100</div>
            </div>
            {balance.overloaded.length > 0 && (
              <div className="text-right text-xs text-status-progress">
                {balance.overloaded.length} member{balance.overloaded.length > 1 ? "s" : ""} &gt; 1.2× median load
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2 font-medium"><AlertTriangle className="size-4 text-status-overdue" /> Overdue & at-risk</div>
            <ul className="space-y-2">
              {flaggedTasks.map((t) => {
                const m = team.find((x) => x.id === t.memberId)!;
                return (
                  <li key={t.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{t.title}</span>
                      <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium", t.kind === "overdue" ? "bg-status-overdue/15 text-status-overdue" : "bg-status-progress/15 text-status-progress")}>
                        {t.kind === "overdue" ? "Overdue" : "At risk"}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" /> {m.name} · {t.project} · {t.detail}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" className="h-7" onClick={() => toast.success(`Reassigning "${t.title}"`)}>Reassign</Button>
                      <Button size="sm" variant="ghost" className="h-7" onClick={() => toast.success(`Extended deadline for "${t.title}"`)}>Extend</Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      <Card className="p-5">
        <div className="mb-3 font-medium">Rebalancing suggestions</div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-status-progress/40 bg-status-progress/5 p-3">
            <div className="flex items-center gap-2">
              <Avatar className="size-9"><AvatarImage src={overloaded.avatar} /><AvatarFallback>{overloaded.name[0]}</AvatarFallback></Avatar>
              <ArrowRight className="size-4 text-muted-foreground" />
              <Avatar className="size-9"><AvatarImage src={underloaded.avatar} /><AvatarFallback>{underloaded.name[0]}</AvatarFallback></Avatar>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm">{overloaded.name} is at {fmtPct((overloaded.allocated / WEEKLY_CAPACITY) * 100)} capacity while {underloaded.name} is at {fmtPct((underloaded.allocated / WEEKLY_CAPACITY) * 100)} — consider moving a task across.</p>
              <p className="text-xs text-muted-foreground">Skill match: good ({underloaded.role})</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => toast.success("Rebalance suggested")}>Apply</Button>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="mt-3" onClick={() => openMember(overloaded.id)}>
          View {overloaded.name}'s profile
        </Button>
      </Card>
    </div>
  );
}