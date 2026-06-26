import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { team } from "@/data/mockSetup";
import { memberAnalytics, type DailyRollup } from "@/data/mockAnalytics";
import { fmtMinClock } from "@/lib/analyticsMath";
import { cn } from "@/lib/utils";

function cellColor(r: DailyRollup): string {
  if (!r.isWorkingDay) return "bg-muted/50";
  if (!r.present) return "bg-status-overdue/80";
  if (r.partial) return "bg-status-progress/80";
  return "bg-status-done/80";
}

export function AttendanceGrid({ memberIds, days }: { memberIds: string[]; days: number }) {
  const members = memberIds.length ? team.filter((m) => memberIds.includes(m.id)) : team;
  const data = members.map((m) => memberAnalytics.find((x) => x.member.id === m.id)!);
  const sample = data[0]?.rollups.slice(-days) ?? [];

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0.5 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-card pr-3 pb-1 text-left text-xs font-normal text-muted-foreground">Member</th>
            {sample.map((r) => (
              <th key={r.date} className="pb-1 text-center text-[9px] font-normal text-muted-foreground" style={{ minWidth: 16 }}>
                {r.date.slice(8)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((m) => (
            <tr key={m.member.id}>
              <td className="sticky left-0 z-10 bg-card pr-3 py-0.5">
                <div className="flex items-center gap-2">
                  <Avatar className="size-5">
                    <AvatarImage src={m.member.avatar} />
                    <AvatarFallback>{m.member.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="max-w-[110px] truncate text-xs">{m.member.name}</span>
                </div>
              </td>
              {m.rollups.slice(-days).map((r) => (
                <td key={r.date} className="p-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={cn("size-4 rounded-sm", cellColor(r))} />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <div className="font-medium">{m.member.name} · {r.date}</div>
                      {!r.isWorkingDay ? (
                        <div>Non-working day</div>
                      ) : !r.present ? (
                        <div>Absent</div>
                      ) : (
                        <>
                          <div>{fmtMinClock(r.startMin ?? 0)}–{fmtMinClock(r.endMin ?? 0)}</div>
                          <div>{(r.attendanceSec / 3600).toFixed(1)}h logged{r.partial ? " (partial)" : ""}</div>
                        </>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-status-done/80" /> Present</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-status-progress/80" /> Partial (&lt;4h)</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-status-overdue/80" /> Absent</span>
        <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-muted/50" /> Non-working</span>
      </div>
    </div>
  );
}