import { useMemo, useState } from "react";
import {
  Inbox, BellRing, CheckCheck, Clapperboard, Palette,
  UserPlus, Eye, Calendar, RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useManagerDeliverables } from "@/hooks/useManagerDeliverables";
import { cn } from "@/lib/utils";
import type { ManagerDeliverableItem } from "@/services/manager-deliverables.service";

type SortKey = "newest" | "deadline" | "status";

function labelize(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function stageStyle(stage: string) {
  switch (stage.toLowerCase()) {
    case "completed":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "review":
    case "awaiting review":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
    case "design":
    case "editing":
    case "planning":
      return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300";
    case "not started":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
  }
}

function fmtDeadline(iso: string | null) {
  if (!iso) return { label: "No deadline", sub: "no deadline", overdue: false };

  const d = new Date(iso);
  const diff = Math.round((d.getTime() - Date.now()) / 86400000);
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diff < 0) return { label, sub: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label, sub: "due today", overdue: false };
  return { label, sub: `${diff}d left`, overdue: false };
}

function projectNeedsAction(deliverable: ManagerDeliverableItem) {
  return deliverable.managerName === "Unassigned" || deliverable.currentStage.toLowerCase() === "review";
}

function dateValue(iso: string | null) {
  return iso ? new Date(iso).getTime() : Number.MAX_SAFE_INTEGER;
}

function DeliverableRow({
  deliverable,
  onReview,
}: {
  deliverable: ManagerDeliverableItem;
  onReview: (id: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const TypeIcon = deliverable.type === "video" ? Clapperboard : Palette;
  const deadline = fmtDeadline(deliverable.deadline);
  const canReview = deliverable.currentStage.toLowerCase() === "review";
  const hasAssignee = deliverable.ownerId !== null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b py-3 last:border-b-0 hover:bg-accent/40 px-2 -mx-2 rounded-md transition-colors">
      <div className="flex min-w-[200px] flex-1 items-center gap-2.5">
        <TypeIcon className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{deliverable.name}</div>
          <div className="text-xs text-muted-foreground">{labelize(deliverable.type)}</div>
        </div>
      </div>

      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", stageStyle(deliverable.currentStage))}>
        {labelize(deliverable.currentStage)}
      </span>

      <div className="flex w-[150px] items-center gap-2">
        <span className={cn("truncate text-sm", !hasAssignee && "text-muted-foreground")}>
          {deliverable.managerName}
        </span>
      </div>

      <div className="w-[96px] text-xs text-muted-foreground">
        {deliverable.progress}% progress
      </div>

      <div className="flex w-[110px] items-center gap-1.5 text-xs" title={deadline.label}>
        <Calendar className="size-3.5 text-muted-foreground" />
        <span className={cn(deadline.overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
          {deadline.sub}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {deliverable.currentStage.toLowerCase() !== "completed" && (
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {hasAssignee ? <RefreshCw className="size-3.5" /> : <UserPlus className="size-3.5" />}
                {hasAssignee ? "Reassign" : "Assign To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3">
              <p className="text-sm font-medium">Assignment</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Assignment actions are preserved visually. Workflow updates will be connected in a later milestone.
              </p>
            </PopoverContent>
          </Popover>
        )}
        <Button
          variant={canReview ? "default" : "outline"}
          size="sm"
          className={cn("h-8", canReview && "bg-amber-600 hover:bg-amber-700")}
          disabled={!canReview}
          onClick={() => onReview(deliverable.id)}
        >
          <Eye className="size-3.5" /> Review
        </Button>
      </div>
    </div>
  );
}

export function ManagerDeliverablesView() {
  const {
    deliverables,
    clients,
    statuses,
    loading,
    error,
  } = useManagerDeliverables();

  const [clientFilter, setClientFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [onlyNeedsAction, setOnlyNeedsAction] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");

  const todoCount = useMemo(
    () => deliverables.filter(projectNeedsAction).length,
    [deliverables],
  );

  const filtered = useMemo(() => {
    let list = deliverables.slice();
    if (clientFilter.length) list = list.filter((deliverable) => clientFilter.includes(deliverable.clientId));
    if (statusFilter !== "all") list = list.filter((deliverable) => deliverable.status === statusFilter);
    if (onlyNeedsAction) list = list.filter(projectNeedsAction);

    list.sort((a, b) => {
      const aa = projectNeedsAction(a) ? 1 : 0;
      const ba = projectNeedsAction(b) ? 1 : 0;
      if (aa !== ba) return ba - aa;
      switch (sort) {
        case "deadline":
          return dateValue(a.deadline) - dateValue(b.deadline);
        case "status":
          return a.currentStage.localeCompare(b.currentStage);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [deliverables, clientFilter, statusFilter, onlyNeedsAction, sort]);

  const grouped = useMemo(
    () => clients
      .map((client) => ({
        client,
        items: filtered.filter((deliverable) => deliverable.clientId === client.id),
      }))
      .filter((group) => group.items.length > 0),
    [clients, filtered],
  );

  const toggleClient = (id: string) =>
    setClientFilter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <AppShell>
      <div className="max-w-5xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Deliverables</h1>
            <p className="text-sm text-muted-foreground">New client work — assign it and review what comes back</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
              todoCount > 0 ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700",
            )}>
              <BellRing className="size-3.5" /> {todoCount} need{todoCount === 1 ? "s" : ""} your action
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2.5">
          <div className="flex items-center gap-1">
            {clients.map((client) => (
              <button
                key={client.id}
                onClick={() => toggleClient(client.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  clientFilter.includes(client.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                {client.name}
              </button>
            ))}
          </div>

          <div className="mx-1 h-5 w-px bg-border" />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>{labelize(status)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
            <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest arrivals</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={onlyNeedsAction ? "default" : "outline"}
            size="sm"
            className={cn("ml-auto h-8", onlyNeedsAction && "bg-amber-600 hover:bg-amber-700")}
            onClick={() => setOnlyNeedsAction((value) => !value)}
          >
            <BellRing className="size-3.5" /> Needs your action
          </Button>
        </div>

        {loading ? (
          <EmptyState icon={<Inbox className="size-10" />} title="Loading deliverables"
            body="Pulling the latest projects from Supabase." />
        ) : error ? (
          <EmptyState icon={<Inbox className="size-10" />} title="Could not load deliverables"
            body={error.message} />
        ) : deliverables.length === 0 ? (
          <EmptyState icon={<Inbox className="size-10" />} title="No deliverables yet"
            body="New client work will appear here when projects are created." />
        ) : grouped.length === 0 ? (
          onlyNeedsAction ? (
            <EmptyState icon={<CheckCheck className="size-10 text-emerald-500" />} title="You're all caught up"
              body="Nothing is waiting on you right now." />
          ) : (
            <EmptyState icon={<Inbox className="size-10" />} title="Nothing matches these filters"
              body="Try clearing a filter to see more deliverables." />
          )
        ) : (
          <div className="space-y-8">
            {grouped.map(({ client, items }) => {
              const videos = items.filter((deliverable) => deliverable.type === "video").length;
              const statics = items.filter((deliverable) => deliverable.type === "static").length;
              const parts = [
                videos > 0 ? `${videos} Video${videos === 1 ? "" : "s"}` : null,
                statics > 0 ? `${statics} Static${statics === 1 ? "" : "s"}` : null,
              ].filter(Boolean).join(", ");
              return (
                <section key={client.id}>
                  <div className="mb-1 flex items-baseline gap-2">
                    <h2 className="text-base font-semibold">
                      {client.name}
                      {parts && <span className="font-normal text-muted-foreground"> — {parts}</span>}
                    </h2>
                  </div>
                  <div>
                    {items.map((deliverable) => (
                      <DeliverableRow
                        key={deliverable.id}
                        deliverable={deliverable}
                        onReview={() => undefined}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
      <div className="mb-3 text-muted-foreground">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
