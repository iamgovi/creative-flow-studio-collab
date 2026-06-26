import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TypeStatusRow } from "@/lib/deliverablesMath";

export function TypeStatusStacked({ data, height = 240 }: { data: TypeStatusRow[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="type" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
            contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12, color: "var(--color-popover-foreground)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          <Bar stackId="s" dataKey="on-track" name="On Track" fill="var(--color-status-done)" isAnimationActive={false} />
          <Bar stackId="s" dataKey="at-risk" name="At Risk" fill="var(--color-status-progress)" isAnimationActive={false} />
          <Bar stackId="s" dataKey="delayed" name="Delayed" fill="var(--color-status-overdue)" isAnimationActive={false} />
          <Bar stackId="s" dataKey="completed" name="Completed" fill="var(--color-status-idle)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}