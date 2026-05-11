import { Tooltip, Box } from "@mui/material";

export interface KeywordChipWithTooltipProps {
  /** Keyword label rendered inside the chip. */
  label: string;
  /** Plain-text description shown in the tooltip on hover. */
  description: string;
  /** Whether the underlying board cell has been marked by an exchange. */
  marked: boolean;
  /**
   * Whether this cell is part of a completed bingo line. When true the chip
   * background still uses the marked color, but a `WindmillOverlay` is
   * expected to render on top in the parent Board grid. The component just
   * exposes `data-line-complete` so consumers + tests can hook in.
   */
  lineComplete?: boolean;
}

/**
 * A single board cell. Renders the keyword in JetBrains Mono, gives marked
 * cells the Airflow teal background, and shows a description tooltip on
 * hover so participants can learn unfamiliar Airflow concepts during the
 * meetup networking session.
 */
export function KeywordChipWithTooltip({
  label,
  description,
  marked,
  lineComplete = false,
}: KeywordChipWithTooltipProps) {
  return (
    <Tooltip title={description} arrow placement="top">
      <Box
        data-marked={marked ? "true" : "false"}
        data-line-complete={lineComplete ? "true" : "false"}
        sx={{
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 14,
          lineHeight: 1.3,
          textAlign: "center",
          padding: 1.5,
          borderRadius: 1,
          bgcolor: marked ? "primary.main" : "background.paper",
          color: marked ? "common.white" : "text.primary",
          transition: "background-color 200ms ease",
          userSelect: "none",
          cursor: "default",
        }}
      >
        {label}
      </Box>
    </Tooltip>
  );
}
