import { describe, it, expect } from "vitest";
import { findCompletedLines } from "./bingoLines";

describe("findCompletedLines", () => {
  describe("4x4", () => {
    it("detects a completed top row", () => {
      const marked = new Set([0, 1, 2, 3]);
      expect(findCompletedLines(marked, 4)).toEqual([[0, 1, 2, 3]]);
    });

    it("detects a completed column", () => {
      const marked = new Set([1, 5, 9, 13]);
      const result = findCompletedLines(marked, 4);
      expect(result).toContainEqual([1, 5, 9, 13]);
    });

    it("detects the main diagonal", () => {
      const marked = new Set([0, 5, 10, 15]);
      expect(findCompletedLines(marked, 4)).toContainEqual([0, 5, 10, 15]);
    });

    it("detects the anti-diagonal", () => {
      const marked = new Set([3, 6, 9, 12]);
      expect(findCompletedLines(marked, 4)).toContainEqual([3, 6, 9, 12]);
    });
  });

  describe("5x5", () => {
    it("detects a completed middle row", () => {
      const marked = new Set([10, 11, 12, 13, 14]);
      expect(findCompletedLines(marked, 5)).toContainEqual([
        10, 11, 12, 13, 14,
      ]);
    });

    it("detects the main diagonal", () => {
      const marked = new Set([0, 6, 12, 18, 24]);
      expect(findCompletedLines(marked, 5)).toContainEqual([
        0, 6, 12, 18, 24,
      ]);
    });

    it("detects the anti-diagonal", () => {
      const marked = new Set([4, 8, 12, 16, 20]);
      expect(findCompletedLines(marked, 5)).toContainEqual([
        4, 8, 12, 16, 20,
      ]);
    });
  });

  it("returns empty when nothing is marked", () => {
    expect(findCompletedLines(new Set(), 5)).toEqual([]);
  });

  it("returns empty when nothing completes a line", () => {
    expect(findCompletedLines(new Set([0, 1, 2]), 5)).toEqual([]);
  });

  it("returns multiple lines when several complete at once", () => {
    // First row + first column on a 4x4 board.
    const marked = new Set([0, 1, 2, 3, 4, 8, 12]);
    const lines = findCompletedLines(marked, 4);
    expect(lines).toContainEqual([0, 1, 2, 3]); // row 0
    expect(lines).toContainEqual([0, 4, 8, 12]); // col 0
    expect(lines.length).toBe(2);
  });
});
