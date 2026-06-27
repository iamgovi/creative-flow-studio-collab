import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
  useReactFlow,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  Calendar as CalendarIcon,
  FileSignature,
  Image as ImageIcon,
  Video,
  Workflow,
  Users as UsersIcon,
  Check,
  X,
  Plus,
  Trash2,
  MousePointer2,
  Crown,
  GripVertical,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCurrentRole } from "@/hooks/use-current-role";
import { useCreateClient } from "@/hooks/useCreateClient";
import { useClientAssignmentPeople } from "@/hooks/useClientAssignmentPeople";
import type { CreateClientProjectType } from "@/services/client.service";
import type { ClientAssignmentPerson } from "@/services/employees.service";

type TeamFilter = "all" | "managers" | "members";

export function ClientNewView() {
  const role = useCurrentRole();
  const clientsTo = role === "admin" ? "/admin/clients" : "/manager/clients";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createClientMutation = useCreateClient();
  const assignmentPeopleQuery = useClientAssignmentPeople();
  const allTeam = assignmentPeopleQuery.data?.team ?? [];
  const managers = assignmentPeopleQuery.data?.managers ?? [];

  const [form, setForm] = useState({
    name: "",
    contactEmail: "",
    industry: "",
    notes: "",
    monthlyRevenue: "",
    setupFee: "",
    months: "6",
    isContract: true,
    staticCount: "4",
    videoCount: "2",
  });
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [objective, setObjective] = useState("");
  const [tone, setTone] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [deliverableInput, setDeliverableInput] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState<CreateClientProjectType | "">("");
  const [projectDeadline, setProjectDeadline] = useState<Date | undefined>(undefined);
  const [selectedManager, setSelectedManager] = useState("");

  const totals = useMemo(() => {
    const m = Number(form.monthlyRevenue) || 0;
    const months = Number(form.months) || 0;
    const setup = Number(form.setupFee) || 0;
    return { contract: m * months + setup, monthly: m };
  }, [form.monthlyRevenue, form.months, form.setupFee]);

  function setField<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function messageFromError(error: unknown) {
    if (error instanceof Error && error.message.trim()) return error.message;
    if (typeof error === "string" && error.trim()) return error;

    return "An unexpected error occurred.";
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error("Client name is required.");
      return;
    }

    if (!projectName.trim()) {
      toast.error("Project name is required.");
      return;
    }

    if (!projectType) {
      toast.error("Project type is required.");
      return;
    }

    if (!projectDeadline) {
      toast.error("Project deadline is required.");
      return;
    }

    if (!selectedManager) {
      toast.error("Select a project manager before creating a client.");
      return;
    }

    if (!managers.some((manager) => manager.id === selectedManager)) {
      toast.error("Select a valid project manager from the Supabase manager list.");
      return;
    }

    try {
      const client = await createClientMutation.mutateAsync({
        ...form,
        deadline,
        selectedManagerId: selectedManager,
        projectName,
        projectType,
        projectDeadline,
      });

      try {
        await queryClient.invalidateQueries({ queryKey: ["admin", "clients"] });
      } catch (error) {
        console.warn("Client created, but cache refresh failed.", error);
      }

      toast.success(`${form.name.trim()} added`);
      try {
        await navigate({ to: clientsTo });
      } catch (error) {
        toast.error("Client created, but redirect failed", {
          description: messageFromError(error),
        });
        console.error("Client redirect failed after creation.", { clientId: client.id, error });
      }
    } catch (error) {
      toast.error("Unable to create client", {
        description: messageFromError(error),
      });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button asChild variant="ghost" size="sm">
              <Link to={clientsTo}>
                <ArrowLeft className="size-4" />
                Clients
              </Link>
            </Button>
            <div className="h-5 w-px bg-border" />
            <div className="font-medium truncate">New client</div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link to={clientsTo}>
                <X className="size-4" />
                Cancel
              </Link>
            </Button>
            <Button onClick={handleSubmit} disabled={createClientMutation.isPending}>
              <Check className="size-4" />
              {createClientMutation.isPending ? "Creating..." : "Create client"}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Onboard a new client</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Capture commercials, deliverables and assign the internal workflow.
            </p>
          </div>
          <Card className="px-5 py-3 flex items-center gap-6">
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Monthly
              </div>
              <div className="text-lg font-semibold tabular">
                ₹{totals.monthly.toLocaleString()}
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Contract value
              </div>
              <div className="text-lg font-semibold tabular">
                ₹{totals.contract.toLocaleString()}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Account */}
          <Card className="p-6 lg:col-span-1 space-y-4">
            <div className="font-medium flex items-center gap-2">
              <Building2 className="size-4" /> Account
            </div>
            <div className="space-y-1.5">
              <Label>Client name</Label>
              <Input
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Acme Studios"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Primary contact email</Label>
              <Input
                type="email"
                value={form.contactEmail}
                onChange={(e) => setField("contactEmail", e.target.value)}
                placeholder="ops@acme.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Industry</Label>
              <Input
                value={form.industry}
                onChange={(e) => setField("industry", e.target.value)}
                placeholder="SaaS, Retail, …"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Brand guidelines, comms cadence, key stakeholders…"
              />
            </div>
          </Card>

          {/* Commercials */}
          <Card className="p-6 lg:col-span-2 space-y-5">
            <div className="font-medium flex items-center gap-2">
              <DollarSign className="size-4" /> Commercials
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <DollarSign className="size-3.5" />
                  Monthly revenue (₹)
                </Label>
                <Input
                  type="number"
                  min={0}
                  value={form.monthlyRevenue}
                  onChange={(e) => setField("monthlyRevenue", e.target.value)}
                  placeholder="12000"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5" />
                  Number of months
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.months}
                  onChange={(e) => setField("months", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Setup fee (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.setupFee}
                  onChange={(e) => setField("setupFee", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5" />
                  Deadline
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="size-3.5" />
                      {deadline ? format(deadline, "PPP") : <span>Pick a deadline</span>}
                      {deadline && (
                        <X
                          className="ml-auto size-3.5 opacity-60 hover:opacity-100"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeadline(undefined);
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Card className="p-4 flex items-center justify-between border-dashed">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-md bg-muted grid place-items-center">
                  <FileSignature className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Signed contract</div>
                  <div className="text-xs text-muted-foreground">
                    {form.isContract
                      ? "Locked retainer for the agreed period"
                      : "Deliverable-based — billed per item"}
                  </div>
                </div>
              </div>
              <Switch
                checked={form.isContract}
                onCheckedChange={(v) => setField("isContract", v)}
              />
            </Card>

            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="p-4 space-y-2">
                <Label className="flex items-center gap-1.5">
                  <ImageIcon className="size-3.5" /> Static deliverables / month
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setField("staticCount", String(Math.max(0, Number(form.staticCount) - 1)))
                    }
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    value={form.staticCount}
                    onChange={(e) => setField("staticCount", e.target.value)}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setField("staticCount", String(Number(form.staticCount) + 1))}
                  >
                    +
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Banners, key visuals, social posts, decks.
                </p>
              </Card>
              <Card className="p-4 space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Video className="size-3.5" /> Video creatives / month
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setField("videoCount", String(Math.max(0, Number(form.videoCount) - 1)))
                    }
                  >
                    −
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    value={form.videoCount}
                    onChange={(e) => setField("videoCount", e.target.value)}
                    className="text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setField("videoCount", String(Number(form.videoCount) + 1))}
                  >
                    +
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Reels, brand films, motion ads, teasers.
                </p>
              </Card>
            </div>
          </Card>
          <Card className="p-6 space-y-4 col-span-full">
            <h3 className="font-medium">Client Brief</h3>

            <div>
              <Label>Objective</Label>
              <Textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Describe the objective"
              />
            </div>

            <div>
              <Label>Deliverables</Label>

              <div className="flex gap-2">
                <Input
                  value={deliverableInput}
                  onChange={(e) => setDeliverableInput(e.target.value)}
                  placeholder="Add deliverable"
                />

                
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {deliverables.map((item, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 rounded-md border text-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Tone</Label>

              <Input
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="Professional, Playful, Luxury..."
              />
            </div>
          </Card>
          <Card className="p-6 space-y-4 col-span-full">
            <h3 className="font-medium">Project Information</h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Project name</Label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Initial campaign"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Project type</Label>
                <Select
                  value={projectType}
                  onValueChange={(value) => setProjectType(value as CreateClientProjectType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="static">Static</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <CalendarIcon className="size-3.5" />
                  Project deadline
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !projectDeadline && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="size-3.5" />
                      {projectDeadline ? format(projectDeadline, "PPP") : <span>Pick a deadline</span>}
                      {projectDeadline && (
                        <X
                          className="ml-auto size-3.5 opacity-60 hover:opacity-100"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setProjectDeadline(undefined);
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={projectDeadline}
                      onSelect={setProjectDeadline}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </Card>
          <Card className="p-6 col-span-full">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Assign Manager</h3>
                <p className="text-sm text-muted-foreground">
                  Select the manager responsible for this client.
                </p>
              </div>

              {assignmentPeopleQuery.isLoading && (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  Loading managers from Supabase...
                </div>
              )}

              {assignmentPeopleQuery.isError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
                  <div className="font-medium text-destructive">Unable to load managers</div>
                  <p className="mt-1 text-muted-foreground">
                    {assignmentPeopleQuery.error instanceof Error
                      ? assignmentPeopleQuery.error.message
                      : "Please try again."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => assignmentPeopleQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              )}

              {!assignmentPeopleQuery.isLoading &&
                !assignmentPeopleQuery.isError &&
                managers.length === 0 && (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    No Supabase managers found for Production Head or Senior Graphic Designer.
                  </div>
                )}

              {!assignmentPeopleQuery.isLoading && !assignmentPeopleQuery.isError && managers.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {managers.map((manager) => (
                    <button
                      key={manager.id}
                      type="button"
                      onClick={() => setSelectedManager(manager.id)}
                      className={cn(
                        "border rounded-lg p-4 text-left transition-all",
                        selectedManager === manager.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={manager.avatar} />
                          <AvatarFallback>{manager.name[0]}</AvatarFallback>
                        </Avatar>

                        <div>
                          <div className="font-medium">{manager.name}</div>

                          <div className="text-xs text-muted-foreground">
                            {manager.department}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
        <div className="flex justify-end gap-2 pb-8">
          <Button asChild variant="outline">
            <Link to={clientsTo}>Cancel</Link>
          </Button>
          <Button onClick={handleSubmit} disabled={createClientMutation.isPending}>
            <Plus className="size-4" />
            {createClientMutation.isPending ? "Creating..." : "Create client"}
          </Button>
        </div>
      </main>
    </div>
  );
}

type NodeData = {
  userId: string;
  name: string;
  position: string;
  avatar: string;
  role: "manager" | "employee";
  department: string;
  onRemove?: (id: string) => void;
};

type FlowNode = Node<NodeData>;
type FlowEdge = Edge;
const workflowEdgeColor = "var(--workflow-edge)";

function PersonNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const isManager = data.role === "manager";
  return (
    <div
      className={cn(
        "group rounded-lg border-2 bg-card shadow-sm flex items-center gap-2 px-2.5 py-2 w-[200px]",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : isManager
            ? "border-primary/60"
            : "border-border",
      )}
    >
      <Handle type="target" position={Position.Left} className="!size-3 !bg-primary !border-2 !border-background" />
      <Handle type="target" position={Position.Top} id="t" className="!size-3 !bg-primary !border-2 !border-background" />

      <Avatar className="size-9 shrink-0">
        <AvatarImage src={data.avatar} />
        <AvatarFallback>{data.name[0]}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium truncate flex items-center gap-1">
          {isManager && <Crown className="size-3 text-status-review" />}
          {data.name}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">{data.position}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          data.onRemove?.(id);
        }}
        className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
        title="Remove"
      >
        <Trash2 className="size-3.5" />
      </button>

      <Handle type="source" position={Position.Right} className="!size-3 !bg-primary !border-2 !border-background" />
      <Handle type="source" position={Position.Bottom} id="b" className="!size-3 !bg-primary !border-2 !border-background" />
    </div>
  );
}

const nodeTypes = { member: PersonNode, manager: PersonNode };

function WorkflowCanvas({
  nodes,
  edges,
  setNodes,
  setEdges,
  fullscreen,
  setFullscreen,
  team,
}: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  setNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<FlowEdge[]>>;
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
  team: ClientAssignmentPerson[];
}) {
  return (
    <ReactFlowProvider>
      <CanvasInner
        nodes={nodes}
        edges={edges}
        setNodes={setNodes}
        setEdges={setEdges}
        fullscreen={fullscreen}
        setFullscreen={setFullscreen}
        team={team}
      />
    </ReactFlowProvider>
  );
}

function CanvasInner({
  nodes,
  edges,
  setNodes,
  setEdges,
  fullscreen,
  setFullscreen,
  team,
}: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  setNodes: React.Dispatch<React.SetStateAction<FlowNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<FlowEdge[]>>;
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
  team: ClientAssignmentPerson[];
}) {
  const [filter, setFilter] = useState<TeamFilter>("all");
  const { screenToFlowPosition } = useReactFlow();

  const teammates = useMemo(() => {
    if (filter === "managers") return team.filter((u) => u.role === "manager");
    if (filter === "members") return team.filter((u) => u.role === "employee");
    return team;
  }, [filter, team]);

  const removeNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as FlowNode[]),
    [setNodes],
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source === connection.target) {
        toast.error("Can't connect a node to itself");
        return;
      }
      setEdges((eds) => {
        if (eds.some((e) => e.source === connection.source && e.target === connection.target)) {
          toast.error("Connection already exists");
          return eds;
        }
        return addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: true,
            style: { stroke: workflowEdgeColor, strokeWidth: 3 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: workflowEdgeColor,
              width: 20,
              height: 20,
            },
          },
          eds,
        );
      });
    },
    [setEdges],
  );

  const isValidConnection = useCallback(
    (c: Connection | Edge) => {
      if (c.source === c.target) return false;
      if (edges.some((e) => e.source === c.source && e.target === c.target)) return false;
      return true;
    },
    [edges],
  );

  const onPaletteDragStart = (e: React.DragEvent, userId: string) => {
    e.dataTransfer.setData("application/reactflow", userId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const userId = e.dataTransfer.getData("application/reactflow");
      const u = team.find((t) => t.id === userId);
      if (!u) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const newNode: FlowNode = {
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: u.role === "manager" ? "manager" : "member",
        position,
        data: {
          userId: u.id,
          name: u.name,
          position: u.position,
          avatar: u.avatar,
          role: u.role === "manager" ? "manager" : "employee",
          department: u.department,
          onRemove: removeNode,
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, removeNode, team],
  );

  // ensure existing nodes always have latest removeNode
  const nodesWithCb = useMemo(
    () => nodes.map((n) => ({ ...n, data: { ...n.data, onRemove: removeNode } })),
    [nodes, removeNode],
  );

  return (
    <div
      className={cn(
        "grid gap-4",
        fullscreen
          ? "fixed inset-0 z-50 bg-background p-4 grid-cols-[280px_1fr]"
          : "lg:grid-cols-[260px_1fr]",
      )}
    >
      {/* Palette */}
      <div className="space-y-2 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Team
          </div>
          <div className="text-[10px] text-muted-foreground">{teammates.length}</div>
        </div>
        <div className="flex rounded-md border p-0.5 bg-muted/40 text-xs">
          {(["all", "managers", "members"] as TeamFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 px-2 py-1 rounded capitalize transition-colors",
                filter === f
                  ? "bg-background shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
          {teammates.map((u) => (
            <div
              key={u.id}
              draggable
              onDragStart={(e) => onPaletteDragStart(e, u.id)}
              className="flex items-center gap-2 rounded-md border p-2 cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors"
            >
              <GripVertical className="size-3.5 text-muted-foreground shrink-0" />
              <Avatar className="size-7">
                <AvatarImage src={u.avatar} />
                <AvatarFallback className="text-[10px]">{u.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium truncate flex items-center gap-1">
                  {u.role === "manager" && <Crown className="size-3 text-status-review" />}
                  {u.name}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{u.department}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={cn(
          "relative rounded-lg border-2 border-dashed bg-muted/20 overflow-hidden",
          fullscreen ? "h-full" : "h-[600px]",
        )}
      >
        <ReactFlow
          nodes={nodesWithCb}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={["Backspace", "Delete"]}
          connectionLineStyle={{
            stroke: workflowEdgeColor,
            strokeWidth: 3,
            strokeDasharray: "5 5",
          }}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
            style: { stroke: workflowEdgeColor, strokeWidth: 3 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: workflowEdgeColor,
              width: 20,
              height: 20,
            },
          }}
        >
          <Background gap={18} size={1} />
          <Controls />
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => (n.type === "manager" ? "hsl(var(--primary))" : "#94a3b8")}
          />
        </ReactFlow>

        {nodes.length === 0 && (
          <div className="absolute inset-0 grid place-items-center text-center text-sm text-muted-foreground pointer-events-none">
            <div>
              <Workflow className="size-8 mx-auto mb-2 opacity-40" />
              Drag teammates here to build your workflow
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <Button size="sm" variant="outline" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            {fullscreen ? "Exit" : "Fullscreen"}
          </Button>
          {nodes.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNodes([]);
                setEdges([]);
              }}
            >
              <Trash2 className="size-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
