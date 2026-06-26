import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { users, currentEmployee } from "@/data/mock";
import {
  Heart, Flame, PartyPopper, Coffee, Music2, Send, Sparkles, Trophy,
  Cake, Smile, Zap, Hand, ThumbsUp, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const VIBES = ["🎧 in the zone", "☕ caffeinating", "🎨 sketching", "🚀 shipping", "🧠 deep work", "🎬 editing", "💬 in a sync", "🌮 lunch break", "✨ vibing"];
const TUNES = ["Lo-fi beats", "Daft Punk radio", "Jazz café", "Synthwave 80s", "Chillhop essentials", "Focus flow", "Bollywood 2010s", "Ambient piano"];
const MOODS = ["😄","🔥","🤩","😎","🥳","🧘","☕","🚀","🌈","💜"];

const REACTIONS = [
  { icon: Heart, label: "love", color: "text-rose-500" },
  { icon: Flame, label: "fire", color: "text-orange-500" },
  { icon: PartyPopper, label: "party", color: "text-fuchsia-500" },
  { icon: ThumbsUp, label: "yes", color: "text-blue-500" },
];

function pickFor<T>(arr: T[], seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return arr[h % arr.length];
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

interface Kudo { id: string; from: string; to: string; msg: string; emoji: string; time: string; cheers: number; }

const SEED_KUDOS: Kudo[] = [
  { id: "k1", from: "Maya Romero", to: "Aria Patel", msg: "saved the Aurora cut at the last minute — absolute hero.", emoji: "🦸", time: "2m", cheers: 12 },
  { id: "k2", from: "Jin Okafor", to: "Noah Chen", msg: "the motion polish on the pitch deck? chef's kiss.", emoji: "👨‍🍳", time: "18m", cheers: 8 },
  { id: "k3", from: "Olivia Lindqvist", to: "Kai Müller", msg: "thanks for jumping on the late review — you rock.", emoji: "🎸", time: "1h", cheers: 5 },
];

export function TeamView() {
  const teammates = useMemo(() => users.filter((u) => u.id !== currentEmployee.id), []);
  const [kudos, setKudos] = useState<Kudo[]>(SEED_KUDOS);
  const [draft, setDraft] = useState("");
  const [draftTo, setDraftTo] = useState(teammates[0]?.name ?? "");
  const [reactedKudo, setReactedKudo] = useState<Record<string, boolean>>({});
  const [reacted, setReacted] = useState<Record<string, string>>({});
  const [poke, setPoke] = useState<string | null>(null);

  const sendKudo = () => {
    if (!draft.trim()) return;
    setKudos([{ id: `k${Date.now()}`, from: currentEmployee.name, to: draftTo, msg: draft.trim(), emoji: "✨", time: "now", cheers: 0 }, ...kudos]);
    setDraft("");
  };

  const cheer = (id: string) => {
    setReactedKudo((r) => ({ ...r, [id]: !r[id] }));
    setKudos((ks) => ks.map((k) => k.id === id ? { ...k, cheers: k.cheers + (reactedKudo[id] ? -1 : 1) } : k));
  };

  const react = (uid: string, label: string) => {
    setReacted((r) => ({ ...r, [uid]: r[uid] === label ? "" : label }));
  };

  const wave = (name: string) => {
    setPoke(name);
    setTimeout(() => setPoke(null), 1400);
  };

  const champion = teammates[1];
  const championMood = pickFor(MOODS, champion?.id ?? "");

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br from-primary/15 via-fuchsia-500/10 to-amber-300/10 border">
          <div className="absolute -top-10 -right-10 size-48 rounded-full bg-primary/20 blur-3xl animate-logo-glow" />
          <div className="absolute -bottom-12 -left-8 size-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="relative flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/70 backdrop-blur text-xs font-medium mb-3">
                <Sparkles className="size-3 text-primary" /> the squad
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Hey crew 👋</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">See who's around, send a kudos, share your vibe — this is your wall.</p>
            </div>
            <div className="flex -space-x-2">
              {teammates.slice(0, 6).map((u) => (
                <Avatar key={u.id} className="size-10 ring-2 ring-background">
                  <AvatarImage src={u.avatar} alt={u.name} />
                  <AvatarFallback>{initials(u.name)}</AvatarFallback>
                </Avatar>
              ))}
              <div className="size-10 rounded-full bg-background ring-2 ring-background grid place-items-center text-xs font-medium">
                +{teammates.length - 6}
              </div>
            </div>
          </div>
        </div>

        {/* Fun strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="size-10 rounded-xl bg-rose-500/15 grid place-items-center text-xl">{championMood}</div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">MVP today</div>
              <div className="font-semibold text-sm truncate">{champion?.name}</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="size-10 rounded-xl bg-amber-500/15 grid place-items-center"><Flame className="size-5 text-amber-500" /></div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Squad streak</div>
              <div className="font-semibold text-sm">12 days 🔥</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="size-10 rounded-xl bg-fuchsia-500/15 grid place-items-center"><Cake className="size-5 text-fuchsia-500" /></div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Birthday soon</div>
              <div className="font-semibold text-sm truncate">{teammates[3]?.name} · 4d</div>
            </div>
          </Card>
          <Card className="p-4 flex items-center gap-3 hover:scale-[1.02] transition-transform">
            <div className="size-10 rounded-xl bg-emerald-500/15 grid place-items-center"><Coffee className="size-5 text-emerald-500" /></div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Coffee club</div>
              <div className="font-semibold text-sm">3:00 PM today ☕</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kudos wall */}
          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/15 grid place-items-center"><Trophy className="size-4 text-primary" /></div>
                <div>
                  <div className="font-semibold">Kudos wall</div>
                  <div className="text-xs text-muted-foreground">Hype your teammates</div>
                </div>
              </div>
            </div>

            {/* Composer */}
            <div className="rounded-xl border bg-muted/40 p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">to</span>
                <select
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="bg-background text-xs rounded-md border px-2 py-1 max-w-[160px]"
                >
                  {teammates.map((u) => <option key={u.id}>{u.name}</option>)}
                </select>
                <span className="text-xs text-muted-foreground ml-auto">{draft.length}/140</span>
              </div>
              <div className="flex gap-2">
                <input
                  value={draft}
                  maxLength={140}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendKudo()}
                  placeholder="Say something nice ✨"
                  className="flex-1 bg-background rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <Button onClick={sendKudo} size="sm" className="gap-1.5"><Send className="size-3.5" /> Send</Button>
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {kudos.map((k, i) => (
                <div
                  key={k.id}
                  className="rounded-xl border p-3 hover:bg-accent/40 transition-colors"
                  style={{ animation: `card-rise 0.4s ease-out ${i * 50}ms both` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="size-9 rounded-lg bg-gradient-to-br from-primary/30 to-fuchsia-500/30 grid place-items-center text-lg shrink-0">
                      {k.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm">
                        <span className="font-medium">{k.from}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="font-medium">{k.to}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">{k.msg}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => cheer(k.id)}
                          className={cn(
                            "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-all",
                            reactedKudo[k.id]
                              ? "bg-rose-500/10 border-rose-500/40 text-rose-500 scale-105"
                              : "hover:bg-accent"
                          )}
                        >
                          <Heart className={cn("size-3", reactedKudo[k.id] && "fill-current")} />
                          {k.cheers}
                        </button>
                        <span className="text-[10px] text-muted-foreground">{k.time} ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Today's vibe */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="size-8 rounded-lg bg-fuchsia-500/15 grid place-items-center"><Music2 className="size-4 text-fuchsia-500" /></div>
              <div>
                <div className="font-semibold">Today's vibe</div>
                <div className="text-xs text-muted-foreground">What the crew is up to</div>
              </div>
            </div>
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
              {teammates.slice(0, 8).map((u, i) => {
                const vibe = pickFor(VIBES, u.id);
                const tune = pickFor(TUNES, u.id + "t");
                const online = i % 3 !== 0;
                return (
                  <div key={u.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/50 transition-colors">
                    <div className="relative">
                      <Avatar className="size-9">
                        <AvatarImage src={u.avatar} alt={u.name} />
                        <AvatarFallback>{initials(u.name)}</AvatarFallback>
                      </Avatar>
                      <span className={cn("absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-card", online ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{u.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{vibe} · 🎵 {tune}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* The crew */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Smile className="size-4 text-primary" />
            <h2 className="font-semibold">The crew</h2>
            <span className="text-xs text-muted-foreground">tap an emoji to react · wave to say hi</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {teammates.map((u, i) => {
              const mood = pickFor(MOODS, u.id);
              const vibe = pickFor(VIBES, u.id);
              const online = i % 3 !== 0;
              const myReact = reacted[u.id];
              const isPoking = poke === u.name;
              return (
                <Card
                  key={u.id}
                  className="group relative p-4 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all"
                  style={{ animation: `card-rise 0.4s ease-out ${i * 30}ms both` }}
                >
                  <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-br from-primary/15 via-fuchsia-500/10 to-transparent" />
                  <div className="absolute top-2 right-2 text-2xl select-none transition-transform group-hover:scale-110 group-hover:rotate-6">{mood}</div>

                  <div className="relative flex flex-col items-center text-center pt-2">
                    <div className="relative">
                      <Avatar className="size-16 ring-4 ring-background">
                        <AvatarImage src={u.avatar} alt={u.name} />
                        <AvatarFallback>{initials(u.name)}</AvatarFallback>
                      </Avatar>
                      <span className={cn("absolute bottom-0 right-0 size-3.5 rounded-full ring-2 ring-card", online ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                    </div>
                    <div className="mt-3 font-medium leading-tight text-sm">{u.name}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-full">{vibe}</div>

                    <div className="mt-3 flex items-center gap-1">
                      {REACTIONS.map((r) => {
                        const Active = myReact === r.label;
                        return (
                          <button
                            key={r.label}
                            onClick={() => react(u.id, r.label)}
                            className={cn(
                              "size-7 rounded-full grid place-items-center transition-all hover:scale-125 hover:bg-accent",
                              Active && "bg-accent scale-110"
                            )}
                          >
                            <r.icon className={cn("size-3.5", Active ? r.color : "text-muted-foreground")} />
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => wave(u.name)}
                      className="mt-3 w-full text-xs px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      <Hand className={cn("size-3.5", isPoking && "animate-bounce")} />
                      {isPoking ? "waved! 👋" : "wave"}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Footer fun */}
        <Card className="p-5 flex items-center justify-between gap-3 flex-wrap bg-gradient-to-r from-primary/5 via-transparent to-fuchsia-500/5">
          <div className="flex items-center gap-3">
            <Star className="size-5 text-amber-500" />
            <div>
              <div className="text-sm font-medium">Quote of the day</div>
              <div className="text-xs text-muted-foreground italic">"Done is better than perfect — but polished is better than done." — the crew</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5"><Zap className="size-3.5" /> Drop a vibe</Button>
        </Card>
      </div>
    </AppShell>
  );
}
