import {
  BarChart3,
  CalendarCheck,
  Clock,
  Lightbulb,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FilterBar } from "@/components/analytics/FilterBar";
import { OverviewTab } from "@/components/analytics/tabs/OverviewTab";
import { TimeEffortTab } from "@/components/analytics/tabs/TimeEffortTab";
import { AttendanceTab } from "@/components/analytics/tabs/AttendanceTab";
import { QualityTab } from "@/components/analytics/tabs/QualityTab";
import { WorkloadTab } from "@/components/analytics/tabs/WorkloadTab";
import { InsightsTab } from "@/components/analytics/tabs/InsightsTab";
import { useAnalytics, type AnalyticsTab } from "@/stores/analytics";
import { cn } from "@/lib/utils";

const TABS: { value: AnalyticsTab; label: string; icon: typeof BarChart3 }[] = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "time", label: "Time & Effort", icon: Clock },
  { value: "attendance", label: "Attendance", icon: CalendarCheck },
  { value: "quality", label: "Quality", icon: ShieldCheck },
  { value: "workload", label: "Workload", icon: Scale },
  { value: "insights", label: "Insights", icon: Lightbulb },
];

export function AnalyticsView() {
  const { activeTab, setTab } = useAnalytics();

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team Analytics</h1>
          <p className="text-sm text-muted-foreground">A supportive, optimization-focused view of your team — present, balanced, and growing.</p>
        </div>

        <FilterBar />

        <div className="border-b">
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = activeTab === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTab(t.value)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors",
                    active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <t.icon className="size-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "time" && <TimeEffortTab />}
        {activeTab === "attendance" && <AttendanceTab />}
        {activeTab === "quality" && <QualityTab />}
        {activeTab === "workload" && <WorkloadTab />}
        {activeTab === "insights" && <InsightsTab />}
      </div>
    </AppShell>
  );
}