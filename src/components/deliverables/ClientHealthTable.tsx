import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpDown, ChevronRight } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { HealthPill, MiniBar } from "./Pills";
import { managerName, type ClientHealth } from "@/data/mockDeliverables";
import { sortClientsByHealth, type ClientStats } from "@/lib/deliverablesMath";

type SortKey = "name" | "total" | "onTrack" | "atRisk" | "delayed" | "onTimeRate" | "avgDelay" | "health";
const HEALTH_RANK: Record<ClientHealth, number> = { "at-risk": 0, watch: 1, healthy: 2 };

export function ClientHealthTable({ stats }: { stats: ClientStats[] }) {
  const navigate = useNavigate();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "health", dir: 1 });

  const sorted = (() => {
    if (sort.key === "health") {
      const base = sortClientsByHealth(stats);
      return sort.dir === 1 ? base : base.reverse();
    }
    const val = (s: ClientStats) => (sort.key === "name" ? s.client.name : (s[sort.key] as number));
    return [...stats].sort((a, b) => {
      const av = val(a), bv = val(b);
      if (typeof av === "string") return (av as string).localeCompare(bv as string) * sort.dir;
      return ((av as number) - (bv as number)) * sort.dir;
    });
  })();

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "name" ? 1 : -1 }));

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
            <Th k="name" label="Client" />
            <Th k="total" label="Total" className="text-center" />
            <Th k="onTrack" label="On Track" className="text-center" />
            <Th k="atRisk" label="At Risk" className="text-center" />
            <Th k="delayed" label="Delayed" className="text-center" />
            <Th k="onTimeRate" label="On-Time Rate" />
            <Th k="avgDelay" label="Avg Delay" className="text-center" />
            <TableHead>Manager</TableHead>
            <Th k="health" label="Health" />
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((s) => (
            <TableRow
              key={s.client.id}
              className="cursor-pointer"
              onClick={() => navigate({ to: "/admin/deliverables/clients/$id", params: { id: s.client.id } })}
            >
              <TableCell className="font-medium">{s.client.name}</TableCell>
              <TableCell className="text-center font-mono tabular">{s.total}</TableCell>
              <TableCell className="text-center font-mono tabular text-status-done">{s.onTrack}</TableCell>
              <TableCell className="text-center font-mono tabular text-status-progress">{s.atRisk}</TableCell>
              <TableCell className="text-center font-mono tabular text-status-overdue">{s.delayed}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <MiniBar value={s.onTimeRate} color={s.onTimeRate >= 85 ? "var(--color-status-done)" : s.onTimeRate >= 70 ? "var(--color-status-progress)" : "var(--color-status-overdue)"} width="w-16" />
                  <span className="font-mono text-xs tabular">{s.onTimeRate}%</span>
                </div>
              </TableCell>
              <TableCell className="text-center font-mono text-xs tabular">
                {s.delayed === 0 ? "—" : `${s.avgDelay.toFixed(1)}d`}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{managerName(s.client.managerId)}</TableCell>
              <TableCell><HealthPill health={s.health} /></TableCell>
              <TableCell><ChevronRight className="size-4 text-muted-foreground" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}