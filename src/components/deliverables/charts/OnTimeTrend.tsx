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

interface Props {
  data: { week: string; onTimeRate: number }[];
  target: number;
  height?: number;
}

export function OnTimeTrend({ data, target, height = 256 }: Props) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="week" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
          <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
          <ReferenceLine
            y={target}
            stroke="var(--color-status-done)"
            strokeDasharray="5 4"
            label={{ value: `Target ${target}%`, position: "insideTopRight", fontSize: 11, fill: "var(--color-status-done)" }}
          />
          <Tooltip
            contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12, color: "var(--color-popover-foreground)" }}
            formatter={(v) => [`${Number(v)}%`, "On-time rate"]}
          />
          <Line type="monotone" dataKey="onTimeRate" stroke="var(--color-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}