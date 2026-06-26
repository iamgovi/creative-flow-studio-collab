import { CalendarRange, ChevronDown, Download, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { team } from "@/data/mockSetup";
import { PROJECT_OPTIONS } from "@/data/mockAnalytics";
import { DATE_PRESETS, useAnalytics, type DateRangePreset } from "@/stores/analytics";
import { cn } from "@/lib/utils";

function MultiSelect({
  icon: Icon,
  label,
  options,
  selected,
  onChange,
}: {
  icon: typeof Users;
  label: string;
  options: { id: string; label: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const allSelected = selected.length === 0;
  const summary = allSelected ? `All ${label.toLowerCase()}` : `${selected.length} selected`;
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 font-normal">
          <Icon className="size-3.5" />
          <span className="text-muted-foreground">{label}:</span>
          {summary}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2">
        <button
          type="button"
          onClick={() => onChange([])}
          className={cn("w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent", allSelected && "font-medium")}
        >
          All {label.toLowerCase()}
        </button>
        <div className="my-1 h-px bg-border" />
        <div className="max-h-64 space-y-0.5 overflow-auto">
          {options.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
              <Checkbox checked={selected.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
              {o.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function FilterBar() {
  const { preset, members, projects, compare, setPreset, setMembers, setProjects, toggleCompare } = useAnalytics();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
      <Select value={preset} onValueChange={(v) => setPreset(v as DateRangePreset)}>
        <SelectTrigger className="h-9 w-[150px]">
          <CalendarRange className="size-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_PRESETS.map((d) => (
            <SelectItem key={d.value} value={d.value}>
              {d.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom…</SelectItem>
        </SelectContent>
      </Select>

      <MultiSelect
        icon={Users}
        label="Team"
        options={team.map((t) => ({ id: t.id, label: t.name }))}
        selected={members}
        onChange={setMembers}
      />
      <MultiSelect
        icon={CalendarRange}
        label="Projects"
        options={PROJECT_OPTIONS.map((p) => ({ id: p, label: p }))}
        selected={projects}
        onChange={setProjects}
      />

      <label className="flex items-center gap-2 pl-1 text-sm">
        <Switch checked={compare} onCheckedChange={toggleCompare} />
        <span className="text-muted-foreground">vs previous period</span>
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => toast.success("Data refreshed")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
          Last updated 2 min ago
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Download className="size-3.5" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast.success("Exporting CSV…")}>Export as CSV</DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Exporting PDF…")}>Export as PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}