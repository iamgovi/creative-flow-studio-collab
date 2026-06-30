import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, CheckCircle2, LogOut, FolderCheck, FileVideo, FileImage, FileText, FileAudio, Check, UploadCloud } from "lucide-react";
import { tasks, projects, currentEmployee, productivityByDay } from "@/data/mock";
import { myProjects } from "@/data/myTasks";
import { useActiveTask } from "@/hooks/useActiveTask";
import { StatusBadge, PriorityChip } from "@/components/badges";
import type { TaskStatus } from "@/data/mock";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatDistanceToNow } from "date-fns";
export const Route = createFileRoute("/employee/dashboard")({ component: EmployeeDashboard });
import { getSupabaseClient } from "@/repositories/supabase/client";
function fmt(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", emoji: "🌅" };
  if (h < 17) return { text: "Good afternoon", emoji: "☀️" };
  return { text: "Good evening", emoji: "🌇" };
}

function EmployeeDashboard() {
  const supabase = getSupabaseClient();
  const [tick, setTick] = useState(0);
  const [employee, setEmployee] = useState<any>(null);
  const [myTasksAll, setMyTasksAll] = useState<any[]>([]);
  const review = myTasksAll.filter((t) => t.lifecycle === "review");
  const revision = myTasksAll.filter((t) => t.lifecycle === "revision");
  const myTasks = myTasksAll.slice(0, 6);
  const [loginTime, setLoginTime] = useState<string | null>(null);
  const [workedMinutes, setWorkedMinutes] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;
      const { data: attendance } = await supabase
        .from("employee_attendance")
        .select("*")
        .eq("employee_id", user.id)
        .is("logout_time", null)
        .order("login_time", { ascending: false })
        .limit(1)
        .single();

      if (attendance) {
        setLoginTime(attendance.login_time);

        const mins = Math.floor(
          (Date.now() - new Date(attendance.login_time).getTime()) / 60000
        );

        setWorkedMinutes(mins);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setEmployee(profile);

      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("assignee_id", user.id)
        .order("created_at", { ascending: false });

      console.log("USER ID:", user.id);
      console.log("TASKS:", tasks);  
      setMyTasksAll(tasks || []);
    }

    loadDashboard();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl">
        <div>
          {(() => { const g = greeting(); return (
            <h1 className="text-2xl font-semibold tracking-tight">{g.emoji} {g.text}, {employee?.full_name?.split(" ")[0] || "Employee"}</h1>
          ); })()}
          <p className="text-sm text-muted-foreground">Here’s what you’re working on today.</p>
        </div>

        {/* Hero attendance */}
        <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-primary/5 to-transparent">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Attendance</div>
            <div className="mt-1 text-lg">
            <span className="font-medium">Clocked in</span>

            <span className="text-muted-foreground">
              {" "}
              at{" "}
              {loginTime
                ? new Date(loginTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
              {" · "}
            </span>

            <span className="font-mono">
              {fmt(
                workedMinutes +
                  (loginTime
                    ? Math.floor(
                        (Date.now() - new Date(loginTime).getTime()) / 60000
                      ) -
                      workedMinutes
                    : 0)
              )}
            </span>

            <span className="text-muted-foreground"> so far today</span>
          </div>
          </div>
          <Button variant="outline" asChild>
            <Link to="/"><LogOut className="size-4" /> Clock out</Link>
          </Button>
        </Card>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Today's productivity — time-based engagement */}
          {(() => {
            const completed = myTasksAll.filter((t) => t.lifecycle === "done").length;
            const POINTS_PER_TASK = 20;
            const score = Math.min(100, completed * POINTS_PER_TASK);
            const now = new Date();
            const startHour = 9;
            const endHour = Math.max(startHour, now.getHours());
            const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => {
              const h = startHour + i;
              // smooth ramp toward current score with a midday bump
              const t = (i + 1) / (endHour - startHour + 1);
              const wave = Math.sin(t * Math.PI) * 12;
              const v = Math.max(8, Math.min(100, Math.round(score * t + wave)));
              return { hour: `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "a" : "p"}`, score: v };
            });
            return (
              <Card className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Today’s productivity</div>
                    <div className="mt-1 text-2xl font-semibold tabular leading-none">{score}<span className="text-base text-muted-foreground font-normal"> pts</span></div>
                    <div className="text-xs text-muted-foreground mt-1">{completed} task{completed === 1 ? "" : "s"} completed · {POINTS_PER_TASK} pts each</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Engagement</div>
                    <div className="text-sm font-medium text-primary">{score >= 80 ? "On fire 🔥" : score >= 50 ? "Steady" : score >= 20 ? "Warming up" : "Just starting"}</div>
                  </div>
                </div>
                <div className="h-20 mt-3 -mx-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hours} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                      <defs>
                        <linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="hour" hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip
                        cursor={{ stroke: "var(--color-muted)" }}
                        contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
                        formatter={(v) => [`${v} pts`, "Score"]}
                      />
                      <Area type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2} fill="url(#prodFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground tabular">
                  <span>{hours[0]?.hour}</span>
                  <span>now</span>
                </div>
              </Card>
            );
          })()}

          {/* Two tiles: assets readiness + pending work */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <AssetsReadyTile />
            <UploadsTile />
          </div>
        </div>

        {/* Today's Tasks */}
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div>
              <div className="font-medium">Things to do today</div>
              <div className="text-xs text-muted-foreground">{myTasks.length} assigned</div>
            </div>
          </div>
          <ul className="divide-y">
            {myTasks.map((t) => {
              const project = myProjects.find((p) => p.id === t.projectId);
              const overdue = new Date(t.deadline).getTime() < Date.now() && t.lifecycle !== "done";
              const active = t.lifecycle === "in_progress";
              const status = (t.lifecycle === "paused" ? "in_progress" : t.lifecycle) as TaskStatus;
              return (
                <li key={t.id} className="px-5 py-3.5 flex flex-wrap items-center gap-3">
                  <Link to="/employee/tasks/$taskId" params={{ taskId: t.id }} className="min-w-0 flex-1 hover:opacity-80 transition-opacity">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{t.title}</span>
                      <PriorityChip priority={t.priority} />
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {project?.name} · due {formatDistanceToNow(new Date(t.deadline), { addSuffix: true })}
                      {overdue && <span className="text-status-overdue ml-1">· overdue</span>}
                    </div>
                    {(() => {
                      // deterministic per-task asset progress
                      const seed = Array.from(t.id).reduce((s, ch) => s + ch.charCodeAt(0), 0);
                      const total = 3 + (seed % 5);
                      const dl =
                        t.lifecycle === "done" ? total
                        : t.lifecycle === "assigned" ? Math.max(1, Math.floor(total * 0.3))
                        : Math.max(1, total - (seed % 2));
                      const pct = Math.round((dl / total) * 100);
                      const ready = pct === 100;
                      const accent = "#f59e0b";
                      const tintC = "#fbbf24";
                      return (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1 flex-1 max-w-[180px] overflow-hidden rounded-full bg-muted/60">
                            <div
                              className={`h-full rounded-full ${ready ? "" : "animate-bar-shimmer"}`}
                              style={{
                                width: `${pct}%`,
                                background: ready
                                  ? `linear-gradient(90deg, ${accent}, ${tintC})`
                                  : `linear-gradient(90deg, ${accent} 0%, ${tintC} 35%, ${accent} 70%, ${tintC} 100%)`,
                                transition: "width 900ms cubic-bezier(.4,0,.2,1)",
                              }}
                            />
                          </div>
                          <span className="text-[10px] tabular text-muted-foreground">
                            {dl}/{total} files
                          </span>
                        </div>
                      );
                    })()}
                  </Link>
                  <StatusBadge status={status} />
                  {active && <span className="font-mono text-sm tabular">{fmt(t.accumulatedMin + Math.floor(tick / 60))}</span>}
                  <div className="flex items-center gap-1.5">
                    {active ? (
                      <Button size="sm" variant="outline"><Pause className="size-3.5" />Pause</Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled={t.lifecycle === "done"}><Play className="size-3.5" />{t.accumulatedMin > 0 ? "Resume" : "Start"}</Button>
                    )}
                    {active && (
                      <Button size="sm"><CheckCircle2 className="size-3.5" />Mark Ready</Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

function Gauge({ value }: { value: number }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
        <circle cx="50" cy="50" r={r} stroke="var(--color-muted)" strokeWidth="8" fill="none" />
        <circle cx="50" cy="50" r={r} stroke="var(--color-primary)" strokeWidth="8" fill="none"
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-xl font-semibold tabular">{value}%</div>
        </div>
      </div>
    </div>
  );
}

function PendingPanel({ title, items, empty }: { title: string; items: { id: string; title: string; projectId: string }[]; empty: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{title}</div>
      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-md">{empty}</div>
      ) : (
        <ul className="space-y-2">
          {items.map((t) => (
            <li key={t.id} className="text-sm border rounded-md p-2.5">
              <div className="font-medium truncate">{t.title}</div>
              <div className="text-xs text-muted-foreground">{myProjects.find((p) => p.id === t.projectId)?.name}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AssetsReadyTile() {
  return (
    <TransferTile
      kind="download"
      label="Deliverable files"
      titleReady="All files downloaded"
      titleBusy="Syncing deliverable files…"
      footerReady="Local cache up to date"
      footerBusy="Downloading from cloud"
      total={24}
      done={24}
      files={[
        { name: "Hero_cut_v3.mp4", progress: 100 },
        { name: "Brand_pack.zip", progress: 100 },
        { name: "Voiceover_final.wav", progress: 100 },
        { name: "Storyboard_v2.pdf", progress: 100 },
      ]}
    />
  );
}

function UploadsTile() {
  return (
    <TransferTile
      kind="upload"
      label="Completed uploads"
      titleReady="All deliverables uploaded"
      titleBusy="Uploading deliverables…"
      footerReady="Cloud sync complete"
      footerBusy="Pushing to cloud"
      total={6}
      done={4}
      files={[
        { name: "Holiday_reel_v4.mp4", progress: 100 },
        { name: "Packaging_front.psd", progress: 100 },
        { name: "Investor_deck.pdf", progress: 72 },
        { name: "Logo_lockups.zip", progress: 38 },
      ]}
    />
  );
}

type TransferFile = { name: string; progress: number };
function TransferTile({
  kind, label, titleReady, titleBusy, footerReady, footerBusy, total, done, files,
}: {
  kind: "download" | "upload";
  label: string;
  titleReady: string;
  titleBusy: string;
  footerReady: string;
  footerBusy: string;
  total: number;
  done: number;
  files: TransferFile[];
}) {
  const pct = Math.round((done / total) * 100);
  const ready = pct === 100;
  const Icon = kind === "download" ? FolderCheck : UploadCloud;

  // per-kind accent colors (download = orange, upload = green)
  const base = kind === "download" ? "#f59e0b" : "#16a34a";
  const tint = kind === "download" ? "#fbbf24" : "#4ade80";
  const barGrad = `linear-gradient(90deg, ${base}, ${tint})`;
  const glow = `radial-gradient(closest-side, color-mix(in oklab, ${base} 35%, transparent), transparent)`;

  const r = 36;
  const c = 2 * Math.PI * r;
  const off = c - (pct / 100) * c;
  const gradId = `ringGrad-${kind}`;

  return (
    <Card
      className="relative overflow-hidden p-5 h-full flex flex-col"
      style={{ ["--accent-color" as string]: base }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-60 blur-3xl animate-float-y"
        style={{ background: glow }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
            <span className="animate-float-y" style={{ display: "inline-flex" }}>
              <Icon className="size-3.5" style={{ color: base }} />
            </span>
            {label}
          </div>
          <div className="mt-1 text-base font-semibold leading-tight">
            {ready ? titleReady : titleBusy}
          </div>
          <div className="text-xs text-muted-foreground tabular mt-0.5">
            {done} of {total} files · {ready ? "synced just now" : "in progress"}
          </div>
        </div>

        <div className="relative size-20 shrink-0 animate-ring-pulse">
          <svg viewBox="0 0 100 100" className="size-20 -rotate-90">
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={base} />
                <stop offset="100%" stopColor={tint} />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r={r} stroke="var(--color-muted)" strokeWidth="9" fill="none" opacity="0.5" />
            <circle
              cx="50" cy="50" r={r}
              stroke={`url(#${gradId})`}
              strokeWidth="9" fill="none"
              strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1100ms cubic-bezier(.4,0,.2,1)" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-base font-semibold tabular leading-none" style={{ color: base }}>{pct}%</div>
          </div>
        </div>
      </div>

      <div className="relative mt-4 space-y-2">
        {files.map((f, i) => {
          const fDone = f.progress === 100;
          return (
            <div
              key={f.name}
              className="animate-file-pop"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="truncate text-foreground/80 flex items-center gap-1.5">
                  {fDone && (
                    <Check
                      className="size-3 animate-check-pop"
                      style={{ color: base, animationDelay: `${i * 90 + 250}ms` }}
                    />
                  )}
                  {f.name}
                </span>
                <span className="text-muted-foreground tabular ml-2">{f.progress}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                <div
                  className={`h-full rounded-full ${fDone ? "" : "animate-bar-shimmer"}`}
                  style={{
                    width: `${f.progress}%`,
                    background: fDone
                      ? barGrad
                      : `linear-gradient(90deg, ${base} 0%, ${tint} 35%, ${base} 70%, ${tint} 100%)`,
                    transition: "width 1100ms cubic-bezier(.4,0,.2,1)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative mt-auto pt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span
          className={`size-1.5 rounded-full ${ready ? "" : "animate-pulse"}`}
          style={{ background: base }}
        />
        {ready ? footerReady : footerBusy}
      </div>
    </Card>
  );
}
