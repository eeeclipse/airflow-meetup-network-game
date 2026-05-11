/**
 * Airflow Meetup Bingo — game configuration.
 *
 * Single source of truth for board geometry, selection rules, and
 * session length. Imported by board renderers, line detection,
 * keyword pick hook, countdown hook, and tests.
 *
 * Board size decision: option B (5x5) per AMB-010 — the upstream
 * `events.board_size` enum already supports 5 so no schema change
 * is needed, and 25 cells gives ~11 partner exchanges in 45min
 * which is comfortable conversational pacing.
 */

export const BOARD_ROWS = 5;
export const BOARD_COLS = 5;
export const BOARD_CELLS = BOARD_ROWS * BOARD_COLS; // 25

export const KEYWORDS_TO_PICK = 7;
export const SESSION_MINUTES = 45;
