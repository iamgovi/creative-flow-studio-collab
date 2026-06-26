import { cn } from "@/lib/utils";
import {
  HEALTH_META,
  STATUS_META,
  type ClientHealth,
  type DeliverableStatus,
} from "@/data/mockDeliverables";

export function StatusPill({ status, className }: { status: DeliverableStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", m.bg, className)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function HealthPill({ health, className }: { health: ClientHealth; className?: string }) {
  const m = HEALTH_META[health];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", m.bg, className)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

/** Thin inline progress / rate bar. */
export function MiniBar({ value, color = "var(--color-primary)", width = "w-20" }: { value: number; color?: string; width?: string }) {
  return (
    <div className={cn("h-1.5 overflow-hidden rounded-full bg-muted", width)}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  );
}