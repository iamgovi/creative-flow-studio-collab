import { Card } from "@/components/ui/card";
import { DeliverableTable } from "../DeliverableTable";
import { TypeStatusStacked } from "../charts/TypeStatusStacked";
import { HBar } from "../charts/HBar";
import { useDeliverableData } from "../useDeliverableData";
import { stageDistribution, typeStatusBreakdown } from "@/lib/deliverablesMath";

export function ByDeliverableTab() {
  const { dels } = useDeliverableData();
  const typeRows = typeStatusBreakdown(dels);
  const stageBars = stageDistribution(dels).map((s) => ({ label: s.stage, value: s.count, color: "var(--color-primary)" }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-1 font-medium">Deliverable type × status</div>
          <p className="mb-3 text-xs text-muted-foreground">Count of deliverables by type, broken down by status.</p>
          <TypeStatusStacked data={typeRows} />
        </Card>
        <Card className="p-5">
          <div className="mb-1 font-medium">Stage distribution</div>
          <p className="mb-3 text-xs text-muted-foreground">Where in-flight deliverables currently sit — pile-ups reveal bottlenecks (aggregate, not tasks).</p>
          <HBar data={stageBars} unit="" height={220} />
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b px-5 py-4">
          <div className="font-medium">Deliverables</div>
          <p className="text-xs text-muted-foreground">Per-deliverable overview with aggregate progress — not internal tasks. Default sort surfaces delayed and at-risk first.</p>
        </div>
        <DeliverableTable rows={dels} />
      </Card>
    </div>
  );
}