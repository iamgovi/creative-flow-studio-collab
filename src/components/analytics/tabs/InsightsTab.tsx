import { InsightCard } from "../InsightCard";
import { useAnalytics, type InsightFilter } from "@/stores/analytics";
import { insights } from "@/data/mockAnalytics";
import { cn } from "@/lib/utils";

const CHIPS: { value: InsightFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "strength", label: "Strengths" },
  { value: "growth", label: "Growth Areas" },
  { value: "wellbeing", label: "Wellbeing" },
  { value: "bottleneck", label: "Bottlenecks" },
  { value: "trend", label: "Trends" },
  { value: "anomaly", label: "Anomalies" },
];

export function InsightsTab() {
  const { insightFilter, setInsightFilter, dismissed, dismiss } = useAnalytics();

  const visible = insights
    .filter((i) => !dismissed.includes(i.id))
    .filter((i) => insightFilter === "all" || i.category === insightFilter)
    .sort((a, b) => b.priority - a.priority);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setInsightFilter(c.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              insightFilter === c.value ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">No insights in this category right now.</div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {visible.map((i) => (
            <InsightCard key={i.id} insight={i} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </div>
  );
}