import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface HBarDatum {
  label: string;
  value: number;
  color?: string;
  enoughData?: boolean;
}

interface Props {
  data: HBarDatum[];
  unit?: string;
  height?: number;
  defaultColor?: string;
  domainMax?: number;
}

export function HBar({ data, unit = "", height = 240, defaultColor = "var(--color-primary)", domainMax }: Props) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart layout="vertical" data={data} margin={{ top: 4, right: 40, bottom: 4, left: 8 }}>
          <XAxis type="number" domain={[0, domainMax ?? "dataMax"]} hide />
          <YAxis
            type="category"
            dataKey="label"
            width={110}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
            contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12, color: "var(--color-popover-foreground)" }}
            formatter={(v, _n, item) => [
              (item?.payload as HBarDatum)?.enoughData === false ? "Limited data" : `${Number(v).toFixed(1)}${unit}`,
              "",
            ]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false} barSize={18}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color ?? defaultColor} fillOpacity={d.enoughData === false ? 0.3 : 1} />
            ))}
            <LabelList
              dataKey="value"
              position="right"
              formatter={(v) => `${Number(v ?? 0).toFixed(1)}${unit}`}
              style={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}