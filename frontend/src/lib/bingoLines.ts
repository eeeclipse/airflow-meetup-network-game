/**
 * Pure bingo line detection.
 *
 * Given the set of cell indices a participant has marked + the
 * board size (5 for our Airflow meetup per AMB-010), returns every
 * fully completed line: all rows, all columns, and both diagonals.
 *
 * Indices are linearized row-major: cell at (r, c) === r * size + c.
 *
 * The result drives WindmillOverlay rendering in the Board component
 * (AMB-017) and the lines-count metric that feeds the leaderboard
 * (AMB-012).
 */
export function findCompletedLines(
  marked: Set<number>,
  size: number,
): number[][] {
  const lines: number[][] = [];

  // Rows
  for (let r = 0; r < size; r++) {
    const row = Array.from({ length: size }, (_, c) => r * size + c);
    if (row.every((i) => marked.has(i))) lines.push(row);
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const col = Array.from({ length: size }, (_, r) => r * size + c);
    if (col.every((i) => marked.has(i))) lines.push(col);
  }

  // Main diagonal (top-left → bottom-right)
  const mainDiag = Array.from({ length: size }, (_, i) => i * size + i);
  if (mainDiag.every((i) => marked.has(i))) lines.push(mainDiag);

  // Anti-diagonal (top-right → bottom-left)
  const antiDiag = Array.from(
    { length: size },
    (_, i) => i * size + (size - 1 - i),
  );
  if (antiDiag.every((i) => marked.has(i))) lines.push(antiDiag);

  return lines;
}
