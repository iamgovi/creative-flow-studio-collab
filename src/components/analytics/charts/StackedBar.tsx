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

export interface StackSeries {
  key: string;
  label: string;
  color: string;
}

interface Props {
  data: Record<string, string | number>[];
  xKey: string;
  series: StackSeries[];
  height?: number;
  unit?: string;
  layout?: "horizontal" | "vertical";
}

export function StackedBar({ data, xKey, series, height = 256, unit = "", layout = "horizontal" }: Props) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -16 }} layout={layout}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          {layout === "horizontal" ? (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
            </>
          ) : (
            <>
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey={xKey} width={90} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickLine={false} axisLine={false} />
            </>
          )}
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--color-popover-foreground)",
            }}
            formatter={(v, name) => [`${Number(v)}${unit}`, String(name)]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}