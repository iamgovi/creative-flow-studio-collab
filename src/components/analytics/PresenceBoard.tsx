import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { team } from "@/data/mockSetup";
import { presence, type PresenceState } from "@/data/mockAnalytics";
import { cn } from "@/lib/utils";

const DOT: Record<PresenceState, string> = {
  working: "bg-status-done",
  online: "bg-status-review",
  idle: "bg-status-progress",
  offline: "bg-status-idle",
};
const LABEL: Record<PresenceState, string> = {
  working: "Working",
  online: "Online",
  idle: "Idle",
  offline: "Offline",
};

function fmtDur(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

export function PresenceBoard({ memberIds, variant = "list" }: { memberIds: string[]; variant?: "list" | "cards" }) {
  const filtered = presence.filter((p) => (memberIds.length ? memberIds.includes(p.memberId) : true));
  // live-ish ticking timer (client only, hydration-safe: starts at 0 offset)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const counts = (["working", "online", "idle", "offline"] as PresenceState[]).map((s) => ({
    state: s,
    count: filtered.filter((p) => p.state === s).length,
  }));

  if (variant === "cards") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {filtered.map((p) => {
          const m = team.find((t) => t.id === p.memberId)!;
          return (
            <div key={p.memberId} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="relative">
                <Avatar className="size-9">
                  <AvatarImage src={m.avatar} />
                  <AvatarFallback>{m.name[0]}</AvatarFallback>
                </Avatar>
                <span className={cn("absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card", DOT[p.state], p.state === "working" && "animate-pulse")} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{m.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {p.state === "working" && p.currentTask ? p.currentTask : LABEL[p.state]}
                </div>
              </div>
              <div className="text-right text-[11px] text-muted-foreground">
                {p.state === "offline"
                  ? `seen ${fmtDur(p.lastSeenMin + tick)} ago`
                  : `online ${fmtDur(p.onlineForMin + tick)}`}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const working = filtered.filter((p) => p.state === "working");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {counts.map((c) => (
          <div key={c.state} className="rounded-lg border bg-card p-2 text-center">
            <div className="flex items-center justify-center gap-1.5">
              <span className={cn("size-1.5 rounded-full", DOT[c.state])} />
              <span className="font-mono text-lg font-semibold">{c.count}</span>
            </div>
            <div className="text-[10px] text-muted-foreground">{LABEL[c.state]}</div>
          </div>
        ))}
      </div>
      <ul className="space-y-2">
        {working.map((p) => {
          const m = team.find((t) => t.id === p.memberId)!;
          return (
            <li key={p.memberId} className="flex items-center gap-2.5">
              <div className="relative">
                <Avatar className="size-7">
                  <AvatarImage src={m.avatar} />
                  <AvatarFallback>{m.name[0]}</AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-status-done animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{m.name}</div>
                <div className="truncate text-xs text-muted-foreground">{p.currentTask}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}