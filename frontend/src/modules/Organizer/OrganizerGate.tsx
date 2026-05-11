import { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

/**
 * Lightweight PIN gate for the `/organizer` route.
 *
 * Compares the entered value against `VITE_ORG_PIN` (build-time
 * env var injected by Vercel for the production deploy). This is
 * intentionally not a real auth flow — the meetup is a one-shot
 * event and the worst case of a leaked PIN is an outsider editing
 * the keyword list mid-game. Anything more sensitive should NOT
 * live behind this gate.
 *
 * The PIN is checked client-side only. Server endpoints
 * (AMB-018 routes) are still callable directly by anyone with
 * network access — adding real auth is tracked as a follow-up
 * concern in the AMB-018 ticket.
 */
export interface OrganizerGateProps {
  children: React.ReactNode;
}

export function OrganizerGate({ children }: OrganizerGateProps) {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (unlocked) return <>{children}</>;

  const expected = (import.meta.env.VITE_ORG_PIN as string | undefined) ?? "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === expected && expected.length > 0) {
      setUnlocked(true);
      setError(null);
    } else {
      setError("PIN이 일치하지 않습니다.");
    }
  };

  return (
    <Box sx={{ maxWidth: 320, mx: "auto", mt: 8 }}>
      <Typography variant="h5" mb={2}>
        Organizer
      </Typography>
      <form onSubmit={submit}>
        <TextField
          label="PIN"
          type="password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          fullWidth
          autoFocus
          error={Boolean(error)}
          helperText={error ?? " "}
        />
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 1 }}>
          입장
        </Button>
      </form>
    </Box>
  );
}
