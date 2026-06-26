import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

export function PlaceholderView({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <AppShell>
      <div className="max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Card className="grid place-items-center p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <Icon className="size-6 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium">Nothing here yet</div>
            <p className="max-w-sm text-xs text-muted-foreground">
              This section is ready to be built out. Its data and actions will live here.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}