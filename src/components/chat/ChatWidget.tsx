import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, ArrowLeft, Mic, Trash2, Play, Pause, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Member = { id: string; name: string; initials: string; role: string; online: boolean };
type Message = {
  id: string;
  peerId: string;
  author: "me" | "them";
  time: string;
  kind: "text" | "voice";
  text?: string;
  duration?: number; // seconds, for voice
  waveform?: number[]; // bars 0-1
};

const MEMBERS: Member[] = [
  { id: "maya", name: "Maya Rodriguez", initials: "MR", role: "Design Lead", online: true },
  { id: "devon", name: "Devon Kim", initials: "DK", role: "Engineer", online: true },
  { id: "priya", name: "Priya Shah", initials: "PS", role: "Senior Designer", online: true },
  { id: "alex", name: "Alex Tanaka", initials: "AT", role: "Video Editor", online: true },
  { id: "noah", name: "Noah Bennett", initials: "NB", role: "Producer", online: false },
  { id: "lina", name: "Lina Park", initials: "LP", role: "Copywriter", online: false },
  { id: "sam", name: "Sam Okafor", initials: "SO", role: "Motion Designer", online: true },
];

const SEED: Message[] = [
  { id: "s1", peerId: "maya", author: "them", kind: "text", text: "Hey! Can you take a look at the brief when you get a sec?", time: "9:02" },
  { id: "s2", peerId: "devon", author: "them", kind: "text", text: "Pushed the fix — let me know if it works on your end.", time: "9:14" },
  { id: "s3", peerId: "priya", author: "them", kind: "voice", duration: 7, waveform: genWave(22), time: "9:21" },
];

function genWave(n: number) {
  return Array.from({ length: n }, () => 0.25 + Math.random() * 0.75);
}
function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [peerId, setPeerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(SEED);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // recording state
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const [recWave, setRecWave] = useState<number[]>([]);
  const recTimer = useRef<number | null>(null);

  // walkie talkie state
  const [walkiePeer, setWalkiePeer] = useState<Member | null>(null);
  const [transmitting, setTransmitting] = useState(false);
  const [theirTalking, setTheirTalking] = useState(false);

  const peer = useMemo(() => MEMBERS.find((m) => m.id === peerId) ?? null, [peerId]);
  const thread = messages.filter((m) => m.peerId === peerId);
  const online = MEMBERS.filter((m) => m.online);
  const offline = MEMBERS.filter((m) => !m.online);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [thread.length, peerId, open]);

  // simulate the other side replying briefly when you finish transmitting
  useEffect(() => {
    if (!walkiePeer) return;
    if (transmitting) return;
    const t = setTimeout(() => {
      setTheirTalking(true);
      setTimeout(() => setTheirTalking(false), 1400 + Math.random() * 1200);
    }, 600);
    return () => clearTimeout(t);
  }, [transmitting, walkiePeer]);

  const lastMessageFor = (id: string) => {
    const list = messages.filter((m) => m.peerId === id);
    return list[list.length - 1];
  };

  const previewOf = (m?: Message) => {
    if (!m) return null;
    if (m.kind === "voice") return `🎤 Voice note · ${fmt(m.duration ?? 0)}`;
    return m.text ?? "";
  };

  const send = () => {
    const text = draft.trim();
    if (!text || !peer) return;
    const now = new Date();
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        peerId: peer.id,
        author: "me",
        kind: "text",
        text,
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
      },
    ]);
    setDraft("");
  };

  const startRec = () => {
    if (!peer) return;
    setRecording(true);
    setRecSecs(0);
    setRecWave([]);
    recTimer.current = window.setInterval(() => {
      setRecSecs((s) => s + 0.1);
      setRecWave((w) => [...w.slice(-40), 0.25 + Math.random() * 0.75]);
    }, 100);
  };
  const stopRec = (sendIt: boolean) => {
    if (recTimer.current) clearInterval(recTimer.current);
    recTimer.current = null;
    const dur = recSecs;
    const wave = recWave.length ? recWave : genWave(20);
    setRecording(false);
    setRecSecs(0);
    setRecWave([]);
    if (!sendIt || !peer || dur < 0.4) return;
    const now = new Date();
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        peerId: peer.id,
        author: "me",
        kind: "voice",
        duration: dur,
        waveform: wave,
        time: `${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`,
      },
    ]);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-lg hover:opacity-90 transition"
          aria-label="Open team chat"
        >
          <MessageCircle className="size-4" />
          <span className="text-sm font-medium">Team Chat</span>
          <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-semibold">
            {online.length}
          </span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-2rem)] flex flex-col rounded-xl border bg-card text-card-foreground shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2">
              {peer ? (
                <>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => setPeerId(null)}>
                    <ArrowLeft className="size-4" />
                  </Button>
                  <button
                    className="relative"
                    onClick={() => setWalkiePeer(peer)}
                    title="Walkie-talkie"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="text-[10px]">{peer.initials}</AvatarFallback>
                    </Avatar>
                    {peer.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                    )}
                  </button>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">{peer.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {peer.online ? "Active now" : "Offline"}
                    </div>
                  </div>
                </>
              ) : (
                <span className="text-sm font-semibold">Team Chat</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {peer && peer.online && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-amber-500 hover:text-amber-500"
                  onClick={() => setWalkiePeer(peer)}
                  title="Walkie-talkie"
                >
                  <Radio className="size-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="size-7" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {!peer && (
            <ScrollArea className="flex-1">
              <div className="p-2">
                <div className="px-2 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Online · {online.length}
                </div>
                {online.map((m) => {
                  const last = lastMessageFor(m.id);
                  return (
                    <div
                      key={m.id}
                      className="w-full flex items-center gap-2.5 rounded-md px-2 py-2 hover:bg-accent/60 transition-colors"
                    >
                      <button
                        className="relative shrink-0 group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setWalkiePeer(m);
                        }}
                        title={`Walkie-talkie ${m.name.split(" ")[0]}`}
                      >
                        <Avatar className="size-9 ring-2 ring-transparent group-hover:ring-amber-400 transition">
                          <AvatarFallback className="text-xs">{m.initials}</AvatarFallback>
                        </Avatar>
                        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                        <span className="absolute -top-1 -right-1 hidden group-hover:flex size-4 items-center justify-center rounded-full bg-amber-400 text-[8px] text-black">
                          <Radio className="size-2.5" />
                        </span>
                      </button>
                      <button
                        onClick={() => setPeerId(m.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium truncate">{m.name}</span>
                          {last && <span className="text-[10px] text-muted-foreground shrink-0">{last.time}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {previewOf(last) ?? m.role}
                        </div>
                      </button>
                    </div>
                  );
                })}

                {offline.length > 0 && (
                  <div className="px-2 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Offline · {offline.length}
                  </div>
                )}
                {offline.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPeerId(m.id)}
                    className="w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-left hover:bg-accent/60 transition-colors opacity-70"
                  >
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="text-xs">{m.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{m.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {peer && (
            <>
              <ScrollArea className="flex-1">
                <div ref={scrollRef} className="p-3 space-y-2">
                  {thread.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Start a conversation with {peer.name.split(" ")[0]}.
                    </p>
                  )}
                  {thread.map((m) => (
                    <MessageBubble key={m.id} m={m} />
                  ))}
                </div>
              </ScrollArea>

              {recording ? (
                <div className="flex items-center gap-2 border-t p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 shrink-0 text-destructive"
                    onClick={() => stopRec(false)}
                    title="Cancel"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <div className="flex-1 flex items-center gap-2 rounded-md bg-muted h-9 px-3">
                    <span className="size-2 rounded-full bg-destructive animate-pulse" />
                    <div className="flex items-end gap-[2px] h-5 flex-1 overflow-hidden">
                      {recWave.slice(-30).map((v, i) => (
                        <span
                          key={i}
                          className="w-[2px] bg-destructive/70 rounded-full"
                          style={{ height: `${Math.max(10, v * 100)}%` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">{fmt(recSecs)}</span>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    className="size-9 shrink-0"
                    onClick={() => stopRec(true)}
                    title="Send voice note"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  className="flex items-center gap-2 border-t p-2"
                >
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`Message ${peer.name.split(" ")[0]}`}
                    className="h-9"
                    autoFocus
                  />
                  {draft.trim() ? (
                    <Button type="submit" size="icon" className="size-9 shrink-0">
                      <Send className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="size-9 shrink-0"
                      onClick={startRec}
                      title="Record voice note"
                    >
                      <Mic className="size-4" />
                    </Button>
                  )}
                </form>
              )}
            </>
          )}
        </div>
      )}

      {walkiePeer && (
        <WalkieTalkie
          peer={walkiePeer}
          transmitting={transmitting}
          theirTalking={theirTalking}
          onPressStart={() => setTransmitting(true)}
          onPressEnd={() => setTransmitting(false)}
          onClose={() => {
            setTransmitting(false);
            setTheirTalking(false);
            setWalkiePeer(null);
          }}
        />
      )}
    </>
  );
}

function MessageBubble({ m }: { m: Message }) {
  const mine = m.author === "me";
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div className="max-w-[78%]">
        {m.kind === "text" ? (
          <div
            className={cn(
              "rounded-2xl px-3 py-1.5 text-sm",
              mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
            )}
          >
            {m.text}
          </div>
        ) : (
          <VoicePlayer mine={mine} duration={m.duration ?? 0} wave={m.waveform ?? []} />
        )}
        <div
          className={cn(
            "text-[10px] text-muted-foreground mt-0.5 px-1",
            mine ? "text-right" : "text-left"
          )}
        >
          {m.time}
        </div>
      </div>
    </div>
  );
}

function VoicePlayer({ mine, duration, wave }: { mine: boolean; duration: number; wave: number[] }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const start = performance.now() - progress * duration * 1000;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      setProgress(p);
      if (p >= 1) {
        setPlaying(false);
        setProgress(0);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl px-2.5 py-2 min-w-[180px]",
        mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
      )}
    >
      <button
        onClick={() => setPlaying((p) => !p)}
        className={cn(
          "size-7 rounded-full flex items-center justify-center shrink-0",
          mine ? "bg-primary-foreground/20" : "bg-foreground/10"
        )}
      >
        {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </button>
      <div className="flex items-end gap-[2px] h-6 flex-1">
        {wave.map((v, i) => {
          const active = i / wave.length <= progress;
          return (
            <span
              key={i}
              className={cn(
                "w-[2px] rounded-full",
                mine
                  ? active ? "bg-primary-foreground" : "bg-primary-foreground/40"
                  : active ? "bg-foreground" : "bg-foreground/30"
              )}
              style={{ height: `${Math.max(15, v * 100)}%` }}
            />
          );
        })}
      </div>
      <span className={cn("text-[10px] tabular-nums shrink-0", mine ? "text-primary-foreground/80" : "text-muted-foreground")}>
        {fmt(duration)}
      </span>
    </div>
  );
}

function WalkieTalkie({
  peer,
  transmitting,
  theirTalking,
  onPressStart,
  onPressEnd,
  onClose,
}: {
  peer: Member;
  transmitting: boolean;
  theirTalking: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  onClose: () => void;
}) {
  const status = transmitting
    ? "Transmitting…"
    : theirTalking
      ? `${peer.name.split(" ")[0]} is talking…`
      : "Hold to talk";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
      <div className="relative w-[340px] max-w-full rounded-2xl border bg-card text-card-foreground shadow-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 size-8 rounded-full hover:bg-accent flex items-center justify-center"
        >
          <X className="size-4" />
        </button>

        <div className="flex flex-col items-center px-6 pt-7 pb-5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-amber-500 font-semibold flex items-center gap-1.5">
            <Radio className="size-3" /> Walkie-Talkie · Channel open
          </div>

          <div className="relative mt-5">
            <span
              className={cn(
                "absolute inset-0 rounded-full",
                (transmitting || theirTalking) && "animate-ping",
                transmitting ? "bg-amber-400/40" : theirTalking ? "bg-emerald-400/40" : ""
              )}
            />
            <Avatar className={cn(
              "size-24 relative ring-4 transition-colors",
              transmitting ? "ring-amber-400" : theirTalking ? "ring-emerald-400" : "ring-border"
            )}>
              <AvatarFallback className="text-2xl">{peer.initials}</AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-4 text-center">
            <div className="text-base font-semibold">{peer.name}</div>
            <div className="text-xs text-muted-foreground">{peer.role}</div>
          </div>

          <div className={cn(
            "mt-3 text-xs font-medium tabular-nums",
            transmitting ? "text-amber-500" : theirTalking ? "text-emerald-500" : "text-muted-foreground"
          )}>
            {status}
          </div>

          <button
            onMouseDown={onPressStart}
            onMouseUp={onPressEnd}
            onMouseLeave={() => transmitting && onPressEnd()}
            onTouchStart={(e) => { e.preventDefault(); onPressStart(); }}
            onTouchEnd={(e) => { e.preventDefault(); onPressEnd(); }}
            className={cn(
              "mt-6 select-none size-28 rounded-full flex flex-col items-center justify-center gap-1 font-semibold text-sm transition-all shadow-lg",
              transmitting
                ? "bg-amber-500 text-black scale-95 shadow-amber-500/50"
                : "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95"
            )}
          >
            <Mic className="size-7" />
            <span className="text-[11px] uppercase tracking-wider">
              {transmitting ? "Live" : "Push"}
            </span>
          </button>

          <div className="mt-4 text-[10px] text-muted-foreground text-center max-w-[240px]">
            Press and hold to talk. Release to listen. Instant — no call needed.
          </div>
        </div>
      </div>
    </div>
  );
}
