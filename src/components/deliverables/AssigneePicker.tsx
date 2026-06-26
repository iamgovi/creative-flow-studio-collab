import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { team, type TeamMember } from "@/data/mockDeliverablesRelay";

function workloadColor(pct: number) {
  if (pct >= 0.9) return "bg-destructive";
  if (pct >= 0.7) return "bg-amber-500";
  return "bg-emerald-500";
}

export function AssigneePicker({
  selectedId,
  excludeId,
  onSelect,
}: {
  selectedId?: string;
  excludeId?: string;
  onSelect: (member: TeamMember) => void;
}) {
  const [q, setQ] = useState("");
  const list = team
    .filter((m) => m.id !== excludeId)
    .filter((m) => m.name.toLowerCase().includes(q.toLowerCase()) || m.role.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="w-[300px]">
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search team…"
          className="pl-8 h-9"
        />
      </div>
      <div className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-0.5">
        {list.map((m) => {
          const pct = Math.min(1, m.workloadH / m.capacityH);
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className={cn(
                "w-full flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent transition-colors",
                selectedId === m.id && "bg-accent",
              )}
            >
              <Avatar className="size-8">
                <AvatarImage src={m.avatar} alt={m.name} />
                <AvatarFallback>{m.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-1.5">
                  {m.name}
                  {selectedId === m.id && <Check className="size-3.5 text-primary" />}
                </div>
                <div className="text-xs text-muted-foreground truncate">{m.role}</div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div className={cn("h-full", workloadColor(pct))} style={{ width: `${pct * 100}%` }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {m.workloadH}h/{m.capacityH}h
                  </span>
                </div>
              </div>
            </button>
          );
        })}
        {list.length === 0 && (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">No matches</div>
        )}
      </div>
    </div>
  );
}