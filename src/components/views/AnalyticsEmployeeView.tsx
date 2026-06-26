import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KpiCard } from "@/components/analytics/KpiCard";
import { Donut } from "@/components/analytics/charts/Donut";
import { TrendLine } from "@/components/analytics/charts/TrendLine";
import { AttendanceGrid } from "@/components/analytics/AttendanceGrid";
import { WorkVsElapsedBars } from "@/components/analytics/charts/WorkVsElapsedBars";
import { InsightCard } from "@/components/analytics/InsightCard";
import { team, SKILL_MATRIX } from "@/data/mockSetup";
import {
  getMemberAnalytics,
  recentTasksByMember,
  presence,
  insights,
} from "@/data/mockAnalytics";
import {
  attendanceRate,
  firstPassRate,
  fmtHM,
  fmtPct,
  HEALTHY_PRODUCTIVITY,
  HEALTHY_UTILIZATION,
  memberStageCells,
  minSampleLabel,
  productivityRatio,
  tasksCompleted,
  utilization,
} from "@/lib/analyticsMath";
import { cn } from "@/lib/utils";
import { useCurrentRole } from "@/hooks/use-current-role";

export function AnalyticsEmployeeView({ id }: { id: string }) {
  const role = useCurrentRole();
  const analyticsTo = role === "admin" ? "/admin/analytics" : "/manager/analytics";
  const member = team.find((m) => m.id === id);
  const ma = getMemberAnalytics(id);

  if (!member || !ma) {
    return (
      <AppShell>
        <div className="p-10 text-center text-sm text-muted-foreground">Team member not found.</div>
      </AppShell>
    );
  }

  const rollups = ma.rollups;
  const prod = productivityRatio(rollups);
  const fp = firstPassRate(rollups);
  const util = utilization(member);
  const att = attendanceRate(rollups);
  const pres = presence.find((p) => p.memberId === id);

  const cells = memberStageCells(id);
  const fast = cells.filter((c) => c.enough && c.pctVsTeam < -10).map((c) => c.stage);
  const slow = cells.filter((c) => c.enough && c.pctVsTeam > 25).map((c) => c.stage);

  // skill strengths from matrix
  const skill = SKILL_MATRIX[member.role] ?? {};
  const perfectStages = Object.entries(skill).filter(([, v]) => v === "perfect").map(([k]) => k);

  const productive = rollups.reduce((s, r) => s + r.productiveSec, 0);
  const rework = rollups.reduce((s, r) => s + r.reworkSec, 0);
  const idle = rollups.reduce((s, r) => s + r.idleSec, 0);
  const brk = rollups.reduce((s, r) => s + r.breakSec, 0);
  const donut = [
    { name: "Productive", value: Math.round(productive / 3600), color: "var(--color-status-done)" },
    { name: "Rework", value: Math.round(rework / 3600), color: "var(--color-status-progress)" },
    { name: "Idle", value: Math.round(idle / 3600), color: "var(--color-status-idle)" },
    { name: "Break", value: Math.round(brk / 3600), color: "var(--color-status-review)" },
  ];

  // quality trend weekly
  const series = rollups.map((r, i) => ({
    date: r.date.slice(5),
    productivity: Math.round(productivityRatio(rollups.slice(Math.max(0, i - 2), i + 1))),
  }));

  const memberInsights = insights.filter((i) => i.memberId === id);

  return (
    <AppShell>
      <div className="mx-auto max-w-[1200px] space-y-4">
        <Link to={analyticsTo} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to analytics
        </Link>

        <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-transparent p-3 text-xs text-muted-foreground">
          1:1 prep view — a snapshot to support a conversation, not a scorecard.
        </div>

        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={member.avatar} />
              <AvatarFallback>{member.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-semibold tracking-tight">{member.name}</h1>
              <div className="text-sm text-muted-foreground">{member.role}</div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Attendance</div>
                <div className="font-mono font-semibold">{fmtPct(att)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Status</div>
                <div className="flex items-center gap-1.5 font-medium capitalize">
                  <span className={cn("size-2 rounded-full", pres?.state === "working" ? "bg-status-done" : pres?.state === "idle" ? "bg-status-progress" : pres?.state === "online" ? "bg-status-review" : "bg-status-idle")} />
                  {pres?.state ?? "offline"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Productivity" value={fmtPct(prod)} numericValue={prod} band={HEALTHY_PRODUCTIVITY} bandLabel="Healthy 55–80%" info="Share of logged time in focused work. Healthy band, not higher-is-better." />
          <KpiCard label="First-Pass Rate" value={fmtPct(fp)} info="Tasks approved on first submission." />
          <KpiCard label="Throughput" value={`${tasksCompleted(rollups)}`} info="Tasks completed in the period." />
          <KpiCard label="Utilization" value={fmtPct(util)} numericValue={util} band={HEALTHY_UTILIZATION} bandLabel="Healthy 70–95%" info="Allocated hours vs capacity. Above 95% signals overload." />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-2">
            <div className="mb-3 font-medium">Quality & productivity trend</div>
            <TrendLine data={series} band={HEALTHY_PRODUCTIVITY} />
          </Card>
          <Card className="p-5">
            <div className="mb-3 font-medium">Time split</div>
            <Donut data={donut} />
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
              {donut.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="ml-auto font-mono">{d.value}h</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="mb-3 font-medium">Time per stage vs team</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 font-normal">Stage</th>
                  <th className="py-2 font-normal">Their avg</th>
                  <th className="py-2 font-normal">Team avg</th>
                  <th className="py-2 font-normal">vs Team</th>
                  <th className="py-2 font-normal">Samples</th>
                </tr>
              </thead>
              <tbody>
                {cells.map((c) => (
                  <tr key={c.stage} className="border-b last:border-0">
                    <td className="py-2">{c.stage}</td>
                    {c.enough ? (
                      <>
                        <td className="py-2 font-mono">{fmtHM(c.avgSec)}</td>
                        <td className="py-2 font-mono text-muted-foreground">{fmtHM(c.teamAvgSec)}</td>
                        <td className={`py-2 font-mono ${c.pctVsTeam > 0 ? "text-status-overdue" : "text-status-done"}`}>{c.pctVsTeam > 0 ? "+" : ""}{c.pctVsTeam.toFixed(0)}%</td>
                        <td className="py-2 font-mono text-muted-foreground">n = {c.n}</td>
                      </>
                    ) : (
                      <td colSpan={4} className="py-2 text-xs text-muted-foreground">{minSampleLabel} (n = {c.n})</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <div className="mb-3 font-medium">Recent tasks — work vs elapsed</div>
            <WorkVsElapsedBars tasks={recentTasksByMember[id] ?? []} />
          </Card>
          <Card className="p-5">
            <div className="mb-3 font-medium">Strengths & growth areas</div>
            <div className="space-y-3 text-sm">
              <div>
                <div className="mb-1 text-xs font-medium text-status-done">Strengths</div>
                <p className="text-muted-foreground">
                  Fast & clean on {(fast.length ? fast : perfectStages).slice(0, 3).join(", ") || "core stages"}.
                  {perfectStages.length ? ` Skill fit: ${perfectStages.slice(0, 3).join(", ")}.` : ""}
                </p>
              </div>
              <div>
                <div className="mb-1 text-xs font-medium text-status-progress">Growth areas</div>
                <p className="text-muted-foreground">
                  {slow.length ? `Takes longer than the team on ${slow.join(", ")} — a pairing or training opportunity.` : "No stand-out slow areas — steady across the board."}
                </p>
              </div>
              <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">This is a conversation starter, not a verdict. Derived from skill-match and stage timing where there's enough data.</p>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="mb-3 font-medium">Attendance calendar</div>
          <AttendanceGrid memberIds={[id]} days={30} />
        </Card>

        {memberInsights.length > 0 && (
          <Card className="p-5">
            <div className="mb-3 font-medium">Insights for {member.name.split(" ")[0]}</div>
            <div className="grid gap-3 lg:grid-cols-2">
              {memberInsights.map((i) => (
                <InsightCard key={i.id} insight={i} />
              ))}
            </div>
          </Card>
        )}

        <div className="pb-4">
          <Button asChild variant="outline">
            <Link to={analyticsTo}>Back to analytics</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}