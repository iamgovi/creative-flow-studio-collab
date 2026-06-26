import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export function StatusDonut({ data, height = 220 }: { data: DonutSlice[]; height?: number }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const visible = data.filter((d) => d.value > 0);
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div style={{ height, width: height }} className="relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={visible} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="88%" paddingAngle={2} isAnimationActive={false}>
              {visible.map((d) => (
                <Cell key={d.name} fill={d.color} stroke="var(--color-card)" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12, color: "var(--color-popover-foreground)" }}
              formatter={(v, name) => [`${Number(v)} (${total ? Math.round((Number(v) / total) * 100) : 0}%)`, String(name)]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-2xl font-semibold">{total}</span>
          <span className="text-[11px] text-muted-foreground">deliverables</span>
        </div>
      </div>
      <ul className="flex-1 space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 rounded-[3px]" style={{ background: d.color }} />
            <span className="flex-1 text-muted-foreground">{d.name}</span>
            <span className="font-mono tabular">{d.value}</span>
            <span className="w-10 text-right font-mono text-xs text-muted-foreground tabular">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}