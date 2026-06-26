import { useEffect, useState } from "react";

/** Returns elapsed seconds since `runningSince` (ISO), updating every second. */
export function useTimer(runningSince: string | undefined): number {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!runningSince) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [runningSince]);
  if (!runningSince) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(runningSince).getTime()) / 1000));
}

export function fmtHMS(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function fmtHMShort(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
