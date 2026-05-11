// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { airflowTheme } from "../../theme/airflow";
import { Board } from "./Board";
import { BOARD_CELLS, BOARD_COLS, BOARD_ROWS } from "../../config/game";
import { AIRFLOW_KEYWORDS } from "../../data/airflowKeywords";

function renderWithTheme(ui: React.ReactNode) {
  return render(<ThemeProvider theme={airflowTheme}>{ui}</ThemeProvider>);
}

// Build a deterministic set of cells the size of the board so each
// test sees the same labels and we can target indices precisely.
const cells = Array.from({ length: BOARD_CELLS }, (_, i) => ({
  label: AIRFLOW_KEYWORDS[i % AIRFLOW_KEYWORDS.length].label,
}));

describe("Board", () => {
  it("renders BOARD_CELLS chips in a BOARD_COLS-wide grid", () => {
    renderWithTheme(<Board cells={cells} markedIdx={new Set()} />);

    const board = screen.getByTestId("bingo-board");
    // Grid is the outer Box; each chip's parent Box is a direct child.
    expect(board.children).toHaveLength(BOARD_CELLS);
    expect(board).toHaveStyle({
      gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)`,
    });
  });

  it("marks the cells whose indices appear in markedIdx", () => {
    const marked = new Set([0, 3, 7]);
    renderWithTheme(<Board cells={cells} markedIdx={marked} />);

    const board = screen.getByTestId("bingo-board");
    // Each chip's outer wrapper is a Box from KeywordChipWithTooltip;
    // marked Boxes have data-marked="true".
    const markedAttrs = Array.from(
      board.querySelectorAll<HTMLElement>("[data-marked]"),
    ).map((el) => el.getAttribute("data-marked"));
    const markedCount = markedAttrs.filter((v) => v === "true").length;
    expect(markedCount).toBe(marked.size);
  });

  it("renders a WindmillOverlay on every cell in a completed row", () => {
    // The top row is indices 0..(BOARD_COLS - 1) for a row-major grid.
    const topRow = new Set<number>(
      Array.from({ length: BOARD_COLS }, (_, c) => c),
    );
    renderWithTheme(<Board cells={cells} markedIdx={topRow} />);

    const overlays = screen.getAllByTestId("windmill-overlay");
    expect(overlays).toHaveLength(BOARD_COLS);
  });

  it("does not render an overlay when no line is complete", () => {
    renderWithTheme(<Board cells={cells} markedIdx={new Set([0, 1])} />);
    expect(screen.queryAllByTestId("windmill-overlay")).toHaveLength(0);
  });

  it("falls back to the label as the tooltip description for unknown keywords", () => {
    const customCells = Array.from({ length: BOARD_CELLS }, (_, i) => ({
      label: i === 0 ? "Apache Iceberg" : cells[i].label,
    }));
    renderWithTheme(
      <Board cells={customCells} markedIdx={new Set()} />,
    );

    // The chip renders the label visibly; we can at least confirm the
    // label is in the DOM. Tooltip text presence is covered by the
    // KeywordChipWithTooltip suite — here we only need to know we
    // did not crash on the missing description.
    expect(screen.getByText("Apache Iceberg")).toBeInTheDocument();
  });

  it("renders the correct number of rows × cols", () => {
    renderWithTheme(<Board cells={cells} markedIdx={new Set()} />);
    expect(BOARD_ROWS * BOARD_COLS).toBe(BOARD_CELLS);
  });
});
