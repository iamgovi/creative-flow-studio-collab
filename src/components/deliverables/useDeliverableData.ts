import { deliverables, history, type WeekPoint } from "@/data/mockDeliverables";
import { filterDeliverables } from "@/lib/deliverablesMath";
import { DATE_PRESETS, useDeliverableFilters } from "@/stores/deliverablesFilters";

/**
 * Single source of filtered data for every tab so numbers stay consistent.
 * The date preset controls the history window; client/type/status filter the
 * deliverable set; compare exposes the previous equivalent window.
 */
export function useDeliverableData() {
  const { preset, clientIds, type, status, compare, onTimeTarget } = useDeliverableFilters();

  const weeksWindow = DATE_PRESETS.find((p) => p.value === preset)?.weeks ?? 12;
  const isLast = preset === "lastMonth";

  const end = isLast ? history.length - weeksWindow : history.length;
  const start = Math.max(0, end - weeksWindow);
  const weeks: WeekPoint[] = history.slice(start, end);
  const prevWeeks: WeekPoint[] = history.slice(Math.max(0, start - weeksWindow), start);

  const dels = filterDeliverables(deliverables, { clientIds, type, status });

  return { dels, all: deliverables, weeks, prevWeeks, compare, target: onTimeTarget };
}