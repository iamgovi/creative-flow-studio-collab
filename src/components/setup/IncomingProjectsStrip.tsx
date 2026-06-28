import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityChip } from "@/components/badges";
import { Film, Image as ImageIcon, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";

export function IncomingProjectsStrip() {
  const { incomingProjects, loading, error } = useProjects();

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Incoming projects
        </h2>
        <Card className="p-4 text-sm text-muted-foreground">Loading projects...</Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Incoming projects
        </h2>
        <Card className="p-4 text-sm text-destructive">{error.message}</Card>
      </section>
    );
  }

  if (incomingProjects.length === 0) return null;

  const isBanner = incomingProjects.length === 1;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Incoming projects
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {incomingProjects.length} awaiting setup
          </p>
        </div>
      </div>
      <div
        className={cn(
          isBanner
            ? "grid grid-cols-1"
            : "flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x"
        )}
      >
        {incomingProjects.map((p) => {
          const days = differenceInDays(new Date(p.deadline), new Date());
          const tight = days < 3;
          const Icon = p.type === "video" ? Film : ImageIcon;
          return (
            <Card
              key={p.id}
              className={cn(
                "p-4 shrink-0 snap-start flex flex-col gap-3",
                isBanner ? "w-full" : "w-[320px]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.client}</div>
                    {p.managerName && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        Manager: {p.managerName}
                      </div>
                    )}
                  </div>
                </div>
                <PriorityChip priority={p.priority as any} />
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3" />
                  Received {formatDistanceToNow(new Date(p.receivedAt), { addSuffix: true })}
                </span>
                <span className={cn(tight && "text-status-overdue font-medium")}>
                  Due in {days}d
                </span>
              </div>
              <Link
                to="/manager/projects/$id/setup"
                params={{ id: p.id }}
                className="mt-auto"
              >
                <Button size="sm" className="w-full">
                  Set Up & Assign <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
