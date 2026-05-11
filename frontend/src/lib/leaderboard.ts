/**
 * Final-leaderboard tiebreak.
 *
 * Spec §2 ordering:
 *   1. Most completed lines (DESC)
 *   2. Most marked cells (DESC)  ← tiebreaker
 *   3. Earliest sum of mark timestamps (ASC) ← stronger tiebreaker
 *
 * Pure function — call after the cutoff with one row per
 * participant. Does not mutate the input array.
 */
export interface LBRow {
  /** Stable participant id (Supabase anonymous user id). */
  id: string;
  /** Number of completed bingo lines. */
  lines: number;
  /** Number of marked cells on the board. */
  cells: number;
  /** Sum of `mark.timestampMs` across all marks. Lower wins. */
  sumMs: number;
}

export function rankUsers(rows: LBRow[]): LBRow[] {
  return [...rows].sort(
    (x, y) =>
      y.lines - x.lines ||
      y.cells - x.cells ||
      x.sumMs - y.sumMs,
  );
}
