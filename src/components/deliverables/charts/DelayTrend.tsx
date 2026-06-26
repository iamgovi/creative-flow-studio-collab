import {
  CartesianGrid,
  ComposedChart,
  Line,
  Bar,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeekPoint } from "@/data/mockDeliverables";

export function DelayTrend({ data, height = 256 }: { data: WeekPoint[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
            contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12, color: "var(--color-popover-foreground)" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          <Bar yAxisId="right" dataKey="delayedCount" name="Delayed count" fill="var(--color-status-overdue)" fillOpacity={0.25} radius={[3, 3, 0, 0]} isAnimationActive={false} />
          <Line yAxisId="left" type="monotone" dataKey="avgDelay" name="Avg delay (days)" stroke="var(--color-status-overdue)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}