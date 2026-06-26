import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FilterBar } from "./FilterBar";
import { PortfolioOverviewTab } from "./tabs/PortfolioOverviewTab";
import { ByClientTab } from "./tabs/ByClientTab";
import { ByDeliverableTab } from "./tabs/ByDeliverableTab";
import { DelaysRiskTab } from "./tabs/DelaysRiskTab";
import { TrendsTab } from "./tabs/TrendsTab";
import type { DeliverablesTab } from "@/stores/deliverablesFilters";

const TABS: { value: DeliverablesTab; label: string }[] = [
  { value: "overview", label: "Portfolio Overview" },
  { value: "clients", label: "By Client" },
  { value: "deliverables", label: "By Deliverable" },
  { value: "delays", label: "Delays & Risk" },
  { value: "trends", label: "Trends" },
];

export function DeliverablesPage() {
  const [tab, setTab] = useState<DeliverablesTab>("overview");

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Deliverables</h1>
          <p className="text-sm text-muted-foreground">
            Portfolio-level health of the delivery operation across all clients — strategic oversight, not task management.
          </p>
        </div>

        <FilterBar />

        <Tabs value={tab} onValueChange={(v) => setTab(v as DeliverablesTab)}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {TABS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="rounded-md border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4"><PortfolioOverviewTab onDrill={setTab} /></TabsContent>
          <TabsContent value="clients" className="mt-4"><ByClientTab /></TabsContent>
          <TabsContent value="deliverables" className="mt-4"><ByDeliverableTab /></TabsContent>
          <TabsContent value="delays" className="mt-4"><DelaysRiskTab /></TabsContent>
          <TabsContent value="trends" className="mt-4"><TrendsTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}