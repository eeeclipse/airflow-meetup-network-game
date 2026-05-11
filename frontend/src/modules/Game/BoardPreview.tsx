import { useMemo, useState } from "react";
import { Box, Stack, Typography, Button } from "@mui/material";
import { Board, type BoardCell } from "./Board";
import { AIRFLOW_KEYWORDS } from "../../data/airflowKeywords";
import { BOARD_CELLS } from "../../config/game";

/**
 * Self-contained interactive preview of the new Board component
 * (AMB-017a). Renders a deterministic 5x5 layout using the first
 * BOARD_CELLS keywords from the curated pool and lets the user
 * click cells to toggle their "marked" state. The point is to
 * exercise the Board + KeywordChipWithTooltip + WindmillOverlay +
 * findCompletedLines integration end-to-end in a real route so the
 * E2E spec (AMB-019) has a deterministic surface to drive without
 * needing the full anonymous-auth + Realtime pipeline.
 *
 * Not the real meetup game screen — that wires into the upstream
 * BingoGame which already understands the seeded event (id=3,
 * board_size=5, 30-keyword pool).
 */
export default function BoardPreview() {
  const cells: BoardCell[] = useMemo(
    () =>
      AIRFLOW_KEYWORDS.slice(0, BOARD_CELLS).map((k) => ({ label: k.label })),
    [],
  );
  const [markedIdx, setMarkedIdx] = useState<Set<number>>(new Set());

  const toggle = (idx: number) =>
    setMarkedIdx((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });

  const clear = () => setMarkedIdx(new Set());
  const completeFirstRow = () => setMarkedIdx(new Set([0, 1, 2, 3, 4]));

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", p: 3 }}>
      <Typography variant="h4" mb={1}>
        Board preview
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Click a chip to toggle its marked state. Complete a row to see the
        windmill overlay glow.
      </Typography>

      <Stack direction="row" spacing={1} mb={2}>
        <Button variant="outlined" onClick={completeFirstRow} data-testid="preview-fill-row">
          Fill first row
        </Button>
        <Button variant="outlined" onClick={clear} data-testid="preview-clear">
          Clear
        </Button>
      </Stack>

      <Box
        onClick={(e) => {
          const idxAttr = (e.target as HTMLElement)
            .closest<HTMLElement>("[data-cell-idx]")
            ?.dataset.cellIdx;
          if (idxAttr != null) toggle(Number(idxAttr));
        }}
      >
        {/* Wrap each cell with a data-cell-idx attribute so the
            click handler above can resolve the index without
            modifying the Board component's prop surface. */}
        <BoardWithClickIdx cells={cells} markedIdx={markedIdx} />
      </Box>
    </Box>
  );
}

function BoardWithClickIdx({
  cells,
  markedIdx,
}: {
  cells: BoardCell[];
  markedIdx: Set<number>;
}) {
  return (
    <Box position="relative">
      <Board cells={cells} markedIdx={markedIdx} />
      {/* Invisible click-target overlay grid with data-cell-idx so
          the outer onClick can identify which cell was tapped. We
          don't add the attribute inside Board itself so Board stays
          decoupled from interaction concerns. */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "grid",
          gridTemplateColumns: `repeat(${Math.sqrt(cells.length)}, 1fr)`,
          gap: 1,
          pointerEvents: "auto",
        }}
      >
        {cells.map((_, idx) => (
          <Box
            key={idx}
            data-cell-idx={idx}
            data-testid={`preview-cell-${idx}`}
            sx={{ cursor: "pointer", minHeight: 1 }}
          />
        ))}
      </Box>
    </Box>
  );
}
