import { useEffect, useState } from "react";

/**
 * Drift-aware countdown driven by the BE `/api/events/{id}/cutoff`
 * endpoint (AMB-015). Fetches once on mount, computes the offset
 * between the server clock and the local clock, then ticks every
 * second against the cutoff using the drift-adjusted time so an
 * inaccurate device clock still displays the right remaining
 * seconds.
 *
 * Returns `null` until the first fetch settles, and after the
 * fetch when `cutoff_at` is null (legacy events with no
 * configured cutoff). Clamps at 0 once the cutoff has passed.
 */
export interface UseServerCountdownResult {
  remainingSec: number | null;
}

interface CutoffResponse {
  now: string; // ISO8601
  cutoff_at: string | null; // ISO8601 or null
}

export function useServerCountdown(eventId: number | string): UseServerCountdownResult {
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let driftMs = 0;
    let cutoffMs: number | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (cancelled || cutoffMs === null) return;
      const left = Math.max(
        0,
        Math.floor((cutoffMs - (Date.now() + driftMs)) / 1000),
      );
      setRemainingSec(left);
    };

    (async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/cutoff`);
        const body: CutoffResponse = await res.json();
        if (cancelled) return;

        driftMs = new Date(body.now).getTime() - Date.now();
        if (body.cutoff_at) {
          cutoffMs = new Date(body.cutoff_at).getTime();
          tick();
          intervalId = setInterval(tick, 1000);
        }
        // If cutoff_at is null, leave remainingSec at null. The UI
        // can interpret null as "no active session window".
      } catch {
        // Network errors are non-fatal — the UI degrades to the
        // null state and can render a static message.
      }
    })();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [eventId]);

  return { remainingSec };
}
