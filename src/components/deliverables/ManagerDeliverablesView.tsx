import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Inbox, BellRing, CheckCheck, Sparkles, Clapperboard, Palette,
  UserPlus, Eye, Calendar, RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { AssigneePicker } from "./AssigneePicker";
import { ReviewPanel } from "./ReviewPanel";
import {
  clients, memberById, type Deliverable, type TeamMember,
} from "@/data/mockDeliverablesRelay";
import {
  useRelayStore, needsAction, totalActionCount, STATUS_LABEL,
  type DeliverableStatus,
} from "@/hooks/useRelayWorkflow";

type SortKey = "newest" | "deadline" | "status";

const STATUS_STYLE: Record<DeliverableStatus, string> = {
  unassigned: "bg-muted text-muted-foreground",
  in_progress: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  awaiting_review: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

function fmtDeadline(iso: string) {
  const d = new Date(iso);
  const diff = Math.round((d.getTime() - Date.now()) / 86400000);
  const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diff < 0) return { label, sub: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label, sub: "due today", overdue: false };
  return { label, sub: `${diff}d left`, overdue: false };
}

function DeliverableRow({
  d,
  onAssign,
  onReview,
}: {
  d: Deliverable;
  onAssign: (id: string, m: TeamMember) => void;
  onReview: (id: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const assignee = memberById(d.assigneeId);
  const TypeIcon = d.type === "video" ? Clapperboard : Palette;
  const deadline = fmtDeadline(d.deadline);
  const canReview = d.status === "awaiting_review";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b py-3 last:border-b-0 hover:bg-accent/40 px-2 -mx-2 rounded-md transition-colors">
      {/* name + type */}
      <div className="flex min-w-[200px] flex-1 items-center gap-2.5">
        <TypeIcon className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{d.name}</div>
          <div className="text-xs text-muted-foreground">{d.type === "video" ? "Video" : "Static"}</div>
        </div>
      </div>

      {/* status */}
      <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLE[d.status])}>
        {STATUS_LABEL[d.status]}
      </span>

      {/* assignee */}
      <div className="flex w-[150px] items-center gap-2">
        {assignee ? (
          <>
            <Avatar className="size-6">
              <AvatarImage src={assignee.avatar} alt={assignee.name} />
              <AvatarFallback>{assignee.name[0]}</AvatarFallback>
            </Avatar>
            <span className="truncate text-sm">{assignee.name}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        )}
      </div>

      {/* deadline */}
      <div className="flex w-[110px] items-center gap-1.5 text-xs">
        <Calendar className="size-3.5 text-muted-foreground" />
        <span className={cn(deadline.overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
          {deadline.sub}
        </span>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2">
        {d.status !== "completed" && (
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {d.assigneeId ? <RefreshCw className="size-3.5" /> : <UserPlus className="size-3.5" />}
                {d.assigneeId ? "Reassign" : "Assign To"}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-2">
              <AssigneePicker
                selectedId={d.assigneeId}
                onSelect={(m) => { onAssign(d.id, m); setPickerOpen(false); }}
              />
            </PopoverContent>
          </Popover>
        )}
        <Button
          variant={canReview ? "default" : "outline"}
          size="sm"
          className={cn("h-8", canReview && "bg-amber-600 hover:bg-amber-700")}
          disabled={!canReview}
          onClick={() => onReview(d.id)}
        >
          <Eye className="size-3.5" /> Review
        </Button>
      </div>
    </div>
  );
}

export function ManagerDeliverablesView() {
  const all = useRelayStore((s) => s.deliverables);
  const lastVisitNewCount = useRelayStore((s) => s.lastVisitNewCount);
  const assign = useRelayStore((s) => s.assign);
  const approve = useRelayStore((s) => s.approve);
  const requestRevision = useRelayStore((s) => s.requestRevision);

  const [clientFilter, setClientFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<DeliverableStatus | "all">("all");
  const [onlyNeedsAction, setOnlyNeedsAction] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");

  const [reviewId, setReviewId] = useState<string | null>(null);
  const reviewDeliverable = reviewId ? all.find((d) => d.id === reviewId) ?? null : null;

  const todoCount = totalActionCount(all);

  const handleAssign = (id: string, member: TeamMember) => {
    assign(id, member.id);
    toast.success(`Assigned to ${member.name}`, { description: "They've been notified to begin work." });
  };
  const handleApprove = () => {
    if (!reviewId) return;
    approve(reviewId);
    toast.success("Deliverable complete 🎉");
    setReviewId(null);
  };
  const handleRevision = (notes: string, newAssigneeId?: string) => {
    if (!reviewId) return;
    const name = memberById(newAssigneeId ?? reviewDeliverable?.assigneeId)?.name ?? "the assignee";
    requestRevision(reviewId, notes, newAssigneeId);
    toast.info("Revision requested", { description: `Sent back to ${name}.` });
    setReviewId(null);
  };

  const filtered = useMemo(() => {
    let list = all.slice();
    if (clientFilter.length) list = list.filter((d) => clientFilter.includes(d.clientId));
    if (statusFilter !== "all") list = list.filter((d) => d.status === statusFilter);
    if (onlyNeedsAction) list = list.filter(needsAction);

    list.sort((a, b) => {
      const aa = needsAction(a) ? 1 : 0;
      const ba = needsAction(b) ? 1 : 0;
      if (aa !== ba) return ba - aa;
      switch (sort) {
        case "deadline":
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case "status":
          return a.status.localeCompare(b.status);
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [all, clientFilter, statusFilter, onlyNeedsAction, sort]);

  const grouped = useMemo(
    () => clients
      .map((c) => ({ client: c, items: filtered.filter((d) => d.clientId === c.id) }))
      .filter((g) => g.items.length > 0),
    [filtered],
  );

  const toggleClient = (id: string) =>
    setClientFilter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <AppShell>
      <div className="max-w-5xl space-y-5">
        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Deliverables</h1>
            <p className="text-sm text-muted-foreground">New client work — assign it and review what comes back</p>
          </div>
          <div className="flex items-center gap-2">
            {lastVisitNewCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" /> {lastVisitNewCount} new since last visit
              </span>
            )}
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
              todoCount > 0 ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700",
            )}>
              <BellRing className="size-3.5" /> {todoCount} need{todoCount === 1 ? "s" : ""} your action
            </span>
          </div>
        </div>

        {/* filter / sort bar */}
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2.5">
          <div className="flex items-center gap-1">
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleClient(c.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  clientFilter.includes(c.id) ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="mx-1 h-5 w-px bg-border" />

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as DeliverableStatus | "all")}>
            <SelectTrigger className="h-8 w-[170px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_LABEL) as DeliverableStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
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
            onClick={() => setOnlyNeedsAction((v) => !v)}
          >
            <BellRing className="size-3.5" /> Needs your action
          </Button>
        </div>

        {/* grouped list */}
        {all.length === 0 ? (
          <EmptyState icon={<Inbox className="size-10" />} title="No deliverables yet"
            body="New client work will appear here when an admin assigns you a client." />
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
              const videos = items.filter((d) => d.type === "video").length;
              const statics = items.filter((d) => d.type === "static").length;
              const parts = [
                videos > 0 ? `${videos} Video${videos === 1 ? "" : "s"}` : null,
                statics > 0 ? `${statics} Static${statics === 1 ? "" : "s"}` : null,
              ].filter(Boolean).join(", ");
              return (
                <section key={client.id}>
                  <div className="mb-1 flex items-baseline gap-2">
                    <h2 className="text-base font-semibold">
                      {client.name} <span className="font-normal text-muted-foreground">— {parts}</span>
                    </h2>
                    {client.isNew && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">New</span>
                    )}
                  </div>
                  <div>
                    {items.map((d) => (
                      <DeliverableRow key={d.id} d={d} onAssign={handleAssign} onReview={setReviewId} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <ReviewPanel
        deliverable={reviewDeliverable}
        open={!!reviewId}
        onOpenChange={(o) => !o && setReviewId(null)}
        onApprove={handleApprove}
        onRequestRevision={handleRevision}
      />
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
