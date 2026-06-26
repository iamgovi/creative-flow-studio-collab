import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Gamepad2,
  Trophy,
  Sparkles,
  RotateCcw,
  Zap,
  Target,
  Brain,
  Hash,
  X as XIcon,
  ArrowLeft,
  UserPlus,
  Check,
  Circle,
} from "lucide-react";

export const Route = createFileRoute("/employee/games")({ component: GamesPage });

type GameId = "click-rush" | "memory-flip" | "tic-tac-toe";

type GameMeta = {
  id: GameId;
  name: string;
  tagline: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: string; // tailwind gradient classes
  multiplayer: boolean;
};

const GAMES: GameMeta[] = [
  {
    id: "click-rush",
    name: "Click Rush",
    tagline: "Tap the dot · 15s",
    Icon: Target,
    tone: "from-rose-500 to-orange-400",
    multiplayer: true,
  },
  {
    id: "memory-flip",
    name: "Memory Flip",
    tagline: "Match 8 pairs",
    Icon: Brain,
    tone: "from-violet-500 to-fuchsia-400",
    multiplayer: true,
  },
  {
    id: "tic-tac-toe",
    name: "Cross & Zero",
    tagline: "1v1 classic",
    Icon: Hash,
    tone: "from-sky-500 to-emerald-400",
    multiplayer: true,
  },
];

type Teammate = { name: string; status: "online" | "away" | "offline" };
const TEAMMATES: Teammate[] = [
  { name: "Mira", status: "online" },
  { name: "Aiden", status: "online" },
  { name: "Priya", status: "away" },
  { name: "Leo", status: "online" },
  { name: "Zara", status: "offline" },
];

function GamesPage() {
  const [open, setOpen] = useState<GameId | null>(null);
  const active = GAMES.find((g) => g.id === open) ?? null;

  return (
    <AppShell>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Gamepad2 className="size-6 text-primary" /> Arcade
            </h1>
            <p className="text-sm text-muted-foreground">
              Tap an app to play. Invite a teammate for a quick match.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
              <Trophy className="size-3.5 text-amber-500" /> Weekly champ:{" "}
              <strong className="ml-1">Mira</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
              <Zap className="size-3.5 text-primary" /> Streak:{" "}
              <strong className="ml-1">3 days</strong>
            </span>
          </div>
        </div>

        {!active ? (
          <AppGrid onOpen={setOpen} />
        ) : (
          <GameLauncher game={active} onBack={() => setOpen(null)} />
        )}
      </div>
    </AppShell>
  );
}

/* ---------------- App grid ---------------- */
function AppGrid({ onOpen }: { onOpen: (id: GameId) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {GAMES.map((g) => (
        <button
          key={g.id}
          onClick={() => onOpen(g.id)}
          className="group flex flex-col items-center gap-2 focus:outline-none"
        >
          <div
            className={`relative size-20 rounded-2xl bg-gradient-to-br ${g.tone} shadow-lg shadow-black/10 grid place-items-center transition-all duration-200 group-hover:-translate-y-1 group-hover:scale-105 group-active:scale-95`}
          >
            <g.Icon className="size-9 text-white drop-shadow" />
            <span className="absolute inset-0 rounded-2xl ring-1 ring-white/20" />
          </div>
          <div className="text-center">
            <div className="text-sm font-medium leading-tight">{g.name}</div>
            <div className="text-[11px] text-muted-foreground">{g.tagline}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ---------------- Intro splash (game-start scene) ---------------- */
function IntroScene({ game, onSkip }: { game: GameMeta; onSkip: () => void }) {
  return (
    <button
      onClick={onSkip}
      className={`relative w-full overflow-hidden rounded-2xl border bg-gradient-to-br ${game.tone} text-white min-h-[420px] grid place-items-center cursor-pointer`}
      aria-label="Skip intro"
    >
      {/* animated rings */}
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <span className="absolute size-40 rounded-full bg-white/10 animate-ping" />
        <span className="absolute size-64 rounded-full bg-white/5 animate-ping [animation-delay:200ms]" />
        <span className="absolute size-96 rounded-full bg-white/5 animate-ping [animation-delay:400ms]" />
      </div>
      {/* sparkles */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className="absolute size-1.5 rounded-full bg-white animate-pulse"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              animationDelay: `${(i % 8) * 120}ms`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center gap-4 animate-scale-in">
        <div className="size-24 rounded-3xl bg-white/15 backdrop-blur-sm grid place-items-center ring-2 ring-white/30 shadow-2xl">
          <game.Icon className="size-12 text-white drop-shadow-lg" />
        </div>
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.3em] text-white/70">
            Now loading
          </div>
          <div className="text-3xl font-bold tracking-tight mt-1 drop-shadow">
            {game.name}
          </div>
          <div className="text-sm text-white/80 mt-1">{game.tagline}</div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-white animate-bounce" />
          <span className="size-1.5 rounded-full bg-white animate-bounce [animation-delay:120ms]" />
          <span className="size-1.5 rounded-full bg-white animate-bounce [animation-delay:240ms]" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/60">
          Tap to skip
        </div>
      </div>
    </button>
  );
}

/* ---------------- Countdown 3-2-1 scene ---------------- */
function CountdownScene({
  game,
  count,
  opponent,
}: {
  game: GameMeta;
  count: number;
  opponent: string;
}) {
  const label = count > 0 ? String(count) : "GO!";
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border bg-gradient-to-br ${game.tone} text-white min-h-[420px] grid place-items-center`}
    >
      <div className="absolute inset-0 grid place-items-center pointer-events-none">
        <span
          key={count}
          className="absolute size-72 rounded-full bg-white/15 animate-ping"
        />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="text-xs uppercase tracking-[0.3em] text-white/80">
          {opponent === "Solo" ? "Solo run" : `vs ${opponent}`}
        </div>
        <div
          key={count}
          className="text-[8rem] leading-none font-black tracking-tighter drop-shadow-2xl animate-scale-in"
        >
          {label}
        </div>
        <div className="text-sm text-white/80">{game.name} starting…</div>
      </div>
    </div>
  );
}

/* ---------------- Launcher with invite + game ---------------- */
type Invite = {
  teammate: Teammate | null;
  status: "idle" | "waiting" | "joined";
};

type Phase = "intro" | "lobby" | "countdown" | "playing";

function GameLauncher({ game, onBack }: { game: GameMeta; onBack: () => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [count, setCount] = useState(3);
  const [invite, setInvite] = useState<Invite>({ teammate: null, status: "idle" });

  // Intro splash → lobby
  useEffect(() => {
    if (phase !== "intro") return;
    const t = setTimeout(() => setPhase("lobby"), 1700);
    return () => clearTimeout(t);
  }, [phase]);

  // Countdown 3 → 2 → 1 → playing
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count <= 0) {
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 700);
    return () => clearTimeout(t);
  }, [phase, count]);

  // Simulate teammate accepting after a short delay
  useEffect(() => {
    if (invite.status !== "waiting") return;
    const t = setTimeout(() => setInvite((i) => ({ ...i, status: "joined" })), 1800);
    return () => clearTimeout(t);
  }, [invite.status]);

  const opponentName =
    invite.status === "joined" && invite.teammate ? invite.teammate.name : "Solo";

  const beginCountdown = () => {
    setCount(3);
    setPhase("countdown");
  };

  if (phase === "intro") {
    return <IntroScene game={game} onSkip={() => setPhase("lobby")} />;
  }

  if (phase === "countdown") {
    return <CountdownScene game={game} count={count} opponent={opponentName} />;
  }

  return (
    <Card className="p-5 space-y-5 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" /> Apps
          </Button>
          <div
            className={`size-12 rounded-xl bg-gradient-to-br ${game.tone} grid place-items-center shadow`}
          >
            <game.Icon className="size-6 text-white" />
          </div>
          <div>
            <div className="font-semibold">{game.name}</div>
            <div className="text-xs text-muted-foreground">{game.tagline}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
            Opponent: <strong className="ml-1">{opponentName}</strong>
          </span>
        </div>
      </div>

      {phase === "lobby" ? (
        <Lobby
          game={game}
          invite={invite}
          setInvite={setInvite}
          onStart={beginCountdown}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setPhase("lobby")}>
              <RotateCcw className="size-3.5" /> End match
            </Button>
          </div>
          {game.id === "click-rush" && <ClickRush opponent={opponentName} />}
          {game.id === "memory-flip" && <MemoryFlip opponent={opponentName} />}
          {game.id === "tic-tac-toe" && <TicTacToe opponent={opponentName} />}
        </div>
      )}
    </Card>
  );
}

function Lobby({
  game,
  invite,
  setInvite,
  onStart,
}: {
  game: GameMeta;
  invite: Invite;
  setInvite: (i: Invite) => void;
  onStart: () => void;
}) {
  const sortedTeammates = useMemo(
    () =>
      [...TEAMMATES].sort((a, b) => {
        const order = { online: 0, away: 1, offline: 2 } as const;
        return order[a.status] - order[b.status];
      }),
    [],
  );

  return (
    <div className="grid md:grid-cols-2 gap-5">
      <div className="rounded-xl border p-5 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" /> Ready to play
        </div>
        <div className="mt-2 text-lg font-semibold">{game.name}</div>
        <p className="text-sm text-muted-foreground mt-1">
          Start a quick solo round, or invite an online teammate for a 1v1.
        </p>
        <div className="mt-4 flex gap-2">
          <Button onClick={onStart}>
            <Zap className="size-4" />
            {invite.status === "joined" ? `Play vs ${invite.teammate?.name}` : "Start solo"}
          </Button>
          {invite.status === "waiting" && (
            <Button
              variant="outline"
              onClick={() => setInvite({ teammate: null, status: "idle" })}
            >
              <XIcon className="size-4" /> Cancel invite
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border p-5">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <UserPlus className="size-3.5 text-primary" /> Invite teammate
          </div>
          <span className="text-[11px] text-muted-foreground">
            {sortedTeammates.filter((t) => t.status === "online").length} online
          </span>
        </div>
        <ul className="mt-3 divide-y">
          {sortedTeammates.map((t) => {
            const isInvited = invite.teammate?.name === t.name;
            const dot =
              t.status === "online"
                ? "bg-emerald-500"
                : t.status === "away"
                  ? "bg-amber-500"
                  : "bg-muted-foreground/40";
            return (
              <li key={t.name} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="relative inline-flex size-8 rounded-full bg-muted text-xs font-semibold items-center justify-center">
                    {t.name[0]}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-background ${dot}`}
                    />
                  </span>
                  <div>
                    <div className="text-sm font-medium leading-tight">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground capitalize">
                      {t.status}
                    </div>
                  </div>
                </div>
                {isInvited && invite.status === "waiting" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Circle className="size-2 fill-amber-500 text-amber-500 animate-pulse" />
                    Waiting…
                  </span>
                ) : isInvited && invite.status === "joined" ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <Check className="size-3.5" /> Joined
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant={t.status === "online" ? "default" : "outline"}
                    disabled={t.status !== "online" || invite.status === "waiting"}
                    onClick={() => setInvite({ teammate: t, status: "waiting" })}
                  >
                    Invite
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- Click Rush ---------------- */
function ClickRush({ opponent }: { opponent: string }) {
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(15);
  const [score, setScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [target, setTarget] = useState({ x: 50, y: 50 });
  const versus = opponent !== "Solo";

  useEffect(() => {
    if (!running) return;
    if (time <= 0) {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setTime((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [running, time]);

  // Simulated opponent taps
  useEffect(() => {
    if (!running || !versus) return;
    const id = setInterval(
      () => setOppScore((s) => s + 1),
      350 + Math.random() * 250,
    );
    return () => clearInterval(id);
  }, [running, versus]);

  const start = () => {
    setScore(0);
    setOppScore(0);
    setTime(15);
    setRunning(true);
    move();
  };
  const move = () =>
    setTarget({ x: 8 + Math.random() * 84, y: 12 + Math.random() * 76 });
  const hit = () => {
    if (!running) return;
    setScore((s) => s + 1);
    move();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <span className="tabular">⏱ {time}s</span>
          <span className="tabular">⭐ You {score}</span>
          {versus && <span className="tabular">🤝 {opponent} {oppScore}</span>}
        </div>
        <Button size="sm" onClick={start} variant={running ? "outline" : "default"}>
          <RotateCcw className="size-3.5" />
          {running ? "Restart" : score || oppScore ? "Play again" : "Start"}
        </Button>
      </div>

      <div className="relative h-64 rounded-lg border bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        {!running && time === 15 && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            Press Start and chase the dot.
          </div>
        )}
        {!running && time === 0 && (
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-3xl font-semibold">
                {versus
                  ? score > oppScore
                    ? "You win 🏆"
                    : score < oppScore
                      ? `${opponent} wins`
                      : "Draw 🤝"
                  : `${score} hits`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                You {score} · {versus ? `${opponent} ${oppScore}` : "Nice run!"}
              </div>
            </div>
          </div>
        )}
        {running && (
          <button
            onClick={hit}
            className="absolute size-10 rounded-full bg-primary shadow-lg ring-4 ring-primary/20 transition-all hover:scale-110"
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            aria-label="hit"
          />
        )}
      </div>
    </div>
  );
}

/* ---------------- Memory Flip ---------------- */
const ICONS = ["🎬", "🎨", "🎧", "🎯", "🚀", "🌈", "⚡", "🧠"];
type CardT = { id: number; icon: string; flipped: boolean; matched: boolean };

function shuffle(): CardT[] {
  return [...ICONS, ...ICONS]
    .map((icon, i) => ({ id: i, icon, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5);
}

function MemoryFlip({ opponent }: { opponent: string }) {
  const [deck, setDeck] = useState<CardT[]>(shuffle);
  const [pick, setPick] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [scores, setScores] = useState({ you: 0, opp: 0 });
  const [turn, setTurn] = useState<"you" | "opp">("you");
  const versus = opponent !== "Solo";
  const won = deck.every((c) => c.matched);

  useEffect(() => {
    if (pick.length !== 2) return;
    const [a, b] = pick;
    setMoves((m) => m + 1);
    const t = setTimeout(() => {
      setDeck((d) => {
        const match = d[a].icon === d[b].icon;
        if (match) {
          setScores((s) =>
            turn === "you" ? { ...s, you: s.you + 1 } : { ...s, opp: s.opp + 1 },
          );
        } else if (versus) {
          setTurn((t) => (t === "you" ? "opp" : "you"));
        }
        return d.map((c, i) =>
          i === a || i === b
            ? match
              ? { ...c, matched: true, flipped: true }
              : { ...c, flipped: false }
            : c,
        );
      });
      setPick([]);
    }, 650);
    return () => clearTimeout(t);
  }, [pick, turn, versus]);

  // Simulated opponent move
  useEffect(() => {
    if (!versus || turn !== "opp" || won || pick.length) return;
    const t = setTimeout(() => {
      const free = deck
        .map((c, i) => (!c.matched && !c.flipped ? i : -1))
        .filter((i) => i >= 0);
      if (free.length < 2) return;
      const a = free[Math.floor(Math.random() * free.length)];
      const b = free.filter((i) => i !== a)[Math.floor(Math.random() * (free.length - 1))];
      setDeck((d) => d.map((c, i) => (i === a || i === b ? { ...c, flipped: true } : c)));
      setPick([a, b]);
    }, 700);
    return () => clearTimeout(t);
  }, [versus, turn, won, pick.length, deck]);

  const flip = (i: number) => {
    if (versus && turn !== "you") return;
    if (pick.length === 2) return;
    if (deck[i].flipped || deck[i].matched) return;
    setDeck((d) => d.map((c, idx) => (idx === i ? { ...c, flipped: true } : c)));
    setPick((p) => [...p, i]);
  };

  const reset = () => {
    setDeck(shuffle());
    setPick([]);
    setMoves(0);
    setScores({ you: 0, opp: 0 });
    setTurn("you");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <span className="tabular">moves {moves}</span>
          <span className="tabular">⭐ You {scores.you}</span>
          {versus && <span className="tabular">🤝 {opponent} {scores.opp}</span>}
          {versus && (
            <span className="text-xs text-muted-foreground">
              Turn: {turn === "you" ? "You" : opponent}
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="size-3.5" />
          Shuffle
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-2 max-w-md">
        {deck.map((c, i) => (
          <button
            key={c.id}
            onClick={() => flip(i)}
            className={`aspect-square rounded-lg text-2xl grid place-items-center transition-all duration-300 ${
              c.flipped || c.matched
                ? "bg-primary/10 border-2 border-primary/40"
                : "bg-muted/60 hover:bg-muted border-2 border-transparent hover:scale-[1.03]"
            } ${c.matched ? "opacity-70" : ""}`}
          >
            <span
              className={`transition-opacity ${
                c.flipped || c.matched ? "opacity-100" : "opacity-0"
              }`}
            >
              {c.icon}
            </span>
          </button>
        ))}
      </div>

      {won && (
        <div className="text-sm text-primary font-medium">
          🏆{" "}
          {versus
            ? scores.you > scores.opp
              ? "You win!"
              : scores.you < scores.opp
                ? `${opponent} wins!`
                : "Draw!"
            : `Cleared in ${moves} moves!`}
        </div>
      )}
    </div>
  );
}

/* ---------------- Tic Tac Toe ---------------- */
type Cell = "X" | "O" | null;
const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];
function checkWin(b: Cell[]): { winner: Cell; line: number[] | null } {
  for (const line of LINES) {
    const [a, b1, c] = line;
    if (b[a] && b[a] === b[b1] && b[a] === b[c]) return { winner: b[a], line };
  }
  return { winner: null, line: null };
}

function TicTacToe({ opponent }: { opponent: string }) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<"X" | "O">("X");
  const [score, setScore] = useState({ X: 0, O: 0, draws: 0 });
  const versus = opponent !== "Solo";

  const { winner, line } = checkWin(board);
  const draw = !winner && board.every((c) => c !== null);
  const done = !!winner || draw;

  const play = (i: number) => {
    if (board[i] || done) return;
    if (versus && turn === "O") return;
    const next = board.slice();
    next[i] = turn;
    setBoard(next);
    const r = checkWin(next);
    if (r.winner) {
      setScore((s) => ({ ...s, [r.winner as "X" | "O"]: s[r.winner as "X" | "O"] + 1 }));
    } else if (next.every((c) => c !== null)) {
      setScore((s) => ({ ...s, draws: s.draws + 1 }));
    } else {
      setTurn(turn === "X" ? "O" : "X");
    }
  };

  // Simulated opponent move
  useEffect(() => {
    if (!versus || turn !== "O" || done) return;
    const t = setTimeout(() => {
      const free = board.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
      if (!free.length) return;
      const i = free[Math.floor(Math.random() * free.length)];
      const next = board.slice();
      next[i] = "O";
      setBoard(next);
      const r = checkWin(next);
      if (r.winner) {
        setScore((s) => ({ ...s, O: s.O + 1 }));
      } else if (next.every((c) => c !== null)) {
        setScore((s) => ({ ...s, draws: s.draws + 1 }));
      } else {
        setTurn("X");
      }
    }, 600);
    return () => clearTimeout(t);
  }, [versus, turn, done, board]);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
  };

  const status = winner
    ? `${winner === "X" ? "You" : opponent} win${winner === "X" ? "" : "s"}! 🎉`
    : draw
      ? "It's a draw 🤝"
      : `${turn === "X" ? "Your" : `${opponent}'s`} turn`;

  return (
    <div className="grid md:grid-cols-[auto_1fr] gap-5 items-center">
      <div className="grid grid-cols-3 gap-2 mx-auto">
        {board.map((c, i) => {
          const winning = line?.includes(i);
          return (
            <button
              key={i}
              onClick={() => play(i)}
              disabled={!!c || done}
              className={`size-20 rounded-lg border-2 grid place-items-center text-3xl font-bold transition-all ${
                winning
                  ? "border-primary bg-primary/15 text-primary scale-105"
                  : c
                    ? "border-border bg-muted/40"
                    : "border-dashed border-border hover:border-primary/60 hover:bg-primary/5"
              } ${c === "X" ? "text-primary" : c === "O" ? "text-amber-500" : ""}`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="text-sm font-medium">{status}</div>
        <div className="grid grid-cols-3 gap-2 max-w-sm">
          <div className="rounded-md border p-2.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">You (X)</div>
            <div className="text-xl font-semibold tabular text-primary">{score.X}</div>
          </div>
          <div className="rounded-md border p-2.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {opponent} (O)
            </div>
            <div className="text-xl font-semibold tabular text-amber-500">{score.O}</div>
          </div>
          <div className="rounded-md border p-2.5">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Draws</div>
            <div className="text-xl font-semibold tabular">{score.draws}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="size-3.5" /> New round
          </Button>
        </div>
      </div>
    </div>
  );
}
