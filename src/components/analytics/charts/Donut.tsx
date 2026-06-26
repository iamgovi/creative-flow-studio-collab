import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export function Donut({ data, height = 200, unit = "h" }: { data: DonutSlice[]; height?: number; unit?: string }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} stroke="var(--color-card)" />
            ))}
          </Pie>
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
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}