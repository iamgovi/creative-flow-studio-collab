import { useOpenMember } from "@/hooks/use-current-role";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KpiCard } from "../KpiCard";
import { StackedBar } from "../charts/StackedBar";
import { Sparkline } from "../charts/Sparkline";
import { useAnalytics } from "@/stores/analytics";
import { team } from "@/data/mockSetup";
import { memberAnalytics, STAGES } from "@/data/mockAnalytics";
import {
  avgRevisionLoops,
  delta,
  firstPassRate,
  fmtPct,
  reworkHours,
  revisionRate,
  tasksCompleted,
  teamMetrics,
  windowRollups,
} from "@/lib/analyticsMath";
import { cn } from "@/lib/utils";

export function QualityTab() {
  const { members, days, compare } = useAnalytics();
  const openMember = useOpenMember();
  const m = teamMetrics(members, days);
  const prev = teamMetrics(members, days, true);
  const memberList = members.length ? team.filter((mm) => members.includes(mm.id)) : team;

  const rows = memberList
    .map((mm) => {
      const ma = memberAnalytics.find((x) => x.member.id === mm.id)!;
      const r = windowRollups(ma, days);
      const fp = firstPassRate(r);
      // first-pass trend (weekly)
      const weekly: number[] = [];
      for (let w = 0; w < Math.ceil(days / 7); w++) {
        weekly.push(firstPassRate(r.slice(w * 7, w * 7 + 7)));
      }
      return {
        member: mm,
        firstPass: fp,
        revision: revisionRate(r),
        loops: avgRevisionLoops(r),
        rework: reworkHours(r),
        completed: tasksCompleted(r),
        trend: weekly,
      };
    })
    .sort((a, b) => b.firstPass - a.firstPass);

  const best = rows[0]?.firstPass ?? 0;

  // revision breakdown per member
  const revData = memberList.map((mm) => {
    const ma = memberAnalytics.find((x) => x.member.id === mm.id)!;
    const r = windowRollups(ma, days);
    const done = r.reduce((s, x) => s + x.tasksCompleted, 0);
    const rev = r.reduce((s, x) => s + x.revisions, 0);
    const fp = done - rev;
    const oneRev = Math.round(rev * 0.7);
    const twoPlus = rev - oneRev;
    return { name: mm.name.split(" ")[0], first: fp, one: oneRev, two: twoPlus };
  });

  // where revisions happen (by stage) — synthetic but stable
  const stageRev = STAGES.map((s, i) => ({ name: s, loops: [8, 5, 11, 4, 14, 3][i] ?? 4 }));

  const d = (a: number, b: number) => delta(a, b);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="First-Pass Rate" value={fmtPct(m.firstPass)} info="Tasks approved on the first submission." delta={d(m.firstPass, prev.firstPass)} showDelta={compare} />
        <KpiCard label="Revision Rate" value={fmtPct(m.revisionRate)} info="Tasks that needed at least one revision." delta={d(m.revisionRate, prev.revisionRate)} lowerIsBetter showDelta={compare} />
        <KpiCard label="Avg Revision Loops" value={m.avgLoops.toFixed(2)} info="Average number of revision rounds per completed task." delta={d(m.avgLoops, prev.avgLoops)} lowerIsBetter showDelta={compare} />
        <KpiCard label="Rework Ratio" value={fmtPct(m.reworkRatio)} info="Share of logged time spent redoing work after revisions." delta={d(m.reworkRatio, prev.reworkRatio)} lowerIsBetter showDelta={compare} />
      </div>

      <Card className="p-5">
        <div className="mb-1 font-medium">Quality leaderboard</div>
        <p className="mb-4 text-xs text-muted-foreground">Ranked by first-pass rate. Top performers are benchmarks; those lower down are support opportunities, not problems.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 font-normal">#</th>
                <th className="py-2 font-normal">Member</th>
                <th className="py-2 font-normal">First-pass</th>
                <th className="py-2 font-normal">Revision</th>
                <th className="py-2 font-normal">Avg loops</th>
                <th className="py-2 font-normal">Rework</th>
                <th className="py-2 font-normal">Tasks</th>
                <th className="py-2 font-normal">Trend</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isBest = row.firstPass >= best - 2 && i < 2;
                const needsSupport = row.firstPass < 65;
                return (
                  <tr
                    key={row.member.id}
                    className={cn(
                      "border-b last:border-0 cursor-pointer hover:bg-accent/40",
                      isBest && "bg-status-done/5",
                      needsSupport && "bg-status-progress/5",
                    )}
                    onClick={() => openMember(row.member.id)}
                  >
                    <td className="py-2 font-mono text-muted-foreground">{i + 1}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={row.member.avatar} />
                          <AvatarFallback>{row.member.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{row.member.name}</span>
                        {isBest && <span className="rounded bg-status-done/15 px-1.5 py-0.5 text-[10px] font-medium text-status-done">benchmark</span>}
                        {needsSupport && <span className="rounded bg-status-progress/15 px-1.5 py-0.5 text-[10px] font-medium text-status-progress">support</span>}
                      </div>
                    </td>
                    <td className="py-2 font-mono">{fmtPct(row.firstPass)}</td>
                    <td className="py-2 font-mono text-muted-foreground">{fmtPct(row.revision)}</td>
                    <td className="py-2 font-mono text-muted-foreground">{row.loops.toFixed(2)}</td>
                    <td className="py-2 font-mono text-muted-foreground">{row.rework.toFixed(1)}h</td>
                    <td className="py-2 font-mono text-muted-foreground">{row.completed}</td>
                    <td className="py-2 w-24"><Sparkline data={row.trend} color="var(--color-status-done)" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 font-medium">Revision analysis by member</div>
          <StackedBar
            data={revData}
            xKey="name"
            unit=" tasks"
            series={[
              { key: "first", label: "First-pass", color: "var(--color-status-done)" },
              { key: "one", label: "1 revision", color: "var(--color-status-progress)" },
              { key: "two", label: "2+ revisions", color: "var(--color-status-overdue)" },
            ]}
          />
        </Card>
        <Card className="p-5">
          <div className="mb-1 font-medium">Where revisions happen</div>
          <p className="mb-3 text-xs text-muted-foreground">Stages generating the most revision loops — helps spot brief-clarity vs execution issues.</p>
          <StackedBar
            data={stageRev}
            xKey="name"
            unit=" loops"
            series={[{ key: "loops", label: "Revision loops", color: "var(--color-primary)" }]}
          />
        </Card>
      </div>
    </div>
  );
}