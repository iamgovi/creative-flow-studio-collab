import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { team } from "@/data/mockSetup";
import { memberStageCells, fmtHM, minSampleLabel } from "@/lib/analyticsMath";
import { STAGES } from "@/data/mockAnalytics";
import { cn } from "@/lib/utils";

/** Color a cell green (faster than team) -> red (slower than team). */
function cellStyle(pct: number): React.CSSProperties {
  // pct < 0 => faster (green), pct > 0 => slower (red)
  const clamped = Math.max(-60, Math.min(60, pct));
  const intensity = Math.min(1, Math.abs(clamped) / 60);
  const token = clamped <= 0 ? "var(--color-status-done)" : "var(--color-status-overdue)";
  return {
    background: `color-mix(in oklab, ${token} ${10 + intensity * 55}%, var(--color-card))`,
  };
}

export function HeatTable({ memberIds, onSelect }: { memberIds: string[]; onSelect?: (id: string) => void }) {
  const members = memberIds.length ? team.filter((m) => memberIds.includes(m.id)) : team;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-card pr-3 pb-2 text-left text-xs font-normal text-muted-foreground">Member</th>
            {STAGES.map((s) => (
              <th key={s} className="px-1 pb-2 text-center text-xs font-normal text-muted-foreground">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const cells = memberStageCells(m.id);
            return (
              <tr key={m.id}>
                <td className="sticky left-0 z-10 bg-card pr-3 py-1">
                  <button
                    type="button"
                    onClick={() => onSelect?.(m.id)}
                    className="flex items-center gap-2 text-left hover:text-primary"
                  >
                    <Avatar className="size-6">
                      <AvatarImage src={m.avatar} />
                      <AvatarFallback>{m.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="max-w-[120px] truncate text-sm">{m.name}</span>
                  </button>
                </td>
                {cells.map((c) => (
                  <td key={c.stage} className="p-0">
                    {c.enough ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="flex h-9 min-w-[64px] items-center justify-center rounded font-mono text-xs"
                            style={cellStyle(c.pctVsTeam)}
                          >
                            {fmtHM(c.avgSec)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          <div className="font-medium">{m.name} · {c.stage}</div>
                          <div>Avg work: {fmtHM(c.avgSec)} (median {fmtHM(c.medianSec)})</div>
                          <div>Team avg: {fmtHM(c.teamAvgSec)}</div>
                          <div className={cn(c.pctVsTeam > 0 ? "text-status-overdue" : "text-status-done")}>
                            {c.pctVsTeam > 0 ? "+" : ""}{c.pctVsTeam.toFixed(0)}% vs team · n = {c.n}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex h-9 min-w-[64px] items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                            —
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">{minSampleLabel} (n = {c.n})</TooltipContent>
                      </Tooltip>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: "color-mix(in oklab, var(--color-status-done) 50%, var(--color-card))" }} /> Faster than team</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded" style={{ background: "color-mix(in oklab, var(--color-status-overdue) 50%, var(--color-card))" }} /> Slower than team</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-muted" /> {minSampleLabel} (n &lt; 3)</span>
      </div>
    </div>
  );
}