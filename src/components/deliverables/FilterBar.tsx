import { Calendar, ChevronDown, Download, FileText, Settings2, Sliders } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { clients } from "@/data/mockDeliverables";
import { DATE_PRESETS, useDeliverableFilters } from "@/stores/deliverablesFilters";

const TYPES = ["all", "Video", "Static", "Web", "Motion"] as const;
const STATUSES = ["all", "on-track", "at-risk", "delayed", "completed"] as const;
const STATUS_LABEL: Record<string, string> = {
  all: "All statuses",
  "on-track": "On Track",
  "at-risk": "At Risk",
  delayed: "Delayed",
  completed: "Completed",
};

export function FilterBar() {
  const {
    preset, setPreset,
    clientIds, toggleClient, setClientIds,
    type, setType,
    status, setStatus,
    compare, toggleCompare,
    onTimeTarget, setTarget,
  } = useDeliverableFilters();

  const clientLabel =
    clientIds.length === 0 ? "All clients" : clientIds.length === 1 ? clients.find((c) => c.id === clientIds[0])?.name : `${clientIds.length} clients`;

  const lastUpdated = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2">
      {/* date range */}
      <Select value={preset} onValueChange={(v) => setPreset(v as never)}>
        <SelectTrigger className="h-8 w-[150px] gap-1.5 text-xs">
          <Calendar className="size-3.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* client multi-select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
            {clientLabel}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-2">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-xs font-medium">Clients</span>
            <button className="text-[11px] text-primary hover:underline" onClick={() => setClientIds([])}>Reset</button>
          </div>
          <div className="space-y-0.5">
            {clients.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent">
                <Checkbox checked={clientIds.includes(c.id)} onCheckedChange={() => toggleClient(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* type */}
      <Select value={type} onValueChange={(v) => setType(v as never)}>
        <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {TYPES.map((t) => (
            <SelectItem key={t} value={t} className="text-xs">{t === "all" ? "All types" : t}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* status */}
      <Select value={status} onValueChange={(v) => setStatus(v as never)}>
        <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">{STATUS_LABEL[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* compare toggle */}
      <label className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs">
        <Switch checked={compare} onCheckedChange={toggleCompare} className="scale-90" />
        Compare vs prev
      </label>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden text-[11px] text-muted-foreground sm:inline">Updated {lastUpdated}</span>

        {/* targets settings */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs"><Sliders className="size-3.5" />Targets</Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium"><Settings2 className="size-4" />Target settings</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <Label className="text-xs">On-time target</Label>
                <span className="font-mono font-medium">{onTimeTarget}%</span>
              </div>
              <Slider value={[onTimeTarget]} min={60} max={99} step={1} onValueChange={(v) => setTarget(v[0])} />
              <p className="text-[11px] text-muted-foreground">Drives the reference line and on-track / at-risk thresholds across all tabs.</p>
            </div>
          </PopoverContent>
        </Popover>

        {/* export */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="h-8 gap-1.5 text-xs"><Download className="size-3.5" />Export Report</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast.success("Exporting portfolio report as CSV…")}>
              <FileText className="size-3.5" />Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.success("Exporting portfolio report as PDF…")}>
              <FileText className="size-3.5" />Export as PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}