import { ArrowLeft, ArrowRight, Flag, RefreshCw } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { StatusPill, MiniBar } from "./Pills";
import { StageTimeline } from "./StageTimeline";
import { clientName, getDeliverable, managerName } from "@/data/mockDeliverables";
import { useDeliverableFilters } from "@/stores/deliverablesFilters";
import { daysLeft, deliverableDelay, fmtDate } from "@/lib/deliverablesMath";

export function DeliverableDetailPage({ id }: { id: string }) {
  const d = getDeliverable(id);
  const { flagged, toggleFlag, notes, setNote } = useDeliverableFilters();

  if (!d) {
    return (
      <AppShell>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Deliverable not found.</p>
          <Link to="/admin/deliverables" className="text-sm text-primary hover:underline">← Back to Deliverables</Link>
        </div>
      </AppShell>
    );
  }

  const left = daysLeft(d.dueDate);
  const totalDelay = deliverableDelay(d);
  const delayedStages = d.timeline.filter((s) => s.delayDays > 0);
  const isFlagged = flagged.includes(d.id);

  return (
    <AppShell>
      <div className="space-y-4">
        <Link to="/admin/deliverables" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Deliverables
        </Link>

        {/* header */}
        <Card className="p-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{d.name}</h1>
                <StatusPill status={d.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                <Link to="/admin/deliverables/clients/$id" params={{ id: d.clientId }} className="hover:underline">{clientName(d.clientId)}</Link>
                {" · "}{d.type} · Manager {managerName(d.managerId)} · {fmtDate(d.startDate)} → {fmtDate(d.dueDate)}
              </p>
            </div>
            <Button variant={isFlagged ? "secondary" : "outline"} size="sm" className="gap-1.5" onClick={() => { toggleFlag(d.id); toast.success(isFlagged ? "Removed from watchlist" : `${d.name} flagged for review — manager notified`); }}>
              <Flag className={cn("size-3.5", isFlagged && "fill-current")} /> {isFlagged ? "On watchlist" : "Flag for review"}
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">Overall progress</div>
              <div className="mt-1 flex items-center gap-2"><MiniBar value={d.progress} width="w-full" /><span className="font-mono text-sm tabular">{d.progress}%</span></div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Deadline</div>
              <div className={cn("mt-1 font-mono text-sm tabular", d.status === "completed" ? "text-muted-foreground" : left >= 0 ? "text-status-done" : "text-status-overdue")}>
                {d.status === "completed" ? "Completed" : left >= 0 ? `${left}d remaining` : `${Math.abs(left)}d late`}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Total delay</div>
              <div className={cn("mt-1 font-mono text-sm tabular", totalDelay > 0 ? "text-status-overdue" : "text-status-done")}>{totalDelay > 0 ? `+${totalDelay}d` : "on estimate"}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground"><RefreshCw className="size-3" /> Review cycles</div>
              <div className={cn("mt-1 font-mono text-sm tabular", d.reviewLoops >= 3 ? "text-status-overdue" : d.reviewLoops === 2 ? "text-status-progress" : "text-foreground")}>{d.reviewLoops} {d.reviewLoops >= 3 && "· high"}</div>
            </div>
          </div>
        </Card>

        {/* high-level timeline */}
        <Card className="p-5">
          <div className="mb-1 font-medium">Stage timeline</div>
          <p className="mb-4 text-xs text-muted-foreground">Read-only overview of stage progression and dates — not a task board.</p>
          <StageTimeline timeline={d.timeline} />
        </Card>

        {/* delay analysis */}
        <Card className="p-5">
          <div className="mb-2 font-medium">Delay analysis</div>
          {delayedStages.length ? (
            <ul className="space-y-1.5 text-sm">
              {delayedStages.map((s) => (
                <li key={s.stage} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-status-overdue" />
                  <span className="font-medium">{s.stage}</span>
                  <span className="text-muted-foreground">ran {s.actualDays}d vs {s.estimateDays}d estimate — </span>
                  <span className="font-medium text-status-overdue">+{s.delayDays}d</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No stage has run over estimate — this deliverable is on track.</p>
          )}
        </Card>

        {/* notes + operational handoff */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-2 font-medium">Strategic notes</div>
            <Textarea value={notes[d.id] ?? ""} onChange={(e) => setNote(d.id, e.target.value)} placeholder="Add a strategic observation…" rows={3} />
            <div className="mt-2 flex justify-end"><Button size="sm" variant="outline" onClick={() => toast.success("Note saved")}>Save note</Button></div>
          </Card>
          <Card className="flex flex-col justify-between p-5">
            <div>
              <div className="mb-1 font-medium">Operational detail</div>
              <p className="text-xs text-muted-foreground">Assigning, moving tasks and editing this deliverable is the manager's job. Hand off to the operational view.</p>
            </div>
            <Link to="/manager/projects" className="mt-3">
              <Button variant="outline" size="sm" className="gap-1.5">View operational detail <ArrowRight className="size-3.5" /></Button>
            </Link>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}