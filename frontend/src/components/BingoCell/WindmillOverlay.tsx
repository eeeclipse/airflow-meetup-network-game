import Windmill from "../../assets/windmill.svg?react";
import { keyframes } from "@emotion/react";
import { Box } from "@mui/material";

const glow = keyframes`
  0% { filter: drop-shadow(0 0 0 #017CEE); }
  50% { filter: drop-shadow(0 0 12px #017CEE); }
  100% { filter: drop-shadow(0 0 0 #017CEE); }
`;

export interface WindmillOverlayProps {
  /** Render the overlay only when this cell belongs to a completed bingo line. */
  active: boolean;
}

/**
 * Absolutely-positioned overlay that sits on top of a `KeywordChipWithTooltip`
 * when its cell is part of a completed bingo line. Renders the Airflow
 * windmill mark with a pulsing teal glow. Pointer events disabled so the
 * underlying chip stays interactive.
 */
export function WindmillOverlay({ active }: WindmillOverlayProps) {
  if (!active) return null;
  return (
    <Box
      data-testid="windmill-overlay"
      data-glow="true"
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: `${glow} 1.6s ease-in-out infinite`,
        color: "primary.main",
        pointerEvents: "none",
      }}
    >
      <Windmill width="60%" height="60%" />
    </Box>
  );
}
