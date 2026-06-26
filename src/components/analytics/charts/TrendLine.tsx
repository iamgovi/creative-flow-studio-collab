import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Props {
  data: { date: string; productivity: number }[];
  band?: [number, number];
}

export function TrendLine({ data, band }: Props) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} interval="preserveStartEnd" tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
          {band && (
            <ReferenceArea y1={band[0]} y2={band[1]} fill="var(--color-status-done)" fillOpacity={0.1} ifOverflow="extendDomain" />
          )}
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-popover-foreground)",
            }}
            formatter={(v) => [`${Number(v)}%`, "Productivity"]}
          />
          <Line type="monotone" dataKey="productivity" stroke="var(--color-primary)" strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}