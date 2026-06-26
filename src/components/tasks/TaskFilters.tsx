import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Filter as FilterIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { myProjects, type MyPriority } from "@/data/myTasks";

export type DeadlineFilter = "any" | "overdue" | "this_week" | "next_week" | "later";

export interface FilterState {
  priorities: MyPriority[];
  projectIds: string[];
  deadline: DeadlineFilter;
}

export const EMPTY_FILTERS: FilterState = { priorities: [], projectIds: [], deadline: "any" };

const PRIORITIES: MyPriority[] = ["low", "medium", "high", "critical"];
const DEADLINES: { value: DeadlineFilter; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "overdue", label: "Overdue" },
  { value: "this_week", label: "This week" },
  { value: "next_week", label: "Next week" },
  { value: "later", label: "Later" },
];

export function activeFilterCount(f: FilterState): number {
  return f.priorities.length + f.projectIds.length + (f.deadline !== "any" ? 1 : 0);
}

export function TaskFilters({ value, onChange }: { value: FilterState; onChange: (v: FilterState) => void }) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(value);

  const togglePriority = (p: MyPriority) => {
    onChange({
      ...value,
      priorities: value.priorities.includes(p) ? value.priorities.filter((x) => x !== p) : [...value.priorities, p],
    });
  };
  const toggleProject = (id: string) => {
    onChange({
      ...value,
      projectIds: value.projectIds.includes(id) ? value.projectIds.filter((x) => x !== id) : [...value.projectIds, id],
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FilterIcon className="size-4" />
          Filter
          {count > 0 && (
            <span className="ml-0.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold size-4">{count}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="p-3 border-b">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Priority</div>
          <div className="grid grid-cols-2 gap-1.5">
            {PRIORITIES.map((p) => (
              <label key={p} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded px-1.5 py-1">
                <Checkbox checked={value.priorities.includes(p)} onCheckedChange={() => togglePriority(p)} />
                <span className="capitalize">{p}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-3 border-b">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Deliverable</div>
          <div className="space-y-1">
            {myProjects.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent rounded px-1.5 py-1">
                <Checkbox checked={value.projectIds.includes(p.id)} onCheckedChange={() => toggleProject(p.id)} />
                <span className="truncate">{p.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-3 border-b">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Deadline</div>
          <div className="grid grid-cols-2 gap-1.5">
            {DEADLINES.map((d) => (
              <button
                key={d.value}
                onClick={() => onChange({ ...value, deadline: d.value })}
                className={`text-xs rounded-md px-2 py-1.5 border text-left ${value.deadline === d.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-2 flex justify-between items-center">
          <button className="text-xs text-muted-foreground hover:text-foreground px-2 py-1" onClick={() => onChange(EMPTY_FILTERS)}>
            Clear all
          </button>
          <Button size="sm" onClick={() => setOpen(false)}>Done</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
