import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * AMB-018 — organizer keyword pool editor.
 *
 * Lists the labels in `events.keywords`, lets the organizer
 * append a new label or remove an existing one. Operates against
 * the FastAPI endpoints added in the same ticket. Description
 * lookup for added labels happens client-side (AMB-008 map +
 * fallback), so the API only needs the label string.
 *
 * Wrapped at the route level by `OrganizerGate` so a PIN is
 * required to reach this UI in the browser. Note the server
 * endpoints themselves are unauthenticated — see ticket for the
 * security note.
 */
export interface KeywordPoolEditorProps {
  eventId: number | string;
}

export function KeywordPoolEditor({ eventId }: KeywordPoolEditorProps) {
  const [pool, setPool] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/keywords`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as string[];
      setPool(data);
      setError(null);
    } catch {
      setError("키워드 풀을 불러오지 못했습니다.");
    }
  }, [eventId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async () => {
    const trimmed = draft.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/events/${eventId}/keywords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: trimmed }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDraft("");
      await refresh();
    } catch {
      setError("키워드 추가에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (label: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/events/${eventId}/keywords/${encodeURIComponent(label)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
    } catch {
      setError(`'${label}' 삭제에 실패했습니다.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", p: 3 }}>
      <Typography variant="h5" mb={2}>
        키워드 풀 ({pool.length})
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" spacing={1} mb={3} component="form" onSubmit={(e) => {
        e.preventDefault();
        add();
      }}>
        <TextField
          label="키워드"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          size="small"
          sx={{ flex: 1 }}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!draft.trim() || busy}
        >
          추가
        </Button>
      </Stack>

      <List>
        {pool.map((label) => (
          <ListItem
            key={label}
            secondaryAction={
              <IconButton
                edge="end"
                aria-label={`${label} 삭제`}
                onClick={() => remove(label)}
                disabled={busy}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText primary={label} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
