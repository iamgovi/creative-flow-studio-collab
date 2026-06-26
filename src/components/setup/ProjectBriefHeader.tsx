import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PriorityChip } from "@/components/badges";
import { Link } from "@tanstack/react-router";
import {
  ChevronLeft,
  Film,
  Image as ImageIcon,
  Pencil,
  Paperclip,
  Clock,
  CalendarDays,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { IncomingProject } from "@/data/mockSetup";
import { VIDEO_WORKFLOW, STATIC_WORKFLOW } from "@/data/mockSetup";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export function ProjectBriefHeader({
  project,
  onRename,
}: {
  project: IncomingProject;
  onRename: (name: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(project.name);
  const [expanded, setExpanded] = useState(false);

  const Icon = project.type === "video" ? Film : ImageIcon;
  const days = differenceInDays(new Date(project.deadline), new Date());
  const tight = days < 5;
  const stages = project.type === "video" ? VIDEO_WORKFLOW : STATIC_WORKFLOW;

  return (
    <Card className="p-5 space-y-5">
      <div className="grid lg:grid-cols-[60%_40%] gap-6">
        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Link to="/manager/dashboard" className="hover:text-foreground inline-flex items-center gap-1">
              <ChevronLeft className="size-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span>Incoming</span>
            <span>/</span>
            <span className="text-foreground truncate">{name}</span>
          </div>

          <div className="group flex items-center gap-2">
            {editingName ? (
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => {
                  setEditingName(false);
                  onRename(name);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setEditingName(false);
                    onRename(name);
                  }
                  if (e.key === "Escape") {
                    setName(project.name);
                    setEditingName(false);
                  }
                }}
                className="text-2xl font-semibold h-auto py-1"
              />
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight truncate">
                  {name}
                </h1>
                <button
                  onClick={() => setEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                  aria-label="Rename project"
                >
                  <Pencil className="size-3.5 text-muted-foreground" />
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border bg-primary/10 text-primary border-primary/20">
              <Icon className="size-3" />
              {project.type === "video" ? "Video" : "Static"}
            </span>
            <PriorityChip priority={project.priority} />
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border bg-status-idle/15 text-foreground border-status-idle/30">
              Awaiting Setup
            </span>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className={cn(!expanded && "line-clamp-3")}>{project.description}</p>
            {project.description.length > 200 && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="mt-1 text-primary text-xs font-medium hover:underline"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <MetaRow label="Client">
            <span className="text-sm font-medium">{project.client}</span>
          </MetaRow>
          <MetaRow label="Requested by">
            <div className="flex items-center gap-2">
              <Avatar className="size-5">
                <AvatarImage src={project.requestedBy.avatar} />
                <AvatarFallback>{project.requestedBy.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{project.requestedBy.name}</span>
            </div>
          </MetaRow>
          <MetaRow label="Received">
            <span className="text-sm inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-muted-foreground" />
              {format(new Date(project.receivedAt), "MMM d, yyyy · h:mm a")}
            </span>
          </MetaRow>
          <MetaRow label="Deadline">
            <span className="text-sm inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5 text-muted-foreground" />
              {format(new Date(project.deadline), "MMM d, yyyy")}
              <span className={cn("text-xs", tight ? "text-status-overdue" : "text-muted-foreground")}>
                · {days}d left
              </span>
            </span>
          </MetaRow>
          <MetaRow label="Budget">
            <span className="text-sm tabular">{project.budgetHours}h</span>
          </MetaRow>
          <MetaRow label="Reference files">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-primary hover:bg-transparent">
                  <Paperclip className="size-3.5" />
                  {project.referenceFiles.length} files · View
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-2">
                <ul className="divide-y">
                  {project.referenceFiles.map((f) => (
                    <li key={f.name} className="px-2 py-2 flex items-center justify-between text-sm">
                      <span className="truncate">{f.name}</span>
                      <span className="text-xs text-muted-foreground">{f.size}</span>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          </MetaRow>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {stages.map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <span className="px-2.5 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {s}
                </span>
                {i < stages.length - 1 && (
                  <span className="text-muted-foreground/40">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Tasks below are auto-generated from the {project.type === "video" ? "Video" : "Static"} workflow template. Edit or add tasks before launching.
        </p>
      </div>
    </Card>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
