import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AttendanceGrid } from "../AttendanceGrid";
import { PresenceBoard } from "../PresenceBoard";
import { useAnalytics } from "@/stores/analytics";
import { team } from "@/data/mockSetup";
import { memberAnalytics, SHIFT_START_MIN } from "@/data/mockAnalytics";
import {
  absences,
  attendanceRate,
  avgHoursPerDay,
  avgStartMin,
  fmtMinClock,
  fmtPct,
  punctualityRate,
  windowRollups,
} from "@/lib/analyticsMath";

type SortKey = "name" | "attendance" | "punctuality" | "hours" | "absences";

export function AttendanceTab() {
  const { members, days } = useAnalytics();
  const [sort, setSort] = useState<SortKey>("attendance");
  const memberList = members.length ? team.filter((m) => members.includes(m.id)) : team;

  const rows = memberList.map((m) => {
    const ma = memberAnalytics.find((x) => x.member.id === m.id)!;
    const r = windowRollups(ma, days);
    return {
      member: m,
      attendance: attendanceRate(r),
      punctuality: punctualityRate(r),
      hours: avgHoursPerDay(r),
      absences: absences(r),
    };
  });

  const sorted = [...rows].sort((a, b) => {
    if (sort === "name") return a.member.name.localeCompare(b.member.name);
    if (sort === "absences") return b.absences - a.absences;
    return (b[sort] as number) - (a[sort] as number);
  });

  // punctuality trend: avg start time across team per day
  const refRollups = (memberAnalytics[0] ? windowRollups(memberAnalytics[0], days) : []);
  const trend = refRollups.map((_, i) => {
    const starts = memberList
      .map((m) => {
        const ma = memberAnalytics.find((x) => x.member.id === m.id)!;
        return windowRollups(ma, days)[i];
      })
      .filter((r) => r && r.present && r.startMin != null)
      .map((r) => r!.startMin as number);
    const avg = starts.length ? starts.reduce((s, x) => s + x, 0) / starts.length : null;
    return { date: refRollups[i].date.slice(5), start: avg ? Math.round(avg) : null };
  });

  const Header = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="py-2 font-normal">
      <button type="button" onClick={() => setSort(k)} className="flex items-center gap-1 hover:text-foreground">
        {label}
        <ArrowUpDown className="size-3 opacity-50" />
      </button>
    </th>
  );

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="mb-4 font-medium">Attendance grid</div>
        <AttendanceGrid memberIds={members} days={days} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 font-medium">Attendance summary</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <Header k="name" label="Member" />
                  <Header k="attendance" label="Attend." />
                  <Header k="punctuality" label="Punctual" />
                  <Header k="hours" label="Avg h/day" />
                  <Header k="absences" label="Absences" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.member.id} className="border-b last:border-0">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="size-6">
                          <AvatarImage src={row.member.avatar} />
                          <AvatarFallback>{row.member.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="truncate">{row.member.name}</span>
                      </div>
                    </td>
                    <td className="py-2 font-mono">{fmtPct(row.attendance)}</td>
                    <td className="py-2 font-mono">{fmtPct(row.punctuality)}</td>
                    <td className="py-2 font-mono">{row.hours.toFixed(1)}h</td>
                    <td className="py-2 font-mono">{row.absences}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-1 font-medium">Punctuality trend</div>
          <p className="mb-3 text-xs text-muted-foreground">Average team start time vs the 09:00 expected shift start.</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
                <YAxis
                  domain={[SHIFT_START_MIN - 30, SHIFT_START_MIN + 60]}
                  tickFormatter={(v) => fmtMinClock(Number(v))}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <ReferenceLine y={SHIFT_START_MIN} stroke="var(--color-status-done)" strokeDasharray="4 4" label={{ value: "Shift start", fontSize: 10, fill: "var(--color-muted-foreground)" }} />
                <Tooltip
                  contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12, color: "var(--color-popover-foreground)" }}
                  formatter={(v) => [fmtMinClock(Number(v)), "Avg start"]}
                />
                <Line type="monotone" dataKey="start" stroke="var(--color-primary)" strokeWidth={2} dot={false} connectNulls isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 font-medium">Live presence board</div>
        <PresenceBoard memberIds={members} variant="cards" />
      </Card>
    </div>
  );
}