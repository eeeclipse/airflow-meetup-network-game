import { describe, it, expect } from "vitest";
import {
  BOARD_ROWS,
  BOARD_COLS,
  BOARD_CELLS,
  KEYWORDS_TO_PICK,
  SESSION_MINUTES,
} from "./game";

describe("game config", () => {
  it("uses a 5x5 board (option B per AMB-010)", () => {
    expect(BOARD_ROWS).toBe(5);
    expect(BOARD_COLS).toBe(5);
  });

  it("derives BOARD_CELLS from ROWS * COLS", () => {
    expect(BOARD_CELLS).toBe(BOARD_ROWS * BOARD_COLS);
    expect(BOARD_CELLS).toBe(25);
  });

  it("asks participants to pick 7 keywords (spec §2)", () => {
    expect(KEYWORDS_TO_PICK).toBe(7);
  });

  it("runs a 45-minute networking session (spec §2)", () => {
    expect(SESSION_MINUTES).toBe(45);
  });
});
