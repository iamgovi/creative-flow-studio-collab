import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpDown, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { StatusPill, MiniBar } from "./Pills";
import { clientName, managerName, type Deliverable, type DeliverableStatus } from "@/data/mockDeliverables";
import { daysLeft, fmtDate } from "@/lib/deliverablesMath";

const RISK_RANK: Record<DeliverableStatus, number> = {
  delayed: 0,
  "at-risk": 1,
  "on-track": 2,
  "not-started": 3,
  completed: 4,
};

type SortKey = "name" | "client" | "type" | "start" | "due" | "status" | "progress" | "days";

export function DeliverableTable({ rows }: { rows: Deliverable[] }) {
  const navigate = useNavigate();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "status", dir: 1 });

  const sorted = [...rows].sort((a, b) => {
    const d = sort.dir;
    switch (sort.key) {
      case "name": return a.name.localeCompare(b.name) * d;
      case "client": return clientName(a.clientId).localeCompare(clientName(b.clientId)) * d;
      case "type": return a.type.localeCompare(b.type) * d;
      case "start": return (new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) * d;
      case "due": return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * d;
      case "progress": return (a.progress - b.progress) * d;
      case "days": return (daysLeft(a.dueDate) - daysLeft(b.dueDate)) * d;
      case "status":
      default: return (RISK_RANK[a.status] - RISK_RANK[b.status]) * d;
    }
  });

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }));

  const Th = ({ k, label, className }: { k: SortKey; label: string; className?: string }) => (
    <TableHead className={className}>
      <button onClick={() => toggle(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        <ArrowUpDown className={cn("size-3", sort.key === k ? "text-foreground" : "text-muted-foreground/40")} />
      </button>
    </TableHead>
  );

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <Th k="name" label="Deliverable" />
            <Th k="client" label="Client" />
            <Th k="type" label="Type" />
            <Th k="start" label="Start" />
            <Th k="due" label="Due" />
            <Th k="status" label="Status" />
            <Th k="progress" label="Progress" />
            <Th k="days" label="Days Left / Late" />
            <TableHead>Manager</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((d) => {
            const left = daysLeft(d.dueDate);
            return (
              <TableRow
                key={d.id}
                className="cursor-pointer"
                onClick={() => navigate({ to: "/admin/deliverables/$id", params: { id: d.id } })}
              >
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{clientName(d.clientId)}</TableCell>
                <TableCell className="text-xs">{d.type}</TableCell>
                <TableCell className="text-xs text-muted-foreground tabular">{fmtDate(d.startDate)}</TableCell>
                <TableCell className="text-xs text-muted-foreground tabular">{fmtDate(d.dueDate)}</TableCell>
                <TableCell><StatusPill status={d.status} /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MiniBar value={d.progress} width="w-14" />
                    <span className="font-mono text-xs tabular">{d.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs tabular">
                  {d.status === "completed" ? (
                    <span className="text-muted-foreground">Done</span>
                  ) : left >= 0 ? (
                    <span className="text-status-done">{left}d left</span>
                  ) : (
                    <span className="text-status-overdue">{Math.abs(left)}d late</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{managerName(d.managerId)}</TableCell>
                <TableCell><ChevronRight className="size-4 text-muted-foreground" /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}