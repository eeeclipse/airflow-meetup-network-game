import { Box } from "@mui/material";
import { BOARD_COLS, BOARD_ROWS } from "../../config/game";
import { findCompletedLines } from "../../lib/bingoLines";
import { KeywordChipWithTooltip } from "../../components/KeywordChip/KeywordChipWithTooltip";
import { WindmillOverlay } from "../../components/BingoCell/WindmillOverlay";
import { AIRFLOW_KEYWORDS } from "../../data/airflowKeywords";

/**
 * Lookup table from canonical keyword label → curated description.
 * Built once at module load. If an organizer adds a custom keyword
 * at runtime (AMB-018), it won't be in this map and the tooltip
 * falls back to the label.
 */
const DESCRIPTION_BY_LABEL = new Map(
  AIRFLOW_KEYWORDS.map((k) => [k.label, k.description]),
);

export interface BoardCell {
  label: string;
}

export interface BoardProps {
  /**
   * Row-major cells. Length must equal BOARD_CELLS. Each cell
   * carries only the label — the description is looked up
   * client-side from the curated pool.
   */
  cells: BoardCell[];
  /** Set of cell indices that have been marked by an exchange. */
  markedIdx: Set<number>;
}

/**
 * Airflow Meetup Bingo board (AMB-017).
 *
 * Renders the BOARD_ROWS × BOARD_COLS grid of
 * `KeywordChipWithTooltip` chips, computes completed bingo lines
 * once per render via `findCompletedLines`, and stacks a glowing
 * `WindmillOverlay` on every cell that belongs to a completed
 * line. Stateless — the surrounding game module owns the
 * `markedIdx` set and Realtime subscriptions.
 */
export function Board({ cells, markedIdx }: BoardProps) {
  const completedCellIdx = new Set(
    findCompletedLines(markedIdx, BOARD_ROWS).flat(),
  );

  return (
    <Box
      data-testid="bingo-board"
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${BOARD_COLS}, 1fr)`,
        gap: 1,
      }}
    >
      {cells.map((cell, idx) => {
        const isMarked = markedIdx.has(idx);
        const isLineComplete = completedCellIdx.has(idx);
        return (
          <Box key={idx} sx={{ position: "relative" }}>
            <KeywordChipWithTooltip
              label={cell.label}
              description={DESCRIPTION_BY_LABEL.get(cell.label) ?? cell.label}
              marked={isMarked}
              lineComplete={isLineComplete}
            />
            <WindmillOverlay active={isLineComplete} />
          </Box>
        );
      })}
    </Box>
  );
}
