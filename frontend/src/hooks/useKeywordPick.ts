import { useCallback, useMemo, useState } from "react";
import { KEYWORDS_TO_PICK } from "../config/game";

export interface UseKeywordPickResult {
  /** Ordered list of currently-selected keyword labels. */
  selected: string[];
  /** Toggle a keyword. If selected, removes it. If unselected and the
   *  cap has not been reached, appends it. Otherwise no-op. */
  toggle: (keyword: string) => void;
  /** True when exactly `KEYWORDS_TO_PICK` keywords are selected. */
  isComplete: boolean;
}

/**
 * Local-state hook for the keyword selection screen. Enforces the
 * 7-pick cap from spec §2 / game.ts so the "시작" button can be
 * disabled until the user reaches `isComplete`.
 *
 * Selection order is preserved — participants see their picks in the
 * order they tapped, which makes the UI feel responsive on touch.
 */
export function useKeywordPick(initial: string[] = []): UseKeywordPickResult {
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = useCallback((keyword: string) => {
    setSelected((prev) => {
      if (prev.includes(keyword)) {
        return prev.filter((k) => k !== keyword);
      }
      if (prev.length >= KEYWORDS_TO_PICK) {
        return prev;
      }
      return [...prev, keyword];
    });
  }, []);

  const isComplete = useMemo(
    () => selected.length === KEYWORDS_TO_PICK,
    [selected],
  );

  return { selected, toggle, isComplete };
}
