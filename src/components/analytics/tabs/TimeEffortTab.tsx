import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useOpenMember } from "@/hooks/use-current-role";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StackedBar, type StackSeries } from "../charts/StackedBar";
import { useAnalytics } from "@/stores/analytics";
import { team } from "@/data/mockSetup";
import { windowMonthlyProjectTime, projectColor } from "@/data/mockAnalytics";
import { DATE_PRESETS } from "@/stores/analytics";

export function TimeEffortTab() {
  const { members, days, preset } = useAnalytics();
  const openMember = useOpenMember();
  const available = members.length ? team.filter((m) => members.includes(m.id)) : team;
  const [selectedId, setSelectedId] = useState(available[0]?.id ?? "tm1");
  const selected = team.find((m) => m.id === selectedId) ?? team[0];

  const rangeLabel = DATE_PRESETS.find((d) => d.value === preset)?.label ?? `Last ${days} days`;
  const monthsAsc = windowMonthlyProjectTime(selectedId, days);
  const months = [...monthsAsc].reverse(); // most recent first for the cards

  // Every distinct project this person touched in the window → chart series.
  const allProjects = Array.from(
    new Set(monthsAsc.flatMap((m) => m.projects.map((p) => p.project))),
  );
  const series: StackSeries[] = allProjects.map((project) => ({
    key: project,
    label: project,
    color: projectColor(project),
  }));

  // One row per month (chronological) with hours per project as columns.
  const chartData = monthsAsc.map((m) => {
    const row: Record<string, string | number> = { month: m.label.replace(/ \d{4}$/, "") };
    for (const p of m.projects) row[p.project] = p.hours;
    for (const proj of allProjects) if (!(proj in row)) row[proj] = 0;
    return row;
  });

  const totalHours = monthsAsc.reduce((s, m) => s + m.totalHours, 0);
  const avgPerMonth = monthsAsc.length ? Math.round(totalHours / monthsAsc.length) : 0;

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="size-9">
              <AvatarImage src={selected.avatar} />
              <AvatarFallback>{selected.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">{selected.name}</div>
              <div className="text-xs text-muted-foreground">{selected.role}</div>
            </div>
          </div>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {available.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Total time logged</div>
            <div className="mt-1 font-mono text-xl font-semibold">{totalHours}h</div>
            <div className="text-xs text-muted-foreground">{rangeLabel.toLowerCase()}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Avg per active month</div>
            <div className="mt-1 font-mono text-xl font-semibold">{avgPerMonth}h</div>
            <div className="text-xs text-muted-foreground">across {monthsAsc.length || 0} month{monthsAsc.length === 1 ? "" : "s"}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">Projects worked on</div>
            <div className="mt-1 font-mono text-xl font-semibold">{allProjects.length}</div>
            <div className="text-xs text-muted-foreground">distinct projects</div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-1 font-medium">Time per project, month by month</div>
        <p className="mb-4 text-xs text-muted-foreground">
          Total hands-on hours {selected.name.split(" ")[0]} logged each month within the selected range ({rangeLabel.toLowerCase()}), split by project.
        </p>
        {chartData.length ? (
          <StackedBar data={chartData} xKey="month" series={series} unit="h" height={300} />
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">No project time logged in this range.</div>
        )}
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {months.map((m, i) => (
          <Collapsible key={m.monthKey} defaultOpen={i === 0} className="group">
            <Card className="p-5">
              <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                  <span className="font-medium">{m.label}</span>
                  {m.partial && (
                    <span className="rounded-full border px-1.5 py-0.5 text-[10px] text-muted-foreground">partial month</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{m.projects.length} project{m.projects.length === 1 ? "" : "s"}</span>
                  <div className="font-mono text-sm">
                    <span className="text-muted-foreground">total </span>
                    {m.totalHours}h
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-4 space-y-2.5">
                  {m.projects.map((p) => {
                    const pct = m.totalHours ? Math.round((p.hours / m.totalHours) * 100) : 0;
                    return (
                      <div key={p.project}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="size-2.5 rounded-sm" style={{ background: projectColor(p.project) }} />
                            {p.project}
                          </span>
                          <span className="font-mono text-muted-foreground">{p.hours}h · {pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: projectColor(p.project) }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => openMember(selectedId)}
      >
        Open {selected.name.split(" ")[0]}'s full profile
      </Button>
    </div>
  );
}