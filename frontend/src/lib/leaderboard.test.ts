import { describe, it, expect } from "vitest";
import { rankUsers, type LBRow } from "./leaderboard";

const u = (id: string, lines: number, cells: number, sumMs: number): LBRow =>
  ({ id, lines, cells, sumMs });

describe("rankUsers", () => {
  it("orders by lines DESC, cells DESC, sumMs ASC", () => {
    const rows: LBRow[] = [
      u("a", 2, 8, 1000),
      u("b", 3, 6, 999),
      u("c", 2, 8, 500),
      u("d", 2, 9, 9999),
    ];
    expect(rankUsers(rows).map((r) => r.id)).toEqual(["b", "d", "c", "a"]);
  });

  it("returns an empty array for empty input", () => {
    expect(rankUsers([])).toEqual([]);
  });

  it("passes a single row through unchanged", () => {
    const row = u("only", 0, 0, 0);
    expect(rankUsers([row])).toEqual([row]);
  });

  it("does not mutate the input array", () => {
    const rows: LBRow[] = [
      u("a", 1, 1, 1),
      u("b", 2, 2, 2),
    ];
    const snapshot = rows.map((r) => r.id);
    rankUsers(rows);
    expect(rows.map((r) => r.id)).toEqual(snapshot);
  });

  it("breaks lines tie with cells", () => {
    const ranked = rankUsers([
      u("less-cells", 2, 5, 100),
      u("more-cells", 2, 9, 100),
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["more-cells", "less-cells"]);
  });

  it("breaks lines+cells tie with earlier sumMs", () => {
    const ranked = rankUsers([
      u("slow", 2, 5, 9000),
      u("fast", 2, 5, 100),
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["fast", "slow"]);
  });
});
